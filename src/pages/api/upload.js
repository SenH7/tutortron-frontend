// src/pages/api/upload.js - Fixed file upload handling
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

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

  console.log('Upload API called');

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

    console.log('Parsed files:', Object.keys(files));
    console.log('File details:', files.file?.[0]);

    const file = files.file?.[0];

    if (!file) {
      console.error('No file found after parsing');
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    console.log('File found:', {
      filename: file.originalFilename,
      size: file.size,
      mimetype: file.mimetype,
      filepath: file.filepath
    });

     // Read the file into a buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    console.log('Read file buffer, size:', fileBuffer.length);
    
    // Create form data for the Python backend
    const formData = new FormData();
    
    // Append the file buffer with proper metadata
    formData.append('file', fileBuffer, {
      filename: file.originalFilename,
      contentType: file.mimetype || 'application/pdf',
    });

    // Create a readable stream from the file
    // const fileStream = fs.createReadStream(file.filepath);
    // console.log('Created file stream for:', file.originalFilename);
    
    // // Create form data for the Python backend
    // const formData = new FormData();
    
    // // Append the file stream with proper metadata
    // formData.append('file', fileStream, {
    //   filename: file.originalFilename,
    //   contentType: file.mimetype || 'application/pdf',
    // });

    // Forward to Python backend
    const backendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:5001';

    console.log(`Forwarding to backend: ${backendUrl}/upload`);

    const response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('Backend response status:', response.status);

    // Clean up the temporary file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Cleaned up temp file');
    } catch (cleanupError) {
      console.warn('Error cleaning up temp file:', cleanupError);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return res.status(response.status).json({
        error: errorData.error || 'Failed to upload file',
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Backend success response:', data);

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