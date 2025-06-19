#!/usr/bin/env python3

"""
Tutortron Backend Testing Script
This script tests the connection between frontend and backend components.
Run this from the project root directory.
"""

import requests
import json
import time
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.append(str(backend_dir))

# Configuration
BACKEND_URL = "http://localhost:5001"
FRONTEND_URL = "http://localhost:3000"

def colored_print(message, color="white"):
    colors = {
        "red": "\033[91m",
        "green": "\033[92m", 
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "white": "\033[0m"
    }
    print(f"{colors.get(color, colors['white'])}{message}\033[0m")

def test_backend_health():
    """Test if the backend is running and healthy"""
    colored_print("🔍 Testing backend health...", "blue")
    
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            colored_print(f"✅ Backend healthy: {data['message']}", "green")
            return True
        else:
            colored_print(f"❌ Backend unhealthy: {response.status_code}", "red")
            return False
    except Exception as e:
        colored_print(f"❌ Backend connection failed: {e}", "red")
        return False

def test_qdrant_connection():
    """Test if Qdrant is accessible"""
    colored_print("🔍 Testing Qdrant connection...", "blue")
    
    try:
        response = requests.get("http://localhost:6333/collections", timeout=5)
        if response.status_code == 200:
            colored_print("✅ Qdrant is accessible", "green")
            return True
        else:
            colored_print(f"❌ Qdrant error: {response.status_code}", "red")
            return False
    except Exception as e:
        colored_print(f"❌ Qdrant connection failed: {e}", "red")
        return False

def create_test_pdf():
    """Create a simple test PDF for upload testing"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        filename = "test_document.pdf"
        c = canvas.Canvas(filename, pagesize=letter)
        
        # Add some test content
        c.drawString(100, 750, "Test Document for Tutortron")
        c.drawString(100, 700, "This is a sample document containing information about mathematics.")
        c.drawString(100, 650, "Topics covered include algebra, calculus, and geometry.")
        c.drawString(100, 600, "Algebra deals with mathematical symbols and rules for manipulating symbols.")
        c.drawString(100, 550, "Calculus is the mathematical study of continuous change.")
        c.drawString(100, 500, "Geometry is concerned with properties of space and figures.")
        
        c.save()
        colored_print(f"✅ Created test PDF: {filename}", "green")
        return filename
    except ImportError:
        colored_print("⚠️ reportlab not installed. Creating text file instead...", "yellow")
        # Create a simple text file as fallback
        filename = "test_document.txt"
        with open(filename, 'w') as f:
            f.write("Test Document for Tutortron\n")
            f.write("This is a sample document containing information about mathematics.\n")
            f.write("Topics covered include algebra, calculus, and geometry.\n")
        colored_print(f"✅ Created test file: {filename}", "green")
        return filename

def test_file_upload():
    """Test file upload functionality"""
    colored_print("🔍 Testing file upload...", "blue")
    
    # Create test file
    test_file = create_test_pdf()
    
    if not os.path.exists(test_file):
        colored_print("❌ Test file creation failed", "red")
        return False
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'application/pdf')}
            response = requests.post(f"{BACKEND_URL}/upload", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            colored_print(f"✅ File upload successful: {data['message']}", "green")
            return True
        else:
            colored_print(f"❌ File upload failed: {response.status_code}", "red")
            try:
                error_data = response.json()
                colored_print(f"Error details: {error_data}", "red")
            except:
                pass
            return False
    except Exception as e:
        colored_print(f"❌ File upload error: {e}", "red")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file):
            os.remove(test_file)

def test_chat_functionality():
    """Test chat functionality"""
    colored_print("🔍 Testing chat functionality...", "blue")
    
    test_message = "What topics are covered in mathematics?"
    
    try:
        payload = {
            "message": test_message,
            "userId": "test_user",
            "sessionId": "test_session"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/chat", 
            json=payload, 
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            colored_print("✅ Chat response received:", "green")
            colored_print(f"Response: {data['response'][:200]}...", "white")
            return True
        else:
            colored_print(f"❌ Chat failed: {response.status_code}", "red")
            try:
                error_data = response.json()
                colored_print(f"Error details: {error_data}", "red")
            except:
                pass
            return False
    except Exception as e:
        colored_print(f"❌ Chat error: {e}", "red")
        return False

def test_frontend_api():
    """Test frontend API endpoints"""
    colored_print("🔍 Testing frontend API...", "blue")
    
    try:
        # Test chat API through frontend
        payload = {
            "message": "Hello, this is a test message",
            "userId": "test_user"
        }
        
        response = requests.post(
            f"{FRONTEND_URL}/api/chat",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            colored_print("✅ Frontend API working", "green")
            return True
        else:
            colored_print(f"❌ Frontend API failed: {response.status_code}", "red")
            return False
    except Exception as e:
        colored_print(f"❌ Frontend API error: {e}", "red")
        return False

def main():
    """Run all tests"""
    colored_print("🧪 Starting Tutortron Integration Tests", "blue")
    colored_print("=" * 50, "blue")
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Qdrant Connection", test_qdrant_connection), 
        ("File Upload", test_file_upload),
        ("Chat Functionality", test_chat_functionality),
        ("Frontend API", test_frontend_api)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        colored_print(f"\n🔧 Running: {test_name}", "yellow")
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)  # Brief pause between tests
    
    # Summary
    colored_print("\n" + "=" * 50, "blue")
    colored_print("📊 Test Results Summary:", "blue")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        color = "green" if result else "red"
        colored_print(f"{status} {test_name}", color)
        if result:
            passed += 1
    
    colored_print(f"\nTotal: {passed}/{total} tests passed", "blue")
    
    if passed == total:
        colored_print("\n🎉 All tests passed! Your Tutortron setup is working correctly.", "green")
    else:
        colored_print(f"\n⚠️ {total - passed} tests failed. Please check the setup.", "yellow")
        colored_print("💡 Tips:", "blue")
        colored_print("   • Make sure all services are running", "white")
        colored_print("   • Check your .env files for correct API keys", "white")
        colored_print("   • Verify Qdrant is accessible on port 6333", "white")
        colored_print("   • Ensure OpenAI API key is valid", "white")

if __name__ == "__main__":
    main()