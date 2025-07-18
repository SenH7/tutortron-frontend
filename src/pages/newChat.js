// At the top of the file, add the import
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function Chat() {
  const { user, logout } = useAuth();
  // ... rest of your existing code

  // Replace the useEffect for checking localStorage with:
  useEffect(() => {
    if (user) {
      // User is authenticated via Microsoft SSO
      const userData = {
        id: user.localAccountId || user.homeAccountId,
        name: user.name,
        email: user.username,
        role: 'student'
      };
      setUser(userData);
      
      // Track login activity
      activityTracker.trackActivity(
        userData.id,
        userData.name,
        'Login',
        'User logged into chat interface via Microsoft SSO'
      );

      // Initialize with a new chat
      initializeNewChat();
    }
  }, [user]);

  // Update handleLogout function:
  const handleLogout = () => {
    if (user) {
      // Track logout activity
      activityTracker.trackActivity(
        user.id,
        user.name,
        'Logout',
        'User logged out of chat interface'
      );
    }
    
    logout(); // This will redirect to Microsoft logout
  };

  // Wrap the entire component return in ProtectedRoute:
  return (
    <ProtectedRoute>
      {/* Your existing JSX */}
    </ProtectedRoute>
  );
}