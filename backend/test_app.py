from flask import Flask, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check"""
    return jsonify({
        "status": "healthy", 
        "message": "Test backend is running",
        "python_version": os.sys.version,
        "cwd": os.getcwd()
    })

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({"message": "Backend is working!"})

if __name__ == '__main__':
    print("Starting test Flask server on port 5001...")
    app.run(debug=True, host='0.0.0.0', port=5001)