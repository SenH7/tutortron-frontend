// src/pages/chat.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Geist, Geist_Mono } from "next/font/google";

// Import layout components
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import ChatMessage from '@/components/chat/ChatMessage';

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
  const messageEndRef = useRef(null);
  
  // Mock user data (in a real app, this would come from authentication)
  const user = {
    name: 'John Doe',
    email: 'student@example.com',
  };

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm your Tutortron AI tutor. How can I help you with your studies today?"
      }]);
    }
  }, [messages.length]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // This would be replaced with your actual API call
      // const response = await fetch('/api/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message }),
      // });
      // const data = await response.json();
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulated AI response
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getSimulatedResponse(message)
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, there was an error processing your request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate simulated responses
  const getSimulatedResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('math') || lowerMessage.includes('algebra') || lowerMessage.includes('equation')) {
      return "I'd be happy to help with your math question. Could you provide the specific problem you're working on? I can guide you through the solution step by step.";
    } else if (lowerMessage.includes('science') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
      return "Science concepts can be fascinating! I can help explain scientific principles, walk through problems, or help you prepare for tests. What specific topic are you studying?";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your Tutortron AI tutor. I'm here to help you with any subject you're studying. What would you like to learn today?";
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! If you have any more questions, feel free to ask. I'm here to help you succeed in your studies.";
    } else {
      return "That's an interesting question. I'd be happy to help you explore this topic further. Could you provide some more details about what you're trying to learn?";
    }
  };

  // Handle starting a new chat
  const handleNewChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Tutortron AI tutor. How can I help you with your studies today?"
    }]);
  };

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle logout (just redirects to homepage)
  const handleLogout = () => {
    window.location.href = '/';
  };

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
            />
          </div>
        </div>
      </div>
    </div>
  );
}