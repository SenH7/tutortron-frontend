// src/components/chat/ChatSidebar.js - Updated with custom delete modal
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { 
  loadChatHistory as loadChats, 
  createNewChat, 
  saveChatToHistory,
  deleteChatFromHistory,
  updateChatTitle 
} from '@/utils/chatStorage';

// Custom Delete Modal Component
const DeleteModal = ({ isOpen, chatTitle, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-[1px] flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Delete chat?
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete this chat?
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatSidebar = ({ user, isOpen, onClose, onNewChat, onLoadChat, currentChatId }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingChat, setEditingChat] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, chatId: null, chatTitle: '' });

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    if (user) {
      refreshChatHistory();
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  const refreshChatHistory = () => {
    if (user) {
      const chats = loadChats(user.id);
      setChatHistory(chats);
    }
  };

  const handleNewChat = () => {
    setIsLoading(true);
    
    try {
      // Don't create or save a new chat here - just tell parent to initialize a new temporary chat
      onNewChat(); // This will create a temporary chat that won't be saved until there's content
      refreshChatHistory(); // Refresh to update any existing chats
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsLoading(false);
      onClose(); // Close sidebar on mobile
    }
  };

  const handleLoadChat = (chat) => {
    if (editingChat === chat.id) return; // Don't load if editing
    onLoadChat(chat);
    onClose(); // Close sidebar on mobile
  };

  const handleMenuClick = (e, chatId) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === chatId ? null : chatId);
  };

  const handleRename = (e, chat) => {
    e.stopPropagation();
    setEditingChat(chat.id);
    setEditTitle(chat.title);
    setActiveMenu(null);
  };

  const handleRenameSubmit = (chatId) => {
    if (editTitle.trim() && editTitle !== chatHistory.find(c => c.id === chatId)?.title) {
      const success = updateChatTitle(user.id, chatId, editTitle.trim());
      if (success) {
        refreshChatHistory();
        // Update current chat title if it's the active one
        if (currentChatId === chatId) {
          // This would need to be passed up to parent component
          // For now, we'll refresh the page to update the title
        }
      }
    }
    setEditingChat(null);
    setEditTitle('');
  };

  const handleRenameCancel = () => {
    setEditingChat(null);
    setEditTitle('');
  };

  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation();
    const chat = chatHistory.find(c => c.id === chatId);
    setDeleteModal({
      isOpen: true,
      chatId: chatId,
      chatTitle: chat?.title || 'this chat'
    });
    setActiveMenu(null);
  };

  const handleDeleteConfirm = () => {
    const success = deleteChatFromHistory(user.id, deleteModal.chatId);
    if (success) {
      refreshChatHistory();
      
      // If deleted chat was current chat, start a new one
      if (currentChatId === deleteModal.chatId) {
        handleNewChat();
      }
    }
    setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, chatId: null, chatTitle: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('tutortronUser');
    window.location.href = '/login';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateTitle = (title, maxLength = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative top-0 bottom-0 left-0 z-50 
          w-72 bg-white dark:bg-black/10 border-r border-gray-200 dark:border-gray-800
          flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar header with logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center text-background text-sm font-bold">
              T
            </div>
            <span className="text-lg font-bold">Tutortron</span>
          </div>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-full font-medium transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
                Creating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New chat
              </>
            )}
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-4">
            Chat History
          </h3>
          
          {chatHistory.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No chat history yet
            </p>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`relative group rounded-lg transition-all duration-200 ${
                    currentChatId === chat.id 
                      ? 'bg-gray-100 dark:bg-white/10' 
                      : 'hover:bg-gray-50 dark:hover:bg-white/5 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20'
                  }`}
                >
                  <div
                    onClick={() => handleLoadChat(chat)}
                    className="w-full text-left p-3 rounded-lg cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      {editingChat === chat.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSubmit(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSubmit(chat.id);
                            } else if (e.key === 'Escape') {
                              handleRenameCancel();
                            }
                          }}
                          className="w-full bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <div className="font-medium text-sm text-gray-900 dark:text-white truncate mb-1">
                            {truncateTitle(chat.title)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(chat.lastUpdated)}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Three-dot menu button */}
                    {editingChat !== chat.id && (
                      <div className="relative">
                        <button
                          onClick={(e) => handleMenuClick(e, chat.id)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="More options"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600 dark:text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {activeMenu === chat.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                            <button
                              onClick={(e) => handleRename(e, chat)}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, chat.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User profile and logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user?.name || 'Student'}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'student@example.com'}
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full justify-center"
          >
            Log out
          </Button>
        </div>
      </div>

      {/* Custom Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        chatTitle={deleteModal.chatTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default ChatSidebar;