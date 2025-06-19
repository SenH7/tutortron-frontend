// src/pages/api/admin/stats.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Mock statistics - replace with actual database queries
      const stats = {
        totalUsers: 1247,
        activeUsers: 1189,
        blockedUsers: 58,
        totalSessions: 15432,
        flaggedActivities: 23,
        totalMessages: 89751,
        averageSessionDuration: 16.5,
        topSubjects: [
          { subject: 'Mathematics', sessions: 4521 },
          { subject: 'Physics', sessions: 3210 },
          { subject: 'Chemistry', sessions: 2987 },
          { subject: 'Biology', sessions: 2456 },
          { subject: 'English', sessions: 2258 }
        ],
        dailyActiveUsers: [
          { date: '2024-01-14', count: 234 },
          { date: '2024-01-15', count: 267 },
          { date: '2024-01-16', count: 298 },
          { date: '2024-01-17', count: 243 },
          { date: '2024-01-18', count: 276 },
          { date: '2024-01-19', count: 289 },
          { date: '2024-01-20', count: 312 }
        ],
        recentAlerts: [
          {
            id: '1',
            type: 'high_activity',
            message: 'Unusual spike in flagged messages detected',
            timestamp: '2024-01-20T15:30:00Z',
            severity: 'medium'
          },
          {
            id: '2',
            type: 'user_blocked',
            message: 'User bob@example.com has been blocked',
            timestamp: '2024-01-19T16:45:00Z',
            severity: 'low'
          }
        ]
      };

      res.status(200).json({ stats });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}