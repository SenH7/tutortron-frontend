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
from sentence_transformers import CrossEncoder

# Initialize OpenAI and Qdrant
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
qdrant = QdrantClient(host="localhost", port=6333)

COLLECTION_NAME = "ai_ta_docs"

# Create collection
qdrant.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
)

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


def get_embedding(text,batch_size=8):
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=[text]
    )
    return response.data[0].embedding

def upload_pdf(pdf_path):
    chunks = pdf_to_chunks(pdf_path)
    points = []
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
    qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"Uploaded {len(points)} chunks from {pdf_path}")


#3. Query Module with Cosine + CrossEncoder



client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
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
    # Step 1: Embed the question
    query_embedding = get_embedding(question)

    # Step 2: Retrieve top_k docs from Qdrant using cosine similarity
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        limit=top_k,
        with_payload=True
    )

    if not results:
        if verbose:
            print("🔍 No results retrieved from Qdrant.")
        return "No context found."

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
        date=str(datetime.date.today()),
        question=question,
        context=best_context,
        thought="The documents provided a good match."
    )

    if verbose:
        print("\n Final Prompt Sent to OpenAI:\n" + "-"*60)
        print(prompt)
        print("-"*60)

    # Step 6: Generate final response from OpenAI
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an AI Teaching Assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content
