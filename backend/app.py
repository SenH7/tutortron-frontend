from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
from rag import upload_pdf, query_ai_ta, init_qdrant
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test Qdrant connection
        qdrant_client = init_qdrant()
        collections = qdrant_client.get_collections()
        
        # Check OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        has_openai = bool(openai_key and openai_key != "your_openai_api_key_here")
        
        return jsonify({
            "status": "healthy", 
            "message": "RAG backend is running",
            "qdrant_connected": True,
            "openai_configured": has_openai,
            "collections": len(collections.collections)
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "message": f"Service issues: {str(e)}"
        }), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload and process PDF files"""
    try:
        logger.info(f"Upload request received")
        logger.info(f"Request files: {list(request.files.keys())}")
        logger.info(f"Content-Type: {request.content_type}")
        
        if 'file' not in request.files:
            logger.error("No file in request.files")
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            logger.error(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        # Check if we have OpenAI API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        logger.info(f"File saved: {filepath}")
        logger.info(f"File size: {os.path.getsize(filepath)} bytes")
        
        # Process the PDF with RAG
        try:
            upload_pdf(filepath)
            logger.info(f"Successfully processed: {filename}")
            
            # Clean up the uploaded file
            os.remove(filepath)
            
            return jsonify({
                "success": True,
                "message": f"Successfully processed {filename}. You can now ask questions about this document.",
                "filename": filename
            })
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            # Clean up the uploaded file even if processing fails
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({"error": f"Error processing PDF: {str(e)}"}), 500
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages and return AI responses"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
        
        user_message = data['message']
        user_id = data.get('userId', 'anonymous')
        session_id = data.get('sessionId', 'default')
        
        # Get parameters from request (use same as test_rag.py)
        threshold = data.get('threshold', 0.25)  # Lower threshold like test
        top_k = data.get('top_k', 8)
        verbose = data.get('verbose', True)
        
        logger.info(f"Processing chat message from user {user_id}: {user_message[:100]}...")
        logger.info(f"Using threshold: {threshold}, top_k: {top_k}, verbose: {verbose}")
        
        # Check if we have OpenAI API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Query the RAG system with the same parameters as test_rag.py
        try:
            ai_response = query_ai_ta(
                user_message, 
                threshold=threshold, 
                top_k=top_k,
                verbose=verbose
            )
            
            logger.info(f"Generated AI response for user {user_id}")
            
            return jsonify({
                "success": True,
                "response": ai_response,
                "userId": user_id,
                "sessionId": session_id
            })
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return jsonify({
                "error": f"Error generating response: {str(e)}"
            }), 500
            
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500

@app.route('/clear-documents', methods=['POST'])
def clear_documents():
    """Clear all documents from the vector database"""
    try:
        from rag import COLLECTION_NAME
        qdrant_client = init_qdrant()
        
        # Delete and recreate collection
        qdrant_client.delete_collection(COLLECTION_NAME)
        qdrant_client.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={"size": 1536, "distance": "Cosine"}
        )
        
        logger.info("Documents cleared successfully")
        
        return jsonify({
            "success": True,
            "message": "All documents cleared successfully"
        })
        
    except Exception as e:
        logger.error(f"Error clearing documents: {str(e)}")
        return jsonify({"error": f"Error clearing documents: {str(e)}"}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum size is 16MB."}), 413

@app.errorhandler(500)
def internal_server_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    logger.info("Starting RAG backend server...")
    logger.info("Checking environment...")
    
    # Check environment variables
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your_openai_api_key_here":
        logger.warning("⚠️  OpenAI API key not configured!")
    else:
        logger.info("✓ OpenAI API key configured")
    
    # Test Qdrant connection
    try:
        init_qdrant()
        logger.info("✓ Qdrant connection successful")
    except Exception as e:
        logger.error(f"❌ Qdrant connection failed: {e}")
    
    app.run(debug=True, host='0.0.0.0', port=5001)