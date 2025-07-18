import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Unauthorized() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Head>
        <title>Access Denied - Tutortron</title>
      </Head>

      <div className="text-center max-w-md mx-auto p-6">
        <div className="h-16 w-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-red-600 dark:text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tutortron is only available to McMaster University students. 
          Please sign in with your McMaster student account.
        </p>
        <button
          onClick={logout}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Try Different Account
        </button>
      </div>
    </div>
  );
}