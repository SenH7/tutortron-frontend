// src/pages/admin.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Geist, Geist_Mono } from "next/font/google";

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    const user = localStorage.getItem('tutortronUser');
    if (!user) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      router.push('/chat');
      return;
    }

    // Load admin data
    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockUsers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active',
          joinDate: '2024-01-15',
          lastActive: '2024-01-20',
          totalSessions: 45,
          flaggedMessages: 0
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          status: 'active',
          joinDate: '2024-01-10',
          lastActive: '2024-01-19',
          totalSessions: 32,
          flaggedMessages: 1
        },
        {
          id: '3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          status: 'blocked',
          joinDate: '2024-01-05',
          lastActive: '2024-01-18',
          totalSessions: 78,
          flaggedMessages: 5
        }
      ];

      const mockActivities = [
        {
          id: '1',
          userId: '1',
          userName: 'John Doe',
          action: 'Chat Session',
          details: 'Asked about calculus derivatives',
          timestamp: '2024-01-20 14:30:00',
          flagged: false
        },
        {
          id: '2',
          userId: '2',
          userName: 'Jane Smith',
          action: 'Chat Session',
          details: 'Inappropriate content detected',
          timestamp: '2024-01-20 13:15:00',
          flagged: true
        },
        {
          id: '3',
          userId: '3',
          userName: 'Bob Wilson',
          action: 'Account Blocked',
          details: 'Multiple violations of terms of service',
          timestamp: '2024-01-19 16:45:00',
          flagged: true
        }
      ];

      setUsers(mockUsers);
      setActivities(mockActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setIsLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      // Mock API call - replace with actual implementation
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'blocked' }
          : user
      ));
      
      // Add activity log
      const newActivity = {
        id: Date.now().toString(),
        userId: userId,
        userName: users.find(u => u.id === userId)?.name,
        action: 'Account Blocked',
        details: 'Blocked by administrator',
        timestamp: new Date().toLocaleString(),
        flagged: true
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      alert('User has been blocked successfully');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      // Mock API call - replace with actual implementation
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: 'active' }
          : user
      ));
      
      // Add activity log
      const newActivity = {
        id: Date.now().toString(),
        userId: userId,
        userName: users.find(u => u.id === userId)?.name,
        action: 'Account Unblocked',
        details: 'Unblocked by administrator',
        timestamp: new Date().toLocaleString(),
        flagged: false
      };
      
      setActivities(prev => [newActivity, ...prev]);
      
      alert('User has been unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tutortronUser');
    router.push('/admin/login');
  };

  // Filter users based on search and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Filter activities based on search
  const filteredActivities = activities.filter(activity => 
    activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-foreground rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Loading admin dashboard...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] min-h-screen bg-gray-50 dark:bg-gray-900`}>
      <Head>
        <title>Admin Dashboard - Tutortron</title>
        <meta name="description" content="Tutortron administrator dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white dark:bg-black/10 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center text-background text-sm font-bold">
                T
              </div>
              <h1 className="text-2xl font-bold">Tutortron Admin</h1>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blocked Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.status === 'blocked').length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-600 dark:text-yellow-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flagged Activities</p>
                <p className="text-2xl font-bold">{activities.filter(a => a.flagged).length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setSelectedTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setSelectedTab('activities')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'activities'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Activity Log
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users or activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black/20"
            />
          </div>
          {selectedTab === 'users' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-black/20"
            >
              <option value="all">All Users</option>
              <option value="active">Active Users</option>
              <option value="blocked">Blocked Users</option>
            </select>
          )}
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'users' ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Flagged
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.totalSessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.flaggedMessages > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {user.flaggedMessages}
                          </span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.status === 'active' ? (
                          <button
                            onClick={() => handleBlockUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Unblock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.flagged 
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {activity.flagged ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 dark:text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium">{activity.userName}</h3>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{activity.action}</span>
                          {activity.flagged && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{activity.details}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {activity.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}