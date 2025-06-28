# backend/test_fixed.py - Test the fixed system
import sys
sys.path.append('.')

from rag import query_ai_ta, inspect_documents, test_system
import logging

logging.basicConfig(level=logging.INFO)

def main():
    print("🧪 Testing Fixed RAG System\n")
    
    # Test system components
    if not test_system():
        print("System test failed!")
        return
    
    # Inspect what documents we have
    print("📄 Inspecting documents in database:")
    inspect_documents()
    
    # Test with lower threshold
    print("\n🔍 Testing queries with lower threshold (0.25):")
    
    test_questions = [
        "What is this document about?",
        "Can you summarize the content?", 
        "What topics are covered?",
        "What is the main subject?",
        "Tell me about the course content"
    ]
    
    for question in test_questions:
        print(f"\n❓ Question: {question}")
        try:
            answer = query_ai_ta(question, threshold=0.25, verbose=True)
            print(f"📝 Answer: {answer}")
            print("-" * 80)
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()