// src/hooks/useAdminData.js
import { useState, useEffect } from 'react';

export const useAdminData = () => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      // Mock API call - replace with actual API
      const mockUsers = [
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
      setUsers(mockUsers);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const fetchActivities = async () => {
    try {
      // Mock API call - replace with actual API
      const mockActivities = [
        {
          id: '1',
          userId: '1',
          userName: 'John Doe',
          action: 'Chat Session',
          details: 'Asked about calculus derivatives',
          messageContent: 'Can you help me understand derivatives?',
          timestamp: '2024-01-20T14:30:00Z',
          flagged: false,
          flagReason: null
        },
        {
          id: '2',
          userId: '2',
          userName: 'Jane Smith',
          action: 'Chat Session',
          details: 'Inappropriate content detected',
          messageContent: '[CONTENT FLAGGED]',
          timestamp: '2024-01-20T13:15:00Z',
          flagged: true,
          flagReason: 'Inappropriate language detected'
        },
        {
          id: '3',
          userId: '3',
          userName: 'Bob Wilson',
          action: 'Account Blocked',
          details: 'Multiple violations of terms of service',
          messageContent: null,
          timestamp: '2024-01-19T16:45:00Z',
          flagged: true,
          flagReason: 'Multiple ToS violations'
        }
      ];
      setActivities(mockActivities);
    } catch (err) {
      setError('Failed to fetch activities');
    }
  };

  const fetchStats = async () => {
    try {
      // Mock API call - replace with actual API
      const mockStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        blockedUsers: users.filter(u => u.status === 'blocked').length,
        flaggedActivities: activities.filter(a => a.flagged).length
      };
      setStats(mockStats);
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  };

  const blockUser = async (userId, reason = '') => {
    try {
      // Mock API call - replace with actual API
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'blocked' }
          : user
      ));

      // Log activity
      const newActivity = {
        id: Date.now().toString(),
        userId: userId,
        userName: users.find(u => u.id === userId)?.name,
        action: 'Account Blocked',
        details: `Blocked by administrator. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
        flagged: true,
        flagReason: 'Administrative action'
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      return { success: true };
    } catch (err) {
      throw new Error('Failed to block user');
    }
  };

  const unblockUser = async (userId, reason = '') => {
    try {
      // Mock API call - replace with actual API
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'active' }
          : user
      ));

      // Log activity
      const newActivity = {
        id: Date.now().toString(),
        userId: userId,
        userName: users.find(u => u.id === userId)?.name,
        action: 'Account Unblocked',
        details: `Unblocked by administrator. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
        flagged: false,
        flagReason: null
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      return { success: true };
    } catch (err) {
      throw new Error('Failed to unblock user');
    }
  };

  const flagActivity = async (activityId, reason = '') => {
    try {
      // Mock API call - replace with actual API
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { ...activity, flagged: true, flagReason: reason }
          : activity
      ));
      
      return { success: true };
    } catch (err) {
      throw new Error('Failed to flag activity');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchActivities()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (users.length > 0 && activities.length > 0) {
      fetchStats();
    }
  }, [users, activities]);

  return {
    users,
    activities,
    stats,
    isLoading,
    error,
    blockUser,
    unblockUser,
    flagActivity,
    refetch: () => {
      fetchUsers();
      fetchActivities();
    }
  };
};