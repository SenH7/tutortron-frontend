// src/utils/activityTracker.js
class ActivityTracker {
  constructor() {
    this.activities = [];
    this.flaggedKeywords = [
      // Add inappropriate keywords that should be flagged
      'inappropriate', 'spam', 'hack', 'cheat', 'illegal'
    ];
  }

  // Track user activity
  trackActivity(userId, userName, action, details, messageContent = null) {
    const activity = {
      id: Date.now().toString(),
      userId,
      userName,
      action,
      details,
      messageContent,
      timestamp: new Date().toISOString(),
      flagged: this.shouldFlag(messageContent, action),
      flagReason: this.getFlagReason(messageContent, action),
      sessionId: this.generateSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator?.userAgent || 'Unknown'
    };

    this.activities.push(activity);
    
    // In a real app, you would send this to your backend
    this.sendToBackend(activity);
    
    return activity;
  }

  // Check if content should be flagged
  shouldFlag(content, action) {
    if (!content) return false;
    
    const lowerContent = content.toLowerCase();
    
    // Check for inappropriate keywords
    for (const keyword of this.flaggedKeywords) {
      if (lowerContent.includes(keyword)) {
        return true;
      }
    }
    
    // Check for excessive caps (possible shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      return true;
    }
    
    // Check for excessive repetition
    const words = content.split(' ');
    const wordCounts = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > 5) {
        return true;
      }
    }
    
    return false;
  }

  // Get reason for flagging
  getFlagReason(content, action) {
    if (!content) return null;
    
    const lowerContent = content.toLowerCase();
    
    for (const keyword of this.flaggedKeywords) {
      if (lowerContent.includes(keyword)) {
        return `Contains inappropriate keyword: ${keyword}`;
      }
    }
    
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      return 'Excessive use of capital letters';
    }
    
    const words = content.split(' ');
    const wordCounts = {};
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      if (wordCounts[word] > 5) {
        return `Excessive repetition of word: ${word}`;
      }
    }
    
    return null;
  }

  // Generate session ID
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  // Get client IP (mock implementation)
  getClientIP() {
    return '192.168.1.1'; // In a real app, this would come from the request
  }

  // Send activity to backend
  async sendToBackend(activity) {
    try {
      // In a real app, you would send this to your API
      // await fetch('/api/activities', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(activity)
      // });
      
      // For demo purposes, just log it
      console.log('Activity tracked:', activity);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  // Get recent activities
  getActivities(limit = 50) {
    return this.activities.slice(-limit);
  }

  // Get flagged activities
  getFlaggedActivities() {
    return this.activities.filter(activity => activity.flagged);
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

export default activityTracker;