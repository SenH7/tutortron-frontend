// src/pages/api/upload.js - Handle file uploads to Python backend
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024, // 16MB limit
      filter: ({ mimetype }) => {
        // Only allow PDF files
        return mimetype && mimetype.includes('pdf');
      },
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    // Prepare form data for the Python backend
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    // Read the file and append to form data
    const fileStream = fs.createReadStream(file.filepath);
    formData.append('file', fileStream, {
      filename: file.originalFilename,
      contentType: file.mimetype,
    });

    // Forward to Python backend
    const backendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:5000';
    
    console.log(`Uploading file to: ${backendUrl}/upload`);
    
    const response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    // Clean up the temporary file
    fs.unlink(file.filepath, (err) => {
      if (err) console.error('Error cleaning up temp file:', err);
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend upload error:', errorData);
      
      return res.status(response.status).json({
        error: errorData.error || 'Failed to upload file',
        details: errorData
      });
    }

    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: data.message,
      filename: data.filename
    });

  } catch (error) {
    console.error('Upload API error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'Upload service is currently unavailable. Please try again later.',
        details: 'Backend connection failed'
      });
    }
    
    res.status(500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
}