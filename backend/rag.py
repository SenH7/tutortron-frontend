# backend/rag_fixed.py - Updated version with better parameters
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
import re

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

def smart_chunk_text(text, max_chars=800, overlap=100):
    """Split text into chunks with better sentence and paragraph awareness"""
    if not text:
        return []
    
    # First, try to split by paragraphs
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph would exceed max_chars, finalize current chunk
        if len(current_chunk) + len(paragraph) > max_chars and current_chunk:
            chunks.append(current_chunk.strip())
            # Start new chunk with overlap from previous chunk
            if overlap > 0:
                words = current_chunk.split()
                overlap_text = ' '.join(words[-overlap//10:]) if len(words) > overlap//10 else ""
                current_chunk = overlap_text + " " + paragraph
            else:
                current_chunk = paragraph
        else:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    # If chunks are still too long, split by sentences
    final_chunks = []
    for chunk in chunks:
        if len(chunk) <= max_chars:
            final_chunks.append(chunk)
        else:
            # Split long chunks by sentences
            sentences = re.split(r'(?<=[.!?])\s+', chunk)
            current_sentence_chunk = ""
            
            for sentence in sentences:
                if len(current_sentence_chunk) + len(sentence) > max_chars and current_sentence_chunk:
                    final_chunks.append(current_sentence_chunk.strip())
                    current_sentence_chunk = sentence
                else:
                    current_sentence_chunk += " " + sentence if current_sentence_chunk else sentence
            
            if current_sentence_chunk.strip():
                final_chunks.append(current_sentence_chunk.strip())
    
    # Remove very short chunks (less than 50 characters)
    final_chunks = [chunk for chunk in final_chunks if len(chunk) > 50]
    
    return final_chunks

def pdf_to_chunks(pdf_path):
    """Extract text from PDF and split into smart chunks"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    # Clean up the text
                    page_text = page_text.strip()
                    # Remove excessive whitespace
                    page_text = re.sub(r'\s+', ' ', page_text)
                    # Add page breaks
                    full_text += page_text + "\n\n"
                    logger.info(f"Extracted {len(page_text)} characters from page {page_num + 1}")
        
        if not full_text.strip():
            logger.warning("No text extracted from PDF")
            return []
        
        # Use smart chunking instead of simple character splitting
        chunks = smart_chunk_text(full_text, max_chars=800, overlap=100)
        logger.info(f"Created {len(chunks)} smart chunks from PDF")
        
        # Log some sample chunks for debugging
        for i, chunk in enumerate(chunks[:3]):
            logger.info(f"Sample chunk {i+1}: {chunk[:200]}...")
        
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
                "source": pdf_path,
                "chunk_index": i
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
You are an AI Teaching Assistant. Answer the student's question based on the provided context from uploaded course materials.

Context from course materials:
{retrieved_context}

Student's question: {user_input}

Instructions:
- Answer the question based primarily on the provided context
- Use clear, well-structured formatting with proper paragraphs
- Use numbered lists (1. 2. 3.) for main sections when appropriate
- Use bullet points (-) for sub-items
- Use **bold text** for important terms or section headers
- If the context contains relevant information, provide a helpful answer
- If the context is only partially relevant, use what you can and mention that you're working with limited information
- Be conversational and helpful
- If you truly cannot answer based on the context, say so politely

Format your response with clear structure and proper spacing for readability.

Answer:"""

def query_ai_ta(question, threshold=0.25, top_k=8, verbose=False):
    """Query the AI Teaching Assistant with lower threshold"""
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
        return "I don't have any uploaded course materials to reference. Please upload some documents first."

    # Step 3: Check cosine similarity threshold (lowered to 0.25)
    best_score = results[0].score
    if verbose:
        logger.info(f"Best similarity score: {best_score:.4f}")
        for i, result in enumerate(results[:3]):
            logger.info(f"Result {i+1} (score: {result.score:.4f}): {result.payload['text'][:100]}...")
    
    if best_score < threshold:
        if verbose:
            logger.info(f"⚠️ Best cosine score {best_score:.4f} is below threshold ({threshold})")
        return f"I couldn't find information directly related to your question in the uploaded materials. The best match had a similarity score of {best_score:.3f}. Could you try asking about specific topics from your course materials?"

    # Step 4: Use multiple contexts for better coverage
    contexts = [r.payload['text'] for r in results[:3]]  # Use top 3 results
    combined_context = "\n\n---\n\n".join(contexts)
    
    # Step 5: Format the final prompt with the new template
    prompt = PROMPT_TEMPLATE.format(
        user_input=question,
        retrieved_context=combined_context
    )

    if verbose:
        logger.info("Sending prompt to OpenAI...")
        logger.info(f"Combined context length: {len(combined_context)} characters")

    # Step 6: Generate final response from OpenAI
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful AI teaching assistant that answers questions based on uploaded course materials."},
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

def inspect_documents():
    """Inspect what documents are in the database"""
    try:
        qdrant_client = init_qdrant()
        
        # Get some sample documents
        results = qdrant_client.scroll(
            collection_name=COLLECTION_NAME,
            limit=5,
            with_payload=True
        )
        
        print(f"\n📄 Found {len(results[0])} sample documents:")
        for i, point in enumerate(results[0]):
            text = point.payload.get('text', '')
            source = point.payload.get('source', 'unknown')
            print(f"\nDocument {i+1} (from {source}):")
            print(f"Content: {text[:300]}...")
            
    except Exception as e:
        print(f"Error inspecting documents: {e}")

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
        
        return True
        
    except Exception as e:
        logger.error(f"❌ System test failed: {e}")
        return False

if __name__ == "__main__":
    test_system()