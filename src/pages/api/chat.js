// pages/api/chat.js
export default async function handler(req, res) {
  const { message, sessionId } = req.body;
  
  // Make a request to your Python backend
  const response = await fetch('YOUR_PYTHON_API_URL', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId }),
  });
  
  const data = await response.json();
  res.status(200).json(data);
}