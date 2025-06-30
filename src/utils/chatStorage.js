// src/utils/chatStorage.js - Utility functions for chat history management

export const CHAT_STORAGE_KEY = 'tutortron_chats';
export const MAX_CHATS_PER_USER = 50;

/**
 * Get the storage key for a specific user
 */
export const getUserChatKey = (userId) => `${CHAT_STORAGE_KEY}_${userId}`;

/**
 * Load chat history for a user
 */
export const loadChatHistory = (userId) => {
  try {
    const savedChats = localStorage.getItem(getUserChatKey(userId));
    if (savedChats) {
      const chats = JSON.parse(savedChats);
      // Sort by last updated (most recent first)
      chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      return chats;
    }
    return [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

/**
 * Save a chat to history
 */
export const saveChatToHistory = (userId, chatData) => {
  try {
    if (!userId || !chatData || !chatData.id) {
      console.warn('Invalid data provided to saveChatToHistory');
      return false;
    }

    const existingChats = loadChatHistory(userId);
    
    // Find and update existing chat or add new one
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

    // Keep only the most recent chats to prevent storage bloat
    const limitedChats = existingChats.slice(0, MAX_CHATS_PER_USER);
    
    localStorage.setItem(getUserChatKey(userId), JSON.stringify(limitedChats));
    return true;
  } catch (error) {
    console.error('Error saving chat to history:', error);
    return false;
  }
};

/**
 * Create a new chat object
 */
export const createNewChat = (title = 'New Chat') => {
  const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: chatId,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Generate a chat title from the first user message
 */
export const generateChatTitle = (firstUserMessage) => {
  if (!firstUserMessage || typeof firstUserMessage !== 'string') {
    return 'New Chat';
  }
  
  // Clean the message and extract first few words
  const cleanMessage = firstUserMessage.trim();
  const words = cleanMessage.split(' ').slice(0, 6);
  let title = words.join(' ');
  
  // Add ellipsis if the original message was longer
  if (cleanMessage.length > title.length) {
    title += '...';
  }
  
  // Ensure title is not empty and has reasonable length
  if (!title || title.length < 3) {
    return 'New Chat';
  }
  
  // Limit title length
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title;
};

/**
 * Delete a chat from history
 */
export const deleteChatFromHistory = (userId, chatId) => {
  try {
    const existingChats = loadChatHistory(userId);
    const filteredChats = existingChats.filter(chat => chat.id !== chatId);
    
    localStorage.setItem(getUserChatKey(userId), JSON.stringify(filteredChats));
    return true;
  } catch (error) {
    console.error('Error deleting chat from history:', error);
    return false;
  }
};

/**
 * Clear all chat history for a user
 */
export const clearChatHistory = (userId) => {
  try {
    localStorage.removeItem(getUserChatKey(userId));
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
};

/**
 * Get a specific chat by ID
 */
export const getChatById = (userId, chatId) => {
  try {
    const chats = loadChatHistory(userId);
    return chats.find(chat => chat.id === chatId) || null;
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    return null;
  }
};

/**
 * Update chat title
 */
export const updateChatTitle = (userId, chatId, newTitle) => {
  try {
    const existingChats = loadChatHistory(userId);
    const chatIndex = existingChats.findIndex(chat => chat.id === chatId);
    
    if (chatIndex !== -1) {
      existingChats[chatIndex].title = newTitle;
      existingChats[chatIndex].lastUpdated = new Date().toISOString();
      
      localStorage.setItem(getUserChatKey(userId), JSON.stringify(existingChats));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating chat title:', error);
    return false;
  }
};

/**
 * Get chat statistics for a user
 */
export const getChatStats = (userId) => {
  try {
    const chats = loadChatHistory(userId);
    
    const totalChats = chats.length;
    const totalMessages = chats.reduce((sum, chat) => sum + (chat.messages?.length || 0), 0);
    const averageMessagesPerChat = totalChats > 0 ? Math.round(totalMessages / totalChats) : 0;
    
    // Find most recent chat
    const mostRecentChat = chats.length > 0 ? chats[0] : null;
    
    return {
      totalChats,
      totalMessages,
      averageMessagesPerChat,
      mostRecentChat: mostRecentChat?.lastUpdated || null
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

/**
 * Export chat history (for backup or sharing)
 */
export const exportChatHistory = (userId) => {
  try {
    const chats = loadChatHistory(userId);
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      totalChats: chats.length,
      chats
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting chat history:', error);
    return null;
  }
};

/**
 * Import chat history (from backup)
 */
export const importChatHistory = (userId, importData) => {
  try {
    const data = typeof importData === 'string' ? JSON.parse(importData) : importData;
    
    if (!data.chats || !Array.isArray(data.chats)) {
      throw new Error('Invalid import data format');
    }
    
    // Validate each chat object
    const validChats = data.chats.filter(chat => 
      chat.id && 
      chat.title && 
      Array.isArray(chat.messages) &&
      chat.createdAt &&
      chat.lastUpdated
    );
    
    // Merge with existing chats (avoid duplicates)
    const existingChats = loadChatHistory(userId);
    const existingIds = new Set(existingChats.map(chat => chat.id));
    
    const newChats = validChats.filter(chat => !existingIds.has(chat.id));
    const mergedChats = [...existingChats, ...newChats];
    
    // Sort and limit
    mergedChats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    const limitedChats = mergedChats.slice(0, MAX_CHATS_PER_USER);
    
    localStorage.setItem(getUserChatKey(userId), JSON.stringify(limitedChats));
    
    return {
      success: true,
      imported: newChats.length,
      total: limitedChats.length
    };
  } catch (error) {
    console.error('Error importing chat history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};