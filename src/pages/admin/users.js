// src/pages/api/admin/users.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all users with their activity data
    try {
      // Mock data - replace with actual database queries
      const users = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
          joinDate: '2024-01-15',
          lastActive: '2024-01-20T14:30:00Z',
          totalSessions: 45,
          flaggedMessages: 0,
          totalMessages: 234,
          averageSessionDuration: 15,
          mostStudiedSubject: 'Mathematics'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'active',
          joinDate: '2024-01-10',
          lastActive: '2024-01-19T13:15:00Z',
          totalSessions: 32,
          flaggedMessages: 1,
          totalMessages: 187,
          averageSessionDuration: 12,
          mostStudiedSubject: 'Physics'
        },
        {
          id: '3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          status: 'blocked',
          joinDate: '2024-01-05',
          lastActive: '2024-01-18T16:45:00Z',
          totalSessions: 78,
          flaggedMessages: 5,
          totalMessages: 412,
          averageSessionDuration: 20,
          mostStudiedSubject: 'Chemistry'
        }
      ];

      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'PUT') {
    // Update user status (block/unblock)
    const { userId, action } = req.body;
    
    try {
      // Mock API call - replace with actual database update
      // In a real app, you would:
      // 1. Verify admin authentication
      // 2. Update user status in database
      // 3. Log the admin action
      // 4. Optionally send email notification to user
      
      const newStatus = action === 'block' ? 'blocked' : 'active';
      
      // Log admin action
      const adminAction = {
        adminId: req.body.adminId, // Should come from authenticated session
        action: action === 'block' ? 'USER_BLOCKED' : 'USER_UNBLOCKED',
        targetUserId: userId,
        timestamp: new Date().toISOString(),
        reason: req.body.reason || 'No reason provided'
      };
      
      res.status(200).json({ 
        success: true, 
        userId, 
        newStatus,
        adminAction 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user status' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}