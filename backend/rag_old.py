# backend/rag.py - Enhanced version with better debugging
from dotenv import load_dotenv
load_dotenv()
import pdfplumber
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import hashlib
import numpy as np
from sentence_transformers import CrossEncoder
import datetime
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_client = None
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        logger.error("OpenAI API key not configured!")
        raise ValueError("OpenAI API key not configured")
    
    openai_client = OpenAI(api_key=api_key)
    logger.info("✓ OpenAI client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize OpenAI client: {e}")

COLLECTION_NAME = "ai_ta_docs"

# Initialize Qdrant client but don't create collection immediately
qdrant = None

def init_qdrant():
    """Initialize Qdrant connection and create collection if needed"""
    global qdrant
    
    if qdrant is None:
        try:
            qdrant = QdrantClient(host="localhost", port=6333)
            logger.info("✓ Connected to Qdrant")
            
            # Check if collection exists, create if it doesn't
            collections = qdrant.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if COLLECTION_NAME not in collection_names:
                qdrant.recreate_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
                logger.info(f"✓ Created collection: {COLLECTION_NAME}")
            else:
                logger.info(f"✓ Collection {COLLECTION_NAME} already exists")
                
        except Exception as e:
            logger.error(f"❌ Failed to connect to Qdrant: {e}")
            logger.error("Make sure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant")
            raise e
    
    return qdrant

def chunk_text(text, max_chars=500):
    """Split text into chunks of specified size"""
    if not text:
        return []
    return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]

def pdf_to_chunks(pdf_path):
    """Extract text from PDF and split into chunks"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text.strip() + "\n"
                    logger.info(f"Extracted {len(page_text)} characters from page {page_num + 1}")
        
        if not full_text.strip():
            logger.warning("No text extracted from PDF")
            return []
        
        chunks = chunk_text(full_text, max_chars=500)
        logger.info(f"Created {len(chunks)} chunks from PDF")
        return chunks
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise e

def get_embedding(text, batch_size=8):
    """Get embedding for a single text"""
    if not openai_client:
        raise ValueError("OpenAI client not initialized")
    
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=[text]
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error getting embedding: {e}")
        raise e

def get_embeddings_batch(texts, batch_size=8):
    """Get embeddings for multiple texts in batches"""
    if not openai_client:
        raise ValueError("OpenAI client not initialized")
    
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=batch
            )
            embeddings = [r.embedding for r in response.data]
            all_embeddings.extend(embeddings)
            logger.info(f"Got embeddings for batch {i//batch_size + 1}")
        except Exception as e:
            logger.error(f"Error getting embeddings for batch: {e}")
            raise e
    return all_embeddings

def upload_pdf(pdf_path):
    """Upload and process PDF file"""
    logger.info(f"Processing PDF: {pdf_path}")
    
    # Initialize Qdrant connection
    qdrant_client = init_qdrant()
    
    # Extract chunks from PDF
    chunks = pdf_to_chunks(pdf_path)
    if not chunks:
        raise ValueError("No text could be extracted from the PDF")
    
    points = []
    logger.info(f"Processing {len(chunks)} chunks from {pdf_path}")
    
    # Get embeddings for all chunks
    try:
        embeddings = get_embeddings_batch(chunks)
    except Exception as e:
        logger.error(f"Failed to get embeddings: {e}")
        raise e
    
    # Create points for Qdrant
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        hash_id = hashlib.md5(chunk.encode()).hexdigest()
        points.append(PointStruct(
            id=hash_id,
            vector=embedding,
            payload={
                "text": chunk,
                "date_uploaded": str(datetime.datetime.utcnow()),
                "source": pdf_path
            }
        ))
    
    # Upload to Qdrant
    try:
        qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
        logger.info(f"✓ Uploaded {len(points)} chunks to Qdrant")
    except Exception as e:
        logger.error(f"Failed to upload to Qdrant: {e}")
        raise e

# Initialize CrossEncoder
try:
    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    logger.info("✓ CrossEncoder initialized")
except Exception as e:
    logger.error(f"Failed to initialize CrossEncoder: {e}")
    cross_encoder = None

PROMPT_TEMPLATE = """
You are an AI Teaching Assistant designed to answer questions strictly based on uploaded lecture materials, textbooks, or course documents. Do not generate answers beyond retrieved evidence.

Use the following format for every interaction:

[START]
User Input: {user_input}
Context: {retrieved_context}
Context URL: {context_url}
Context Score: {similarity_score:.2f}
Assistant Thought: {"This context has sufficient information to answer the question." if similarity_score >= 0.6 else "The context does not have sufficient information to answer the question."}
Assistant Answer: {assistant_answer}
<END>

