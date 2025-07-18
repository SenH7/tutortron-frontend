// src/pages/api/chat.js - CORRECTED VERSION
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // FIXED: Extract all required fields from request body
    const { message, userId, sessionId, chatId, userName, userEmail } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Forward the request to the Python Flask backend
    const backendUrl = process.env.RAG_BACKEND_URL || 'http://localhost:5001';
    
    console.log(`Forwarding chat request to: ${backendUrl}/chat`);
    
    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
        userId: userId || 'anonymous',
        userName: userName || 'Student',
        userEmail: userEmail || 'student@example.com',
        chatId: chatId, // FIXED: Now properly extracted from request
        sessionId: sessionId || `session_${Date.now()}`,
        // Parameters that match your successful test
        threshold: 0.25,  // Lower threshold like in test_rag.py
        top_k: 8,        // Same as test
        verbose: true    // Enable verbose logging
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      
      return res.status(response.status).json({
        error: errorData.error || 'Failed to get response from AI tutor',
        details: errorData
      });
    }

    const data = await response.json();
    
    // Return the response from the backend
    res.status(200).json({
      success: true,
      response: data.response,
      isFlagged: data.isFlagged || false,
      flagReason: data.flagReason || null,
      userId: data.userId,
      sessionId: data.sessionId,
      userMessageId: data.userMessageId || null,
      aiMessageId: data.aiMessageId || null
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return res.status(503).json({
        error: 'AI tutor service is currently unavailable. Please try again later.',
        details: 'Backend connection failed'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}