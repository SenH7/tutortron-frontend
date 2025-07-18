// src/pages/admin/chats.js - New admin page for chat monitoring
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  getAdminChats, 
  getFlaggedContent, 
  getAdminStatistics,
  loadChatWithMessages,
  flagChat,
  flagMessage 
} from '@/utils/chatStorageServer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Chat Detail Modal Component
const ChatDetailModal = ({ chat, isOpen, onClose, onFlagChat, onFlagMessage }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && chat) {
      loadChatMessages();
    }
  }, [isOpen, chat]);

  const loadChatMessages = async () => {
    setIsLoading(true);
    try {
      const fullChat = await loadChatWithMessages(chat.id, null, true); // Admin view
      setMessages(fullChat?.messages || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagMessage = async (messageId, reason) => {
    try {
      await flagMessage(messageId, reason);
      // Refresh messages
      loadChatMessages();
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  if (!isOpen || !chat) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold mb-2">Chat Details</h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Title:</strong> {chat.title}</p>
              <p><strong>User:</strong> {chat.user_name} ({chat.user_email})</p>
              <p><strong>Created:</strong> {new Date(chat.created_at).toLocaleString()}</p>
              <p><strong>Messages:</strong> {chat.message_count}</p>
              {chat.is_flagged && (
                <p className="text-red-600 dark:text-red-400">
                  <strong>⚠️ Flagged:</strong> {chat.flag_reason}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!chat.is_flagged && (
              <Button
                onClick={() => onFlagChat(chat.id, 'Flagged by administrator')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Flag Chat
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages found</p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-12' 
                      : 'bg-gray-50 dark:bg-gray-800 mr-12'
                  } ${message.is_flagged ? 'border-2 border-red-300 dark:border-red-700' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        message.role === 'user' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {message.role === 'user' ? 'Student' : 'AI Tutor'}
                      </span>
                      {message.is_flagged && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          Flagged: {message.flag_reason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{new Date(message.timestamp).toLocaleString()}</span>
                      {!message.is_flagged && message.role === 'user' && (
                        <button
                          onClick={() => handleFlagMessage(message.id, 'Inappropriate content')}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title="Flag this message"
                        >
                          🚩
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminChats() {
  const [chats, setChats] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState({ flaggedChats: [], flaggedMessages: [] });
  const [statistics, setStatistics] = useState({});
  const [selectedTab, setSelectedTab] = useState('all-chats');
  const [selectedChat, setSelectedChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showChatModal, setShowChatModal] = useState(false);
  const router = useRouter();

  const ITEMS_PER_PAGE = 20;

  // Check admin authentication
  useEffect(() => {
    const user = localStorage.getItem('tutortronUser');
    if (!user) {
      router.push('/admin/login');
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      if (userData.role !== 'admin') {
        router.push('/');
        return;
      }
    } catch (error) {
      router.push('/admin/login');
      return;
    }

    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [chatsData, flaggedData, statsData] = await Promise.all([
        getAdminChats(100, 0),
        getFlaggedContent(50),
        getAdminStatistics()
      ]);

      setChats(chatsData);
      setFlaggedContent(flaggedData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChat = (chat) => {
    setSelectedChat(chat);
    setShowChatModal(true);
  };

  const handleFlagChat = async (chatId, reason) => {
    try {
      await flagChat(chatId, reason);
      await loadAdminData(); // Refresh data
      setShowChatModal(false);
    } catch (error) {
      console.error('Error flagging chat:', error);
    }
  };

  const handleFlagMessage = async (messageId, reason) => {
    try {
      await flagMessage(messageId, reason);
      await loadAdminData(); // Refresh data
    } catch (error) {
      console.error('Error flagging message:', error);
    }
  };

  // Filter chats based on search term
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredChats.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedChats = filteredChats.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Loading admin data...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] min-h-screen bg-gray-50 dark:bg-gray-900`}>
      <Head>
        <title>Chat Monitoring - Tutortron Admin</title>
        <meta name="description" content="Monitor and manage user chats" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white dark:bg-black/10 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button href="/admin" variant="secondary">← Back to Dashboard</Button>
              <h1 className="text-2xl font-bold">Chat Monitoring</h1>
            </div>
            <Button onClick={loadAdminData} variant="secondary">
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-2xl font-bold">{statistics.total_chats || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Chats</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold">{statistics.total_messages || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-red-600">{statistics.flagged_chats || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Flagged Chats</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-red-600">{statistics.flagged_messages || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Flagged Messages</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-green-600">{statistics.active_users || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Users (7d)</div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('all-chats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'all-chats'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Chats ({chats.length})
              </button>
              <button
                onClick={() => setSelectedTab('flagged-content')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'flagged-content'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Flagged Content ({(flaggedContent.flaggedChats?.length || 0) + (flaggedContent.flaggedMessages?.length || 0)})
              </button>
            </nav>
          </div>
        </div>

        {selectedTab === 'all-chats' && (
          <>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search chats by title, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black/20"
                />
              </div>
            </div>

            {/* Chats Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Chat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedChats.map((chat) => (
                      <tr key={chat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs truncate">
                              {chat.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {chat.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {chat.user_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {chat.user_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 dark:text-gray-100">{chat.message_count}</span>
                            {chat.flagged_message_count > 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                {chat.flagged_message_count} flagged
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {chat.is_flagged ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                              ⚠️ Flagged
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                              ✓ Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(chat.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewChat(chat)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                          >
                            View
                          </button>
                          {!chat.is_flagged && (
                            <button
                              onClick={() => handleFlagChat(chat.id, 'Flagged by administrator')}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              Flag
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-transparent px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredChats.length)} of {filteredChats.length} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {selectedTab === 'flagged-content' && (
          <div className="space-y-8">
            {/* Flagged Chats */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Flagged Chats ({flaggedContent.flaggedChats?.length || 0})</h3>
              {flaggedContent.flaggedChats?.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No flagged chats found</Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {flaggedContent.flaggedChats?.map((chat) => (
                      <div key={chat.id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {chat.title}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p><strong>User:</strong> {chat.user_name} ({chat.user_email})</p>
                              <p><strong>Flagged:</strong> {new Date(chat.updated_at).toLocaleString()}</p>
                              <p className="text-red-600 dark:text-red-400">
                                <strong>Reason:</strong> {chat.flag_reason}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleViewChat(chat)}
                            variant="secondary"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Flagged Messages */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Flagged Messages ({flaggedContent.flaggedMessages?.length || 0})</h3>
              {flaggedContent.flaggedMessages?.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">No flagged messages found</Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {flaggedContent.flaggedMessages?.map((message) => (
                      <div key={message.id} className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                Message in "{message.chat_title}"
                              </h4>
                              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                Flagged
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                              <p><strong>User:</strong> {message.user_name} ({message.user_email})</p>
                              <p><strong>Sent:</strong> {new Date(message.timestamp).toLocaleString()}</p>
                              <p className="text-red-600 dark:text-red-400">
                                <strong>Reason:</strong> {message.flag_reason}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Detail Modal */}
      <ChatDetailModal
        chat={selectedChat}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        onFlagChat={handleFlagChat}
        onFlagMessage={handleFlagMessage}
      />
    </div>
  );
}