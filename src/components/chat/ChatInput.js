import { useState } from 'react';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end border rounded-xl bg-white dark:bg-black/5 border-gray-300 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500 dark:focus-within:ring-blue-400">
        <textarea
          className="flex-1 max-h-40 p-3 bg-transparent focus:outline-none resize-none"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="1"
          style={{ minHeight: '56px' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`p-3 rounded-r-xl ${
            message.trim() && !isLoading
              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          disabled={!message.trim() || isLoading}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
      
      <div className="mt-2 text-xs text-center text-gray-500">
        Tutortron may display inaccurate info. Verify important information.
      </div>
    </form>
  );
};

export default ChatInput;