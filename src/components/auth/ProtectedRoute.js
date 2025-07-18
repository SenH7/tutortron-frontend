import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Check if user is from McMaster domain
      if (user && user.username) {
        const email = user.username;
        if (email.endsWith('@mcmaster.ca')) {
          setIsAuthorized(true);
        } else {
          // Not a McMaster student
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Verifying access...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
};

export default ProtectedRoute;