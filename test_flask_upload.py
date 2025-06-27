#!/usr/bin/env python3
"""
Simple test script to verify file upload with a minimal valid PDF
"""

import requests
import os

def create_minimal_pdf(filename):
    """Create a minimal valid PDF file"""
    # This is a minimal valid PDF structure
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 178 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document for Tutortron) Tj
0 -20 Td
(This is a test PDF containing information about mathematics.) Tj
0 -20 Td
(Topics: Algebra, Calculus, Geometry) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000312 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
543
%%EOF"""
    
    with open(filename, 'wb') as f:
        f.write(pdf_content)
    
    print(f"✓ Created minimal valid PDF: {filename}")

def test_upload():
    """Test file upload to Flask backend"""
    
    # Check if backend is running
    try:
        health_response = requests.get("http://localhost:5001/health")
        if health_response.status_code != 200:
            print("❌ Backend health check failed!")
            return
        print("✅ Backend is healthy!")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:5001")
        print("   Make sure the Flask backend is running: cd backend && python app.py")
        return
    
    # Create test PDF
    test_file = "test_minimal.pdf"
    create_minimal_pdf(test_file)
    
    # Upload the file
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (test_file, f, 'application/pdf')}
            print(f"\n📤 Uploading {test_file} to http://localhost:5001/upload...")
            
            response = requests.post("http://localhost:5001/upload", files=files)
            
            print(f"📥 Response status: {response.status_code}")
            print(f"📥 Response: {response.text}")
            
            if response.status_code == 200:
                print("\n✅ Upload successful!")
                
                # Test chat functionality
                print("\n🤖 Testing chat with uploaded content...")
                chat_response = requests.post("http://localhost:5001/chat", 
                    json={"message": "What topics are covered in the document?", "userId": "test"})
                
                if chat_response.status_code == 200:
                    data = chat_response.json()
                    print("💬 AI Response:", data.get('response', 'No response'))
                else:
                    print("❌ Chat test failed:", chat_response.text)
            else:
                print("\n❌ Upload failed!")
                
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Clean up
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"\n🧹 Cleaned up {test_file}")

if __name__ == "__main__":
    print("🧪 Testing Tutortron File Upload\n")
    test_upload()