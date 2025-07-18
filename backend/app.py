from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import tempfile
from rag import upload_pdf, query_ai_ta, init_qdrant
import logging
from chat_storage import chat_storage
from datetime import datetime
import re

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

# Content moderation function - MOVED TO TOP
def check_content_flags(content):
    """Check if content should be flagged"""
    flagged_keywords = [
        'hack', 'cheat', 'illegal', 'drugs', 'violence', 
        'harassment', 'spam', 'scam', 'fraud'
    ]
    
    content_lower = content.lower()
    
    # Check for flagged keywords
    for keyword in flagged_keywords:
        if keyword in content_lower:
            return True, f"Contains inappropriate keyword: {keyword}"
    
    # Check for excessive caps (possible shouting)
    if len(content) > 20:
        caps_ratio = sum(1 for c in content if c.isupper()) / len(content)
        if caps_ratio > 0.7:
            return True, "Excessive use of capital letters"
    
    # Check for repetitive content
    words = content.split()
    if len(words) > 5:
        word_counts = {}
        for word in words:
            word_counts[word] = word_counts.get(word, 0) + 1
            if word_counts[word] > 5:
                return True, f"Excessive repetition of word: {word}"
    
    return False, None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint - UPDATED"""
    try:
        # Test Qdrant connection
        qdrant_client = init_qdrant()
        collections = qdrant_client.get_collections()
        
        # Test database connection
        stats = chat_storage.get_chat_statistics()
        
        # Check OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        has_openai = bool(openai_key and openai_key != "your_openai_api_key_here")
        
        return jsonify({
            "status": "healthy", 
            "message": "RAG backend is running with chat storage",
            "qdrant_connected": True,
            "database_connected": True,
            "openai_configured": has_openai,
            "collections": len(collections.collections),
            "total_chats": stats.get('total_chats', 0),
            "total_messages": stats.get('total_messages', 0)
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

# SINGLE CHAT ROUTE - FIXED VERSION
@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat messages and return AI responses - WITH CHAT STORAGE"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "No message provided"}), 400
        
        user_message = data['message']
        user_id = data.get('userId', 'anonymous')
        session_id = data.get('sessionId', 'default')
        chat_id = data.get('chatId')  # Get chat ID from request
        user_name = data.get('userName', 'Student')
        user_email = data.get('userEmail', f"{user_id}@example.com")
        
        # Create user record if doesn't exist
        chat_storage.create_or_update_user(user_id, user_name, user_email)
        
        # Check for inappropriate content
        is_flagged, flag_reason = check_content_flags(user_message)
        
        # Get parameters from request
        threshold = data.get('threshold', 0.25)
        top_k = data.get('top_k', 8)
        verbose = data.get('verbose', True)
        
        logger.info(f"Processing chat message from user {user_id}: {user_message[:100]}...")
        logger.info(f"Using threshold: {threshold}, top_k: {top_k}, verbose: {verbose}")
        
        # Check if we have OpenAI API key
        if not os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY") == "your_openai_api_key_here":
            logger.error("OpenAI API key not configured")
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # If content is flagged, return warning and save flagged message
        if is_flagged:
            user_message_id = None
            ai_message_id = None
            
            if chat_id:
                # Save flagged user message
                user_message_id = chat_storage.add_message(
                    chat_id, 'user', user_message, 
                    is_flagged=True, flag_reason=flag_reason
                )
                
                # Add warning response
                warning_response = f"⚠️ Your message has been flagged for review. Reason: {flag_reason}. Please ensure your messages follow our community guidelines."
                ai_message_id = chat_storage.add_message(chat_id, 'assistant', warning_response)
            
            return jsonify({
                "success": False,
                "response": f"⚠️ Your message has been flagged for review. Reason: {flag_reason}. Please ensure your messages follow our community guidelines.",
                "isFlagged": True,
                "flagReason": flag_reason,
                "userId": user_id,
                "sessionId": session_id,
                "userMessageId": user_message_id,
                "aiMessageId": ai_message_id
            })
        
        # Save user message to database (not flagged)
        user_message_id = None
        if chat_id:
            user_message_id = chat_storage.add_message(chat_id, 'user', user_message)
        
        # Query the RAG system
        try:
            ai_response = query_ai_ta(
                user_message, 
                threshold=threshold, 
                top_k=top_k,
                verbose=verbose
            )
            
            # Save AI response to database
            ai_message_id = None
            if chat_id:
                ai_message_id = chat_storage.add_message(chat_id, 'assistant', ai_response)
            
            logger.info(f"Generated AI response for user {user_id}")
            
            return jsonify({
                "success": True,
                "response": ai_response,
                "isFlagged": False,
                "userId": user_id,
                "sessionId": session_id,
                "userMessageId": user_message_id,
                "aiMessageId": ai_message_id
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

# ===== CHAT API ENDPOINTS =====

@app.route('/api/chats', methods=['GET'])
def get_user_chats():
    """Get all chats for a user"""
    try:
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        chats = chat_storage.get_user_chats(user_id)
        
        # Convert to frontend format
        formatted_chats = []
        for chat in chats:
            formatted_chats.append({
                'id': chat['id'],
                'title': chat['title'],
                'createdAt': chat['created_at'],
                'lastUpdated': chat['updated_at'],
                'messageCount': chat['message_count'],
                'isFlagged': chat['is_flagged'],
                'flagReason': chat['flag_reason']
            })
        
        return jsonify({
            "success": True,
            "chats": formatted_chats
        })
        
    except Exception as e:
        logger.error(f"Error getting user chats: {str(e)}")
        return jsonify({"error": f"Failed to get chats: {str(e)}"}), 500

@app.route('/api/chats/<chat_id>', methods=['GET'])
def get_chat_by_id(chat_id):
    """Get a specific chat with messages"""
    try:
        user_id = request.args.get('userId')
        
        # Admin can view any chat, users can only view their own
        is_admin = request.args.get('isAdmin') == 'true'
        check_user_id = None if is_admin else user_id
        
        chat = chat_storage.get_chat_with_messages(chat_id, check_user_id)
        
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Convert to frontend format
        formatted_chat = {
            'id': chat['id'],
            'title': chat['title'],
            'createdAt': chat['created_at'],
            'lastUpdated': chat['updated_at'],
            'messages': chat['messages'],
            'isFlagged': chat['is_flagged'],
            'flagReason': chat['flag_reason']
        }
        
        return jsonify({
            "success": True,
            "chat": formatted_chat
        })
        
    except Exception as e:
        logger.error(f"Error getting chat: {str(e)}")
        return jsonify({"error": f"Failed to get chat: {str(e)}"}), 500

@app.route('/api/chats', methods=['POST'])
def create_chat():
    """Create a new chat"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        title = data.get('title', 'New Chat')
        chat_id = data.get('chatId')  # Optional, will generate if not provided
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
        
        # Create user record if doesn't exist
        user_name = data.get('userName', 'Student')
        user_email = data.get('userEmail', f"{user_id}@example.com")
        chat_storage.create_or_update_user(user_id, user_name, user_email)
        
        chat_id = chat_storage.create_chat(user_id, title, chat_id)
        
        return jsonify({
            "success": True,
            "chatId": chat_id,
            "message": "Chat created successfully"
        })
        
    except Exception as e:
        logger.error(f"Error creating chat: {str(e)}")
        return jsonify({"error": f"Failed to create chat: {str(e)}"}), 500

