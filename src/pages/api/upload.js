// src/pages/api/upload.js - Fixed version
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
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
  console.log('Request headers:', req.headers);

  try {
    // Parse the multipart form data with more specific options
    const form = formidable({
      maxFileSize: 16 * 1024 * 1024, // 16MB limit
      keepExtensions: true,
      multiples: false,
      filter: function ({ name, originalFilename, mimetype }) {
        console.log('Filter check:', { name, originalFilename, mimetype });
        // Accept files with the field name 'file' and PDF mimetype
        return name === 'file' && (mimetype === 'application/pdf' || originalFilename?.endsWith('.pdf'));
      },
    });

    let fields, files;
    try {
      [fields, files] = await form.parse(req);
    } catch (parseError) {
      console.error('Form parsing error:', parseError);
      return res.status(400).json({ 
        error: 'Failed to parse form data', 
        details: parseError.message 
      });
    }

    console.log('Parsed fields:', fields);
    console.log('Parsed files:', Object.keys(files));

    // Check if file was uploaded
    if (!files.file || files.file.length === 0) {
      console.error('No file found in parsed data');
      console.log('Available files:', files);
      return res.status(400).json({ 
        error: 'No PDF file provided',
        debug: {
          fieldsKeys: Object.keys(fields),
          filesKeys: Object.keys(files),
          files: files
        }
      });
    }

    // Get the file (formidable returns arrays)
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    console.log('File details:', {
      originalFilename: file.originalFilename,
      size: file.size,
      mimetype: file.mimetype,
      filepath: file.filepath
    });

    // Validate file
    if (!file.originalFilename) {
      return res.status(400).json({ error: 'No filename provided' });
    }

    if (file.size === 0) {
      return res.status(400).json({ error: 'Empty file uploaded' });
    }

    if (!file.originalFilename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Read the file and create form data for backend
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(file.filepath);
      console.log('Read file buffer, size:', fileBuffer.length);
    } catch (readError) {
      console.error('Error reading file:', readError);
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }

    // Create FormData for the Python backend using form-data package
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: file.originalFilename,
      contentType: 'application/pdf',
    });

    // Forward to Python backend
    const backendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:5001';
    console.log(`Forwarding to backend: ${backendUrl}/upload`);

    let backendResponse;
    try {
      backendResponse = await fetch(`${backendUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });
    } catch (fetchError) {
      console.error('Backend connection error:', fetchError);
      // Clean up temp file
      try {
        fs.unlinkSync(file.filepath);
      } catch {}
      
      return res.status(503).json({
        error: 'Upload service is currently unavailable. Please try again later.',
        details: 'Backend connection failed'
      });
    }

    console.log('Backend response status:', backendResponse.status);

    // Clean up the temporary file
    try {
      fs.unlinkSync(file.filepath);
      console.log('Cleaned up temp file');
    } catch (cleanupError) {
      console.warn('Error cleaning up temp file:', cleanupError);
    }

    // Handle backend response
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend error response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return res.status(backendResponse.status).json({
        error: errorData.error || 'Failed to upload file',
        details: errorData
      });
    }

    const data = await backendResponse.json();
    console.log('Backend success response:', data);

    res.status(200).json({
      success: true,
      message: data.message,
      filename: data.filename
    });

  } catch (error) {
    console.error('Upload API error:', error);
    res.status(500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
}