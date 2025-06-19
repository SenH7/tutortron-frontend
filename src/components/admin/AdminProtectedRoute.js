// src/components/admin/AdminProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const AdminProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAuth = () => {
      const user = localStorage.getItem('tutortronUser');
      
      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
          router.push('/');
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        router.push('/admin/login');
        return;
      }
      
      setIsLoading(false);
    };

    checkAdminAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Verifying admin access...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return children;
};

export { AdminProtectedRoute };