Policy:
- If the cosine similarity score is below 0.6, you must return: 
  "I'm sorry, I couldn't find enough relevant information in the uploaded materials to answer your question."
- Do NOT hallucinate or generate answers from prior knowledge.
- You MUST only generate answers based on retrieved and provided context.
- If the user input is out-of-scope or unrelated, respond with: 
  "The topic appears to be outside the scope of the uploaded materials."

<<FINAL ANSWER>> {assistant_answer}"""

def query_ai_ta(question, threshold=0.5, top_k=8, verbose=False):
    """Query the AI Teaching Assistant"""
    logger.info(f"Processing question: {question[:100]}...")
    
    if not openai_client:
        return "I'm sorry, the AI service is not properly configured. Please check the OpenAI API key."
    
    # Initialize Qdrant connection
    try:
        qdrant_client = init_qdrant()
    except Exception as e:
        logger.error(f"Qdrant connection failed: {e}")
        return "I'm sorry, there was an error accessing the document database. Please try again."

    # Step 1: Embed the question
    try:
        query_embedding = get_embedding(question)
        if verbose:
            logger.info("✓ Question embedded successfully")
    except Exception as e:
        logger.error(f"Failed to embed question: {e}")
        return "I'm sorry, there was an error processing your question. Please try again."

    # Step 2: Retrieve top_k docs from Qdrant using cosine similarity
    try:
        results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=top_k,
            with_payload=True
        )
        if verbose:
            logger.info(f"Retrieved {len(results)} results from Qdrant")
    except Exception as e:
        logger.error(f"Error searching Qdrant: {e}")
        return "I'm sorry, there was an error accessing the document database. Please try again."

    if not results:
        if verbose:
            logger.info("🔍 No results retrieved from Qdrant.")
        return "The information related to your question was not found in the course materials. Please make sure you've uploaded relevant documents."

    # Step 3: Check cosine similarity threshold
    best_score = results[0].score
    if verbose:
        logger.info(f"Best similarity score: {best_score:.4f}")
    
    if best_score < threshold:
        if verbose:
            logger.info(f"⚠️ Best cosine score {best_score:.4f} is below threshold ({threshold})")
        return "The information related to your question was not found in the course materials. Please try asking about topics covered in your uploaded documents."

    # Step 4: Rerank with CrossEncoder if available
    contexts = [r.payload['text'] for r in results]
    scores_cosine = [r.score for r in results]
    
    if cross_encoder:
        try:
            pairs = [[question, ctx] for ctx in contexts]
            scores_cross = cross_encoder.predict(pairs)
            best_idx = np.argmax(scores_cross)
            if verbose:
                logger.info("✓ CrossEncoder reranking completed")
        except Exception as e:
            logger.warning(f"CrossEncoder failed, using first result: {e}")
            best_idx = 0
    else:
        best_idx = 0
    
    best_context = contexts[best_idx]
    final_score = scores_cosine[best_idx]

    if verbose:
        logger.info(f"Selected context (score: {final_score:.4f}): {best_context[:200]}...")

    # Step 5: Format the final prompt
    prompt = PROMPT_TEMPLATE.format(
        user_input=question,
        retrieved_context=best_context,
        context_url="uploaded_document",
        similarity_score=final_score,
        assistant_answer="[TO BE GENERATED]"
    )

    if verbose:
        logger.info("Sending prompt to OpenAI...")

    # Step 6: Generate final response from OpenAI
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI Teaching Assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        final_answer = response.choices[0].message.content
        if verbose:
            logger.info("✓ OpenAI response generated successfully")
        
        return final_answer
        
    except Exception as e:
        logger.error(f"Error generating OpenAI response: {e}")
        return "I'm sorry, there was an error generating a response. Please try again."

# Test function
def test_system():
    """Test the entire RAG system"""
    logger.info("Testing RAG system...")
    
    try:
        # Test OpenAI connection
        if openai_client:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            logger.info("✓ OpenAI connection working")
        else:
            logger.error("❌ OpenAI client not initialized")
            return False
        
        # Test Qdrant connection
        qdrant_client = init_qdrant()
        collections = qdrant_client.get_collections()
        logger.info("✓ Qdrant connection working")
        
        # Test query if there are documents
        if collections.collections:
            result = query_ai_ta("What is this document about?", verbose=True)
            logger.info(f"✓ Query test result: {result[:100]}...")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ System test failed: {e}")
        return False

if __name__ == "__main__":
    test_system()