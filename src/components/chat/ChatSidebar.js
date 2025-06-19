import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import FileUpload from './FileUpload';

const ChatSidebar = ({ user, chatHistory, isOpen, onClose, onNewChat }) => {
  const [, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('tutortronUser');
    setIsLoggedIn(!!user);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tutortronUser');
    setIsLoggedIn(false);
    window.location.href = '/login';
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
        {/* Sidebar header with logo - no link */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center text-background text-sm font-bold">
              T
            </div>
            <span className="text-lg font-bold">Tutortron</span>
          </div>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
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
          <Button
            onClick={onNewChat}
            className="w-full justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New chat
          </Button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Chat History</h3>
          <ul className="space-y-2">
            {chatHistory.map((chat) => (
              <li key={chat.id}>
                <button
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm"
                  onClick={() => {/* Load this chat */ }}
                >
                  <div className="truncate font-medium">{chat.title}</div>
                  <div className="text-xs text-gray-500">{new Date(chat.date).toLocaleDateString()}</div>
                </button>
              </li>
            ))}
            {chatHistory.length === 0 && (
              <li className="text-sm text-gray-500 py-2">No chat history yet</li>
            )}
          </ul>
        </div>

        {/* User profile and logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-medium">{user?.name || 'Student'}</div>
              <div className="text-xs text-gray-500">{user?.email || 'student@example.com'}</div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="w-full justify-center"
          >
            Log out
          </Button>
        </div>
      </div>
    </>
  );
};

export default ChatSidebar;