@app.route('/api/chats/<chat_id>/messages', methods=['POST'])
def add_message_to_chat(chat_id):
    """Add a message to a chat"""
    try:
        data = request.get_json()
        role = data.get('role')
        content = data.get('content')
        message_id = data.get('messageId')
        user_id = data.get('userId')
        
        if not all([role, content]):
            return jsonify({"error": "Role and content required"}), 400
        
        # Check for inappropriate content if it's a user message
        is_flagged = False
        flag_reason = None
        
        if role == 'user':
            is_flagged, flag_reason = check_content_flags(content)
        
        # Add message to database
        message_id = chat_storage.add_message(
            chat_id, role, content, message_id, is_flagged, flag_reason
        )
        
        # If message is flagged, also flag the chat
        if is_flagged:
            chat_storage.flag_chat(chat_id, f"Contains flagged message: {flag_reason}")
        
        return jsonify({
            "success": True,
            "messageId": message_id,
            "isFlagged": is_flagged,
            "flagReason": flag_reason
        })
        
    except Exception as e:
        logger.error(f"Error adding message: {str(e)}")
        return jsonify({"error": f"Failed to add message: {str(e)}"}), 500

@app.route('/api/chats/<chat_id>', methods=['PUT'])
def update_chat(chat_id):
    """Update chat (e.g., title)"""
    try:
        data = request.get_json()
        title = data.get('title')
        user_id = data.get('userId')
        
        if not title:
            return jsonify({"error": "Title required"}), 400
        
        success = chat_storage.update_chat_title(chat_id, title, user_id)
        
        if not success:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        return jsonify({
            "success": True,
            "message": "Chat updated successfully"
        })
        
    except Exception as e:
        logger.error(f"Error updating chat: {str(e)}")
        return jsonify({"error": f"Failed to update chat: {str(e)}"}), 500

