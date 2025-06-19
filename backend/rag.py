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

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

COLLECTION_NAME = "ai_ta_docs"

# Initialize Qdrant client but don't create collection immediately
qdrant = None

def init_qdrant():
    """Initialize Qdrant connection and create collection if needed"""
    global qdrant
    
    if qdrant is None:
        try:
            qdrant = QdrantClient(host="localhost", port=6333)
            print("✓ Connected to Qdrant")
            
            # Check if collection exists, create if it doesn't
            collections = qdrant.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if COLLECTION_NAME not in collection_names:
                qdrant.recreate_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
                )
                print(f"✓ Created collection: {COLLECTION_NAME}")
            else:
                print(f"✓ Collection {COLLECTION_NAME} already exists")
                
        except Exception as e:
            print(f"❌ Failed to connect to Qdrant: {e}")
            print("Make sure Qdrant is running: docker run -p 6333:6333 qdrant/qdrant")
            raise e
    
    return qdrant

def chunk_text(text, max_chars=500):
    return [text[i:i+max_chars] for i in range(0, len(text), max_chars)]

def pdf_to_chunks(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text.strip() + "\n"

    return chunk_text(full_text, max_chars=500)

def get_embedding(text, batch_size=8):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[text]
    )
    return response.data[0].embedding

def get_embeddings_batch(texts, batch_size=8):
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=batch
        )
        embeddings = [r.embedding for r in response.data]
        all_embeddings.extend(embeddings)
    return all_embeddings

def upload_pdf(pdf_path):
    """Upload and process PDF file"""
    # Initialize Qdrant connection
    qdrant_client = init_qdrant()
    
    chunks = pdf_to_chunks(pdf_path)
    points = []
    
    print(f"Processing {len(chunks)} chunks from {pdf_path}")
    
    for i, chunk in enumerate(chunks):
        embedding = get_embedding(chunk)
        hash_id = hashlib.md5(chunk.encode()).hexdigest()
        points.append(PointStruct(
            id=hash_id,
            vector=embedding,
            payload={
                "text": chunk,
                "date_uploaded": str(datetime.datetime.utcnow())
            }
        ))
    
    qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"✓ Uploaded {len(points)} chunks from {pdf_path}")

# Initialize CrossEncoder
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

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

def query_ai_ta(question, threshold=0.6, top_k=8, verbose=False):
    """Query the AI Teaching Assistant"""
    # Initialize Qdrant connection
    qdrant_client = init_qdrant()
    
    # Step 1: Embed the question
    query_embedding = get_embedding(question)

    # Step 2: Retrieve top_k docs from Qdrant using cosine similarity
    try:
        results = qdrant_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            limit=top_k,
            with_payload=True
        )
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        return "I'm sorry, there was an error accessing the document database. Please try again."

    if not results:
        if verbose:
            print("🔍 No results retrieved from Qdrant.")
        return "The information related to your question was not found in the course materials."

    # Step 3: Check cosine similarity threshold
    if results[0].score < threshold:
        if verbose:
            print(f"⚠️ Best cosine score {results[0].score:.4f} is below threshold ({threshold})")
        return "The information related to your question was not found in the course materials."

    # Step 4: Rerank with CrossEncoder
    contexts = [r.payload['text'] for r in results]
    scores_cosine = [r.score for r in results]
    pairs = [[question, ctx] for ctx in contexts]
    scores_cross = cross_encoder.predict(pairs)
    best_idx = np.argmax(scores_cross)
    best_context = contexts[best_idx]

    if verbose:
        print("\n Cosine Similarity Scores (Qdrant):")
        for i, score in enumerate(scores_cosine):
            print(f"  Doc {i+1}: {score:.4f}")
        print("\n CrossEncoder Re-Rank Scores:")
        for i, score in enumerate(scores_cross):
            print(f"  Doc {i+1}: {score:.4f}")
        print("\n Selected Best Context:")
        print(best_context[:500] + ("..." if len(best_context) > 500 else ""))

    # Step 5: Format the final prompt
    prompt = PROMPT_TEMPLATE.format(
        user_input=question,
        retrieved_context=best_context,
        context_url="uploaded_document",
        similarity_score=scores_cosine[best_idx],
        assistant_answer="[TO BE GENERATED]"
    )

    if verbose:
        print("\n Final Prompt Sent to OpenAI:\n" + "-"*60)
        print(prompt)
        print("-"*60)

    # Step 6: Generate final response from OpenAI
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an AI Teaching Assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error generating OpenAI response: {e}")
        return "I'm sorry, there was an error generating a response. Please try again."