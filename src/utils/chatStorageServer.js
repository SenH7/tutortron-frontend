// src/utils/chatStorageServer.js - Updated to call Flask backend directly

export const STORAGE_MODE = 'server'; // 'server' or 'local'

// Get the backend URL
const getBackendUrl = () => {
  // In production, you might want to use an environment variable
  return process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'http://localhost:5001';
};

/**
 * Server-side chat storage utilities
 */

/**
 * Get user's chat history from server
 */
export const loadChatHistory = async (userId) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats?userId=${userId}`);
    if (!response.ok) {
      throw new Error('Failed to load chat history');
    }
    const data = await response.json();
    return data.chats || [];
  } catch (error) {
    console.error('Error loading chat history from server:', error);
    // Fallback to localStorage if server fails
    return loadChatHistoryLocal(userId);
  }
};

/**
 * Load a specific chat with messages from server
 */
export const loadChatWithMessages = async (chatId, userId, isAdmin = false) => {
  try {
    const backendUrl = getBackendUrl();
    const params = new URLSearchParams({ userId });
    if (isAdmin) params.append('isAdmin', 'true');
    
    const response = await fetch(`${backendUrl}/api/chats/${chatId}?${params}`);
    if (!response.ok) {
      throw new Error('Failed to load chat');
    }
    const data = await response.json();
    return data.chat;
  } catch (error) {
    console.error('Error loading chat from server:', error);
    return null;
  }
};

/**
 * Create a new chat on server
 */
export const createNewChat = async (userId, userName, userEmail, title = 'New Chat', chatId = null) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userName,
        userEmail,
        title,
        chatId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chat');
    }
    
    const data = await response.json();
    return {
      id: data.chatId,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating chat on server:', error);
    // Fallback to local storage
    return createNewChatLocal(title);
  }
};

/**
 * Save/update a chat on server
 */
export const saveChatToHistory = async (userId, userName, userEmail, chatData) => {
  try {
    // If chat doesn't exist on server, create it first
    if (chatData.id.startsWith('temp_') || !await chatExistsOnServer(chatData.id)) {
      await createNewChat(userId, userName, userEmail, chatData.title, chatData.id);
    }
    
    // Save each message that hasn't been saved yet
    const messagesNeedingSave = chatData.messages.filter(msg => 
      !msg.savedToServer && msg.id !== 'welcome'
    );
    
    for (const message of messagesNeedingSave) {
      await addMessageToChat(chatData.id, message.role, message.content, message.id, userId);
      message.savedToServer = true;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat to server:', error);
    // Fallback to local storage
    return saveChatToHistoryLocal(userId, chatData);
  }
};

/**
 * Add a message to a chat on server
 */
export const addMessageToChat = async (chatId, role, content, messageId = null, userId = null) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        content,
        messageId,
        userId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add message');
    }
    
    const data = await response.json();
    return {
      messageId: data.messageId,
      isFlagged: data.isFlagged,
      flagReason: data.flagReason
    };
  } catch (error) {
    console.error('Error adding message to server:', error);
    throw error;
  }
};

/**
 * Update chat title on server
 */
export const updateChatTitle = async (userId, chatId, newTitle) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats/${chatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        userId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update chat title');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating chat title on server:', error);
    return false;
  }
};

/**
 * Delete a chat from server
 */
export const deleteChatFromHistory = async (userId, chatId) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats/${chatId}?userId=${userId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting chat from server:', error);
    return false;
  }
};

/**
 * Check if chat exists on server
 */
const chatExistsOnServer = async (chatId) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/chats/${chatId}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Generate a chat title from the first user message
 */
export const generateChatTitle = (firstUserMessage) => {
  if (!firstUserMessage || typeof firstUserMessage !== 'string') {
    return 'New Chat';
  }
  
  const cleanMessage = firstUserMessage.trim();
  const words = cleanMessage.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  if (cleanMessage.length > title.length) {
    title += '...';
  }
  
  if (!title || title.length < 3) {
    return 'New Chat';
  }
  
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title;
};

/**
 * Get chat statistics from server
 */
export const getChatStats = async (userId) => {
  try {
    const chats = await loadChatHistory(userId);
    
    const totalChats = chats.length;
    const totalMessages = chats.reduce((sum, chat) => sum + (chat.messageCount || 0), 0);
    const averageMessagesPerChat = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;
    const mostRecentChat = chats.length > 0 ? chats[0].lastUpdated : null;
    
    return {
      totalChats,
      totalMessages,
      averageMessagesPerChat,
      mostRecentChat
    };
  } catch (error) {
    console.error('Error getting chat statistics:', error);
    return {
      totalChats: 0,
      totalMessages: 0,
      averageMessagesPerChat: 0,
      mostRecentChat: null
    };
  }
};

// ===== FALLBACK FUNCTIONS (Local Storage) =====

const loadChatHistoryLocal = (userId) => {
  try {
    const savedChats = localStorage.getItem(`tutortron_chats_${userId}`);
    if (savedChats) {
      const chats = JSON.parse(savedChats);
      chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      return chats;
    }
    return [];
  } catch (error) {
    console.error('Error loading local chat history:', error);
    return [];
  }
};

const createNewChatLocal = (title = 'New Chat') => {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: chatId,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
};

const saveChatToHistoryLocal = (userId, chatData) => {
  try {
    const existingChats = loadChatHistoryLocal(userId);
    
    const chatIndex = existingChats.findIndex(chat => chat.id === chatData.id);
    if (chatIndex !== -1) {
      existingChats[chatIndex] = {
        ...existingChats[chatIndex],
        ...chatData,
        lastUpdated: new Date().toISOString()
      };
    } else {
      existingChats.unshift({
        ...chatData,
        lastUpdated: new Date().toISOString()
      });
    }

    const limitedChats = existingChats.slice(0, 50);
    localStorage.setItem(`tutortron_chats_${userId}`, JSON.stringify(limitedChats));
    return true;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    return false;
  }
};

// ===== ADMIN FUNCTIONS =====

/**
 * Get all chats for admin monitoring
 */
export const getAdminChats = async (limit = 100, offset = 0) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/chats?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error('Failed to load admin chats');
    }
    const data = await response.json();
    return data.chats;
  } catch (error) {
    console.error('Error loading admin chats:', error);
    return [];
  }
};

/**
 * Get flagged content for admin review
 */
export const getFlaggedContent = async (limit = 100) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/flagged-content?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to load flagged content');
    }
    const data = await response.json();
    return {
      flaggedChats: data.flaggedChats,
      flaggedMessages: data.flaggedMessages
    };
  } catch (error) {
    console.error('Error loading flagged content:', error);
    return { flaggedChats: [], flaggedMessages: [] };
  }
};

/**
 * Get chat statistics for admin dashboard
 */
export const getAdminStatistics = async () => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/statistics`);
    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }
    const data = await response.json();
    return data.statistics;
  } catch (error) {
    console.error('Error loading admin statistics:', error);
    return {
      total_chats: 0,
      total_messages: 0,
      flagged_chats: 0,
      flagged_messages: 0,
      active_users: 0
    };
  }
};

/**
 * Flag a message for admin review
 */
export const flagMessage = async (messageId, reason) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/flag-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, reason })
    });
    
    if (!response.ok) {
      throw new Error('Failed to flag message');
    }
    
    return true;
  } catch (error) {
    console.error('Error flagging message:', error);
    return false;
  }
};

/**
 * Flag a chat for admin review
 */
export const flagChat = async (chatId, reason) => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/admin/flag-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, reason })
    });
    
    if (!response.ok) {
      throw new Error('Failed to flag chat');
    }
    
    return true;
  } catch (error) {
    console.error('Error flagging chat:', error);
    return false;
  }
};