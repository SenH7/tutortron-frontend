// src/pages/chat.js - FIXED VERSION with proper title generation
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";

// Import layout components
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';
import FileUpload from '@/components/chat/FileUpload';

// Import server-side storage utilities
import {
  loadChatHistory,
  loadChatWithMessages,
  createNewChat,
  saveChatToHistory,
  addMessageToChat,
  generateChatTitle,
  updateChatTitle
} from '@/utils/chatStorageServer';

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
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [isChatSaved, setIsChatSaved] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  const [titleUpdated, setTitleUpdated] = useState(false); // Track if title has been updated
  const messageEndRef = useRef(null);
  const router = useRouter();
  const isInitializingChat = useRef(false);

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

      // Initialize with a new chat
      initializeNewChat();
    } catch (error) {
      console.error('Invalid user data:', error);
      router.push('/login');
    }
  }, [router]);

  // Check if chat has real content (not just welcome message)
  const hasRealContent = (messages) => {
    if (!messages || messages.length === 0) return false;

    const realMessages = messages.filter(msg =>
      msg.id !== 'welcome' &&
      !msg.content.includes("Hello! I'm your Tutortron AI tutor") &&
      (msg.role === 'user' || (msg.role === 'assistant' && !msg.content.includes("✅ Successfully uploaded")))
    );

    return realMessages.length > 0;
  };

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check user status (blocked/active)
  const checkUserStatus = async (userId) => {
    try {
      // In a real implementation, you'd check this from the server
      const blockedUsers = ['3'];
      if (blockedUsers.includes(userId)) {
        setIsBlocked(true);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const initializeNewChat = useCallback(() => {
    // Prevent duplicate initialization
    if (isInitializingChat.current) return false;
    isInitializingChat.current = true;

    // Create a temporary chat ID
    const tempChatId = `temp_${Date.now()}`;
    setCurrentChatId(tempChatId);
    setChatTitle('New Chat');
    setIsChatSaved(false);
    setServerConnectionError(false);
    setTitleUpdated(false);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your Tutortron AI tutor. You can upload course materials (PDF files) or start asking questions directly. How can I help you with your studies today?`,
      timestamp: new Date().toISOString()
    }]);

    // Don't save temp chats to history
    // Real chats are created when the first message is sent

    // Reset the flag after a short delay
    setTimeout(() => {
      isInitializingChat.current = false;
    }, 1000);

    return true;
  }, []);

  const refreshSidebarHistory = () => {
    setSidebarRefreshTrigger(prev => prev + 1);
  };

  const saveChatToServer = async () => {
    if (!user || !currentChatId || !hasRealContent(messages) || isChatSaved) return;

    try {
      setServerConnectionError(false);

      // If this is a temporary chat ID, create a real chat
      let chatId = currentChatId;
      if (currentChatId.startsWith('temp_')) {
        try {
          const newChatData = await createNewChat(user.id, user.name, user.email, chatTitle);
          if (newChatData && newChatData.id) {
            chatId = newChatData.id;
            setCurrentChatId(chatId);
          } else {
            throw new Error('Failed to create chat on server');
          }
        } catch (createError) {
          console.error('Error creating chat on server:', createError);
          setServerConnectionError(true);
          return; // Don't proceed if we can't create the chat
        }
      }

      const chatData = {
        id: chatId,
        title: chatTitle,
        messages: messages.filter(msg => msg.id !== 'welcome'), // Exclude welcome message
        createdAt: messages[0]?.timestamp || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const success = await saveChatToHistory(user.id, user.name, user.email, chatData);

      if (success) {
        setIsChatSaved(true);
        refreshSidebarHistory();
      } else {
        console.warn('Failed to save chat to server, but continuing locally');
        setServerConnectionError(true);
      }
    } catch (error) {
      console.error('Error saving chat to server:', error);
      setServerConnectionError(true);
    }
  };

  const updateChatTitleFromMessage = async (firstUserMessage, chatId) => {
    if (!firstUserMessage || titleUpdated || !user || serverConnectionError) return;

    try {
      const newTitle = generateChatTitle(firstUserMessage);

      // Update title locally
      setChatTitle(newTitle);
      setTitleUpdated(true);

      // Update title on server if chat exists
      if (chatId && !chatId.startsWith('temp_')) {
        await updateChatTitle(user.id, chatId, newTitle);
        refreshSidebarHistory();
      }

      console.log('Updated chat title to:', newTitle);
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  // Handle file upload success
  const handleUploadSuccess = (message, filename) => {
    const uploadMessage = {
      id: `upload_${Date.now()}`,
      role: 'assistant',
      content: `✅ Successfully uploaded and processed "${filename}". You can now ask questions about this document!`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, uploadMessage]);
    setUploadedFiles(prev => [...prev, { name: filename, uploadedAt: new Date() }]);
    setShowFileUpload(false);
  };

  // Handle file upload error
  const handleUploadError = (error) => {
    const errorMessage = {
      id: `error_${Date.now()}`,
      role: 'assistant',
      content: `❌ Upload failed: ${error}. Please try again with a PDF file under 16MB.`,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, errorMessage]);
  };

  const handleSendMessage = async (message) => {
    if (!message.trim() || isBlocked || isLoading) return;

    setIsLoading(true);

    // Add user message to chat immediately
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Check if this is the first user message and update title
    const userMessages = newMessages.filter(m => m.role === 'user');
    if (userMessages.length === 1 && !titleUpdated) {
      // This is the first user message, update the title
      await updateChatTitleFromMessage(message, currentChatId);
    }

    try {
      // Ensure we have a real chat ID for saving messages
      let chatIdForSaving = currentChatId;
      if (currentChatId.startsWith('temp_') && !serverConnectionError) {
        try {
          // Use the updated title when creating the chat
          const titleToUse = titleUpdated ? chatTitle : generateChatTitle(message);
          const newChatData = await createNewChat(user.id, user.name, user.email, titleToUse);
          if (newChatData && newChatData.id) {
            chatIdForSaving = newChatData.id;
            setCurrentChatId(chatIdForSaving);
            setServerConnectionError(false);

            // Update the title if it wasn't already updated
            if (!titleUpdated) {
              setChatTitle(titleToUse);
              setTitleUpdated(true);
            }
          } else {
            throw new Error('Failed to create chat');
          }
        } catch (createError) {
          console.error('Error creating chat for message saving:', createError);
          setServerConnectionError(true);
          // Continue without server-side storage
          chatIdForSaving = currentChatId;
        }
      }

      // Call the chat API with chat ID for server storage
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          chatId: serverConnectionError ? null : chatIdForSaving, // Don't send chatId if server has issues
          sessionId: `session_${Date.now()}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Check if message was flagged
      if (data.isFlagged) {
        const flaggedMessage = {
          id: `flagged_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, flaggedMessage]);
        setIsLoading(false);
        return;
      }

      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        savedToServer: !serverConnectionError // Only mark as saved if server is working
      };

      setMessages(prev => [...prev, aiMessage]);

      // Mark chat as saved since messages are now in the database (if server is working)
      if (!serverConnectionError) {
        setIsChatSaved(true);
        refreshSidebarHistory();
      }

    } catch (error) {
      console.error('Error sending message:', error);

      // Check if it's a server connection error
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        setServerConnectionError(true);
      }

      const errorMessage = error.message.includes('unavailable')
        ? "The AI tutor service is currently unavailable. Please upload some course materials first or try again later."
        : "I'm sorry, there was an error processing your request. Please try again.";

      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const created = initializeNewChat();
    return created; // will return true if chat was initialized
  };

  // Handle loading a chat from history
  const handleLoadChat = async (chat) => {
    try {
      // Load full chat with messages from server
      const fullChat = await loadChatWithMessages(chat.id, user.id);

      if (fullChat) {
        setCurrentChatId(fullChat.id);
        setChatTitle(fullChat.title);
        setMessages(fullChat.messages || []);
        setIsChatSaved(true);
        setServerConnectionError(false);
        setTitleUpdated(true); // Mark as updated since we loaded an existing title
        setUploadedFiles([]); // Reset uploaded files for now
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setServerConnectionError(true);
      // Fallback to basic chat data
      setCurrentChatId(chat.id);
      setChatTitle(chat.title);
      setMessages([]);
      setIsChatSaved(true);
      setTitleUpdated(true);
    }
  };

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
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
        <title>{chatTitle} - Tutortron</title>
        <meta name="description" content="Chat with your AI tutor" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Server Connection Warning */}
      {serverConnectionError && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm">Chat history may not be saved due to server connection issues</span>
          </div>
        </div>
      )}

      {/* Sidebar for chat history */}
      <ChatSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        currentChatId={currentChatId}
        refreshTrigger={sidebarRefreshTrigger}
        useServerStorage={!serverConnectionError} // Disable server storage if there are connection issues
      />

      {/* Main chat container */}
      <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
        {/* Chat header */}
        <ChatHeader
          onMenuClick={toggleSidebar}
          title={chatTitle}
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