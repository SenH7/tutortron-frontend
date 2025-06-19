// src/components/admin/UserDetailModal.js
import { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const UserDetailModal = ({ user, isOpen, onClose, onBlockUser, onUnblockUser }) => {
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'block') {
        await onBlockUser(user.id);
      } else {
        await onUnblockUser(user.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">User Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.status === 'active' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {user.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Join Date
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(user.joinDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Sessions
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{user.totalSessions}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Flagged Messages
              </label>
              <p className={`text-sm font-medium ${
                user.flaggedMessages > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {user.flaggedMessages}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Last login:</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(user.lastActive).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Average session duration:</span>
                  <span className="text-gray-600 dark:text-gray-400">15 minutes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Most studied subject:</span>
                  <span className="text-gray-600 dark:text-gray-400">Mathematics</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {user.status === 'active' ? (
              <Button
                onClick={() => handleAction('block')}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? 'Blocking...' : 'Block User'}
              </Button>
            ) : (
              <Button
                onClick={() => handleAction('unblock')}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? 'Unblocking...' : 'Unblock User'}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};