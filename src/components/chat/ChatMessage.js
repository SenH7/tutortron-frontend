import { useState } from 'react';

const ChatMessage = ({ message }) => {
  const { role, content } = message;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Function to parse and render formatted text
  const renderFormattedContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Empty line - add spacing
        elements.push(<br key={`br-${currentIndex++}`} />);
        continue;
      }

      // Check for numbered sections (1. **Title:** or 1. **Title**)
      const numberedMatch = line.match(/^(\d+)\.\s*\*\*([^*]+)\*\*(.*)$/);
      if (numberedMatch) {
        const [, number, title, rest] = numberedMatch;
        elements.push(
          <div key={currentIndex++} className="mt-4 mb-2">
            <span className="font-bold text-lg">
              {number}. <strong>{title}</strong>
            </span>
            {rest && <span>{rest}</span>}
          </div>
        );
        continue;
      }

      // Check for bullet points with **bold** text
      const bulletBoldMatch = line.match(/^-\s*\*\*([^*]+)\*\*(.*)$/);
      if (bulletBoldMatch) {
        const [, boldText, rest] = bulletBoldMatch;
        elements.push(
          <div key={currentIndex++} className="ml-4 mb-1">
            • <strong>{boldText}</strong>{rest}
          </div>
        );
        continue;
      }

      // Check for regular bullet points
      const bulletMatch = line.match(/^-\s+(.+)$/);
      if (bulletMatch) {
        elements.push(
          <div key={currentIndex++} className="ml-4 mb-1">
            • {bulletMatch[1]}
          </div>
        );
        continue;
      }

      // Check for nested bullet points (indented)
      const nestedBulletMatch = line.match(/^\s{2,}-\s+(.+)$/);
      if (nestedBulletMatch) {
        elements.push(
          <div key={currentIndex++} className="ml-8 mb-1">
            ◦ {nestedBulletMatch[1]}
          </div>
        );
        continue;
      }

      // Check for **bold** text in regular lines
      const boldMatches = line.split(/(\*\*[^*]+\*\*)/);
      if (boldMatches.length > 1) {
        elements.push(
          <p key={currentIndex++} className="mb-2">
            {boldMatches.map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={currentIndex++} className="mb-2">
          {line}
        </p>
      );
    }

    return elements;
  };

  return (
    <div className={`flex py-6 ${role === 'user' ? 'justify-end' : ''}`}>
      {role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 shrink-0">
          T
        </div>
      )}

      <div className={`relative group max-w-[80%] ${role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2' : 'flex-1'}`}>
        {role === 'assistant' && (
          <button
            onClick={copyToClipboard}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Copy message"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            )}
          </button>
        )}
        
        <div className="leading-relaxed">
          {role === 'assistant' ? renderFormattedContent(content) : content}
        </div>
      </div>

      {role === 'user' && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;