// src/pages/api/admin/activities.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Mock activity data - replace with actual database queries
      const activities = [
        {
          id: '1',
          userId: '1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          action: 'Chat Session',
          details: 'Asked about calculus derivatives and integration',
          messageContent: 'Can you help me understand how to find the derivative of x²?',
          timestamp: '2024-01-20T14:30:00Z',
          flagged: false,
          flagReason: null,
          sessionId: 'session_123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          userId: '2',
          userName: 'Jane Smith',
          userEmail: 'jane@example.com',
          action: 'Chat Session',
          details: 'Inappropriate content detected by AI moderator',
          messageContent: '[FLAGGED CONTENT HIDDEN]',
          timestamp: '2024-01-20T13:15:00Z',
          flagged: true,
          flagReason: 'Inappropriate language detected',
          sessionId: 'session_124',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '3',
          userId: '3',
          userName: 'Bob Wilson',
          userEmail: 'bob@example.com',
          action: 'Account Blocked',
          details: 'Account blocked due to multiple violations of terms of service',
          messageContent: null,
          timestamp: '2024-01-19T16:45:00Z',
          flagged: true,
          flagReason: 'Multiple ToS violations',
          sessionId: null,
          ipAddress: '192.168.1.3',
          userAgent: 'Mozilla/5.0...'
        },
        {
          id: '4',
          userId: '1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          action: 'Login',
          details: 'User logged in to the platform',
          messageContent: null,
          timestamp: '2024-01-20T14:00:00Z',
          flagged: false,
          flagReason: null,
          sessionId: 'session_123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }
      ];

      // Filter by query parameters
      const { userId, flagged, limit = 50 } = req.query;
      
      let filteredActivities = activities;
      
      if (userId) {
        filteredActivities = filteredActivities.filter(a => a.userId === userId);
      }
      
      if (flagged !== undefined) {
        const isFlagged = flagged === 'true';
        filteredActivities = filteredActivities.filter(a => a.flagged === isFlagged);
      }
      
      // Limit results
      filteredActivities = filteredActivities.slice(0, parseInt(limit));

      res.status(200).json({ activities: filteredActivities });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  } else if (req.method === 'PUT') {
    // Flag/unflag an activity
    const { activityId, action, reason } = req.body;
    
    try {
      // Mock API call - replace with actual database update
      const flagged = action === 'flag';
      
      // Log admin action
      const adminAction = {
        adminId: req.body.adminId, // Should come from authenticated session
        action: flagged ? 'ACTIVITY_FLAGGED' : 'ACTIVITY_UNFLAGGED',
        targetActivityId: activityId,
        timestamp: new Date().toISOString(),
        reason: reason || 'No reason provided'
      };
      
      res.status(200).json({ 
        success: true, 
        activityId, 
        flagged,
        adminAction 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update activity' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}