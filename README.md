# Tutortron - AI-Powered Tutoring Platform

Tutortron is a free AI-powered tutoring platform that helps students learn at their own pace through personalized learning experiences. Students can upload course materials (PDFs) and chat with an AI tutor that understands their specific course content.

## Tech Stack

### Frontend
- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **Geist Font** - Typography

### Backend
- **Flask** - Python web framework
- **OpenAI API** - Language model for AI responses
- **Qdrant** - Vector database for document storage
- **PDFPlumber** - PDF text extraction
- **Sentence Transformers** - Text embeddings

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (3.8 or higher)
- **Docker** (for Qdrant vector database)
- **OpenAI API Key**

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tutortron
```

### 2. Frontend Setup

```bash
# Install frontend dependencies
npm install

# Copy environment template (if needed)
cp .env.example .env.local
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

### 4. Environment Configuration

#### Frontend (.env.local)
```env
RAG_BACKEND_URL=http://localhost:5001
```

#### Backend (.env)
```env
OPENAI_API_KEY=your_openai_api_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 5. Start Qdrant Vector Database

```bash
# Start Qdrant using Docker
docker run -p 6333:6333 qdrant/qdrant
```

## Running the Application

### 1. Start the Backend (Terminal 1)

```bash
cd backend
python app.py
```

The backend will start on `http://localhost:5001`

### 2. Start the Frontend (Terminal 2)

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Verify Setup

Visit `http://localhost:5001/health` to check if the backend is running properly.

## Usage

### For Students

1. **Sign Up/Login**: Create an account or use demo credentials
   - Demo: `student@example.com` / `password`

2. **Upload Course Materials**: 
   - Click "Upload Course Materials" in the chat interface
   - Upload PDF files (max 16MB)
   - Wait for processing confirmation

3. **Chat with AI Tutor**:
   - Ask questions about uploaded materials
   - Get personalized explanations and help
   - Copy responses for later reference

### For Administrators

1. **Admin Login**: Access admin dashboard
   - Demo: `admin@tutortron.com` / `admin123`
   - URL: `http://localhost:3000/admin/login`

2. **Monitor Users**:
   - View user activity and statistics
   - Block/unblock users
   - Monitor flagged content

3. **Review Activities**:
   - Check chat logs and flagged messages
   - Moderate inappropriate content

## API Endpoints

### Backend (Port 5001)

- `GET /health` - Health check
- `POST /upload` - Upload PDF documents
- `POST /chat` - Send chat messages
- `POST /clear-documents` - Clear all documents

### Frontend API (Port 3000)

- `POST /api/upload` - Proxy to backend upload
- `POST /api/chat` - Proxy to backend chat
- `GET /api/hello` - Test endpoint

## Project Structure

```
tutortron/
├── src/
│   ├── components/          # React components
│   │   ├── chat/           # Chat interface components
│   │   ├── home/           # Landing page components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── pages/              # Next.js pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin pages
│   │   └── ...             # Other pages
│   ├── styles/             # CSS styles
│   └── utils/              # Utility functions
├── backend/
│   ├── app.py              # Flask application
│   ├── rag.py              # RAG implementation
│   ├── requirements.txt    # Python dependencies
│   └── uploads/            # Temporary file storage
├── public/                 # Static assets
└── package.json            # Node.js dependencies
```

## Key Features Explained

### RAG (Retrieval-Augmented Generation)

The system uses RAG to provide accurate, context-aware responses:

1. **Document Processing**: PDFs are chunked and embedded using OpenAI's embedding model
2. **Vector Storage**: Embeddings are stored in Qdrant vector database
3. **Retrieval**: User questions are embedded and matched against stored documents
4. **Generation**: Relevant context is sent to GPT-4 for response generation

### Content Moderation

- Automatic flagging of inappropriate content
- Admin dashboard for content review
- User blocking/unblocking capabilities
- Activity logging and monitoring

### File Upload System

- Secure PDF upload with validation
- 16MB file size limit
- Automatic text extraction and processing
- Progress feedback to users

## Testing

### Test File Upload

```bash
# Run the test script to verify upload functionality
python test_flask_upload.py
```

### Test RAG System

```bash
cd backend
python test_rag.py
```

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure you've set your OpenAI API key in `backend/.env`
   - Verify the key is valid and has sufficient credits

2. **"Qdrant connection failed"**
   - Make sure Docker is running
   - Start Qdrant: `docker run -p 6333:6333 qdrant/qdrant`

3. **File upload fails**
   - Check file size (max 16MB)
   - Ensure file is a valid PDF
   - Verify backend is running on port 5001

4. **"No documents found"**
   - Upload some PDF documents first
   - Check if documents were processed successfully
   - Verify Qdrant is storing the embeddings

### Debugging

Enable verbose logging by setting the threshold in chat requests:

```javascript
// In src/pages/api/chat.js
{
  threshold: 0.25,
  top_k: 8,
  verbose: true
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all prerequisites are properly installed
4. Verify environment variables are set correctly

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive configuration
- Regularly update dependencies
- Monitor admin dashboard for suspicious activity

## Performance Tips

- Keep uploaded PDFs under 10MB for faster processing
- Use specific, clear questions for better AI responses
- Regularly clear old documents if not needed
- Monitor backend logs for performance issues