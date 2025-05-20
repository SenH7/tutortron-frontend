// src/components/chat/ChatHeader.js
const ChatHeader = ({ onMenuClick, title }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/5">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button 
          className="md:hidden mr-3 text-gray-500 hover:text-gray-700"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        
        {/* Chat title - not a link */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>
      
      {/* Optional buttons can go here */}
      <div className="flex items-center space-x-2">
        {/* We're not adding any optional buttons to keep the interface focused */}
      </div>
    </header>
  );
};

export default ChatHeader;