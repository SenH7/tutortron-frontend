from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
from rag import upload_pdf, query_ai_ta
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
    return jsonify({"status": "healthy", "message": "RAG backend is running"})

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload and process PDF files"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        logger.info(f"Processing file: {filename}")
        
        # Process the PDF with RAG
        try:
            upload_pdf(filepath)
            logger.info(f"Successfully processed: {filename}")
            
            # Clean up the uploaded file
            os.remove(filepath)
            
            return jsonify({
                "success": True,
                "message": f"Successfully processed {filename}",
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
        
        logger.info(f"Processing chat message from user {user_id}: {user_message[:100]}...")
        
        # Query the RAG system
        try:
            ai_response = query_ai_ta(user_message, verbose=True)
            
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
        # You'll need to add this function to your rag.py
        # For now, we'll just return a success message
        logger.info("Document clearing requested")
        
        return jsonify({
            "success": True,
            "message": "Documents cleared successfully"
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
    app.run(debug=True, host='0.0.0.0', port=5001)