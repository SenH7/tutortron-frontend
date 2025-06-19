// src/pages/chat.js - Updated with file upload functionality
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";

// Import layout components
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import FileUpload from '@/components/chat/FileUpload';

// Import activity tracker
import activityTracker from '@/utils/activityTracker';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const messageEndRef = useRef(null);
  const router = useRouter();

  // Check authentication and user status
  useEffect(() => {
    const userData = localStorage.getItem('tutortronUser');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is blocked
      checkUserStatus(parsedUser.id);
      
      // Track login activity
      activityTracker.trackActivity(
        parsedUser.id,
        parsedUser.name,
        'Login',
        'User logged into chat interface'
      );
    } catch (error) {
      console.error('Invalid user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Check user status (blocked/active)
  const checkUserStatus = async (userId) => {
    try {
      // Mock API call - in real app, check user status from backend
      const blockedUsers = ['3']; // Mock blocked user IDs
      if (blockedUsers.includes(userId)) {
        setIsBlocked(true);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && user && !isBlocked) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${user.name}! I'm your Tutortron AI tutor. You can upload course materials (PDF files) or start asking questions directly. How can I help you with your studies today?`
      }]);
    }
  }, [messages.length, user, isBlocked]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload success
  const handleUploadSuccess = (message, filename) => {
    // Add success message to chat
    const uploadMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `✅ Successfully uploaded and processed "${filename}". You can now ask questions about this document!`
    };
    
    setMessages(prev => [...prev, uploadMessage]);
    
    // Track the upload
    if (user) {
      activityTracker.trackActivity(
        user.id,
        user.name,
        'File Upload',
        `Successfully uploaded: ${filename}`,
        null
      );
    }
    
    // Add to uploaded files list
    setUploadedFiles(prev => [...prev, { name: filename, uploadedAt: new Date() }]);
    
    // Hide upload interface
    setShowFileUpload(false);
  };

  // Handle file upload error
  const handleUploadError = (error) => {
    // Add error message to chat
    const errorMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `❌ Upload failed: ${error}. Please try again with a PDF file under 16MB.`
    };
    
    setMessages(prev => [...prev, errorMessage]);
    
    // Track the error
    if (user) {
      activityTracker.trackActivity(
        user.id,
        user.name,
        'Upload Error',
        `File upload failed: ${error}`
      );
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isBlocked) return;
    
    // Track user message activity
    const activity = activityTracker.trackActivity(
      user.id,
      user.name,
      'Chat Message',
      'User sent a message to AI tutor',
      message
    );

    // If message is flagged, show warning and don't process
    if (activity.flagged) {
      const warningMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `⚠️ Your message has been flagged for review. Reason: ${activity.flagReason}. Please ensure your messages follow our community guidelines.`
      };
      
      setMessages(prev => [...prev, warningMessage]);
      
      // Track the warning
      activityTracker.trackActivity(
        user.id,
        user.name,
        'Content Warning',
        `User received warning for flagged content: ${activity.flagReason}`
      );
      
      return;
    }
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call the real API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          userId: user.id,
          sessionId: activity.sessionId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Track AI response
      activityTracker.trackActivity(
        user.id,
        user.name,
        'AI Response',
        'AI tutor responded to user message',
        data.response
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Track error
      activityTracker.trackActivity(
        user.id,
        user.name,
        'Error',
        'Failed to get AI response'
      );
      
      // Add error message
      const errorMessage = error.message.includes('unavailable') 
        ? "The AI tutor service is currently unavailable. Please upload some course materials first or try again later."
        : "I'm sorry, there was an error processing your request. Please try again.";
        
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting a new chat
  const handleNewChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name}! I'm your Tutortron AI tutor. You can upload course materials (PDF files) or start asking questions directly. How can I help you with your studies today?`
    }]);
    
    // Track new chat session
    if (user) {
      activityTracker.trackActivity(
        user.id,
        user.name,
        'New Chat Session',
        'User started a new chat session'
      );
    }
  };

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    if (user) {
      // Track logout activity
      activityTracker.trackActivity(
        user.id,
        user.name,
        'Logout',
        'User logged out of chat interface'
      );
    }
    
    localStorage.removeItem('tutortronUser');
    router.push('/');
  };

  // Show blocked message if user is blocked
  if (isBlocked) {
    return (
      <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center`}>
        <Head>
          <title>Account Blocked - Tutortron</title>
          <meta name="description" content="Account access restricted" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="text-center max-w-md mx-auto p-6">
          <div className="h-16 w-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600 dark:text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Account Temporarily Restricted
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account has been temporarily restricted due to violations of our community guidelines. 
            Please contact support if you believe this is an error.
          </p>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] flex h-screen overflow-hidden bg-gray-50 dark:bg-black/10`}>
      <Head>
        <title>Tutortron Chat</title>
        <meta name="description" content="Chat with your AI tutor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Sidebar for chat history */}
      <ChatSidebar 
        user={user}
        chatHistory={chatHistory}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />

      {/* Main chat container */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        {/* Chat header */}
        <ChatHeader 
          onMenuClick={toggleSidebar} 
          title="Tutortron AI Tutor"
        />

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-white dark:bg-black/5">
          <div className="max-w-3xl mx-auto">
            {/* Upload button */}
            <div className="mb-4 flex justify-center">
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {showFileUpload ? 'Hide Upload' : 'Upload Course Materials'}
              </button>
            </div>

            {/* File upload component */}
            {showFileUpload && (
              <div className="mb-6">
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </div>
            )}

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">Uploaded Documents:</h3>
                <ul className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
              />
            ))}
            
            {isLoading && (
              <div className="flex items-center text-gray-500 my-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                  T
                </div>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Chat input */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black/5 p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              disabled={isBlocked}
            />
          </div>
        </div>
      </div>
    </div>
  );
}