@app.route('/api/chats/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    """Delete a chat"""
    try:
        user_id = request.args.get('userId')
        
        success = chat_storage.delete_chat(chat_id, user_id)
        
        if not success:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        return jsonify({
            "success": True,
            "message": "Chat deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}")
        return jsonify({"error": f"Failed to delete chat: {str(e)}"}), 500

# ===== ADMIN API ENDPOINTS =====

@app.route('/api/admin/chats', methods=['GET'])
def admin_get_all_chats():
    """Get all chats for admin monitoring"""
    try:
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        chats = chat_storage.get_all_chats_for_admin(limit, offset)
        
        return jsonify({
            "success": True,
            "chats": chats
        })
        
    except Exception as e:
        logger.error(f"Error getting admin chats: {str(e)}")
        return jsonify({"error": f"Failed to get chats: {str(e)}"}), 500

@app.route('/api/admin/flagged-content', methods=['GET'])
def admin_get_flagged_content():
    """Get flagged chats and messages for admin review"""
    try:
        limit = int(request.args.get('limit', 100))
        
        flagged_content = chat_storage.get_flagged_content(limit)
        
        return jsonify({
            "success": True,
            "flaggedChats": flagged_content['flagged_chats'],
            "flaggedMessages": flagged_content['flagged_messages']
        })
        
    except Exception as e:
        logger.error(f"Error getting flagged content: {str(e)}")
        return jsonify({"error": f"Failed to get flagged content: {str(e)}"}), 500

@app.route('/api/admin/statistics', methods=['GET'])
def admin_get_statistics():
    """Get chat statistics for admin dashboard"""
    try:
        stats = chat_storage.get_chat_statistics()
        
        return jsonify({
            "success": True,
            "statistics": stats
        })
        
    except Exception as e:
        logger.error(f"Error getting statistics: {str(e)}")
        return jsonify({"error": f"Failed to get statistics: {str(e)}"}), 500

@app.route('/api/admin/flag-message', methods=['POST'])
def admin_flag_message():
    """Flag a message for review"""
    try:
        data = request.get_json()
        message_id = data.get('messageId')
        reason = data.get('reason', 'Flagged by administrator')
        
        if not message_id:
            return jsonify({"error": "Message ID required"}), 400
        
        success = chat_storage.flag_message(message_id, reason)
        
        if not success:
            return jsonify({"error": "Message not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Message flagged successfully"
        })
        
    except Exception as e:
        logger.error(f"Error flagging message: {str(e)}")
        return jsonify({"error": f"Failed to flag message: {str(e)}"}), 500

@app.route('/api/admin/flag-chat', methods=['POST'])
def admin_flag_chat():
    """Flag a chat for review"""
    try:
        data = request.get_json()
        chat_id = data.get('chatId')
        reason = data.get('reason', 'Flagged by administrator')
        
        if not chat_id:
            return jsonify({"error": "Chat ID required"}), 400
        
        success = chat_storage.flag_chat(chat_id, reason)
        
        if not success:
            return jsonify({"error": "Chat not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Chat flagged successfully"
        })
        
    except Exception as e:
        logger.error(f"Error flagging chat: {str(e)}")
        return jsonify({"error": f"Failed to flag chat: {str(e)}"}), 500

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
    
    # Test database connection
    try:
        stats = chat_storage.get_chat_statistics()
        logger.info(f"✓ Database connection successful - {stats['total_chats']} chats, {stats['total_messages']} messages")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
    
    app.run(debug=True, host='0.0.0.0', port=5001)