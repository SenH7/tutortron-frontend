// src/pages/admin/login.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
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

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in as admin
  useEffect(() => {
    const loggedInUser = localStorage.getItem('tutortronUser');
    if (loggedInUser) {
      const userData = JSON.parse(loggedInUser);
      if (userData.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // This is a mock admin login for demonstration purposes
    // In a real app, you would send a request to your authentication API
    setTimeout(() => {
      // Mock admin authentication logic
      if (email === 'admin@tutortron.com' && password === 'admin123') {
        // Save admin user data to localStorage
        localStorage.setItem('tutortronUser', JSON.stringify({
          id: 'admin-1',
          name: 'System Administrator',
          email: 'admin@tutortron.com',
          role: 'admin'
        }));
        
        // Redirect to admin dashboard
        router.push('/admin');
      } else {
        setError('Invalid admin credentials. Try admin@tutortron.com / admin123');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <Head>
        <title>Admin Login - Tutortron</title>
        <meta name="description" content="Administrator login for Tutortron" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 bg-foreground rounded-lg flex items-center justify-center text-background text-lg font-bold">
              T
            </div>
            <span className="text-2xl font-bold">Tutortron</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Administrator Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Access the admin dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Demo credentials info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm">
              <strong>Demo Admin Credentials:</strong><br />
              Email: admin@tutortron.com<br />
              Password: admin123
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Admin Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-black/20"
                  placeholder="admin@tutortron.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-black/20"
                  placeholder="admin123"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full justify-center"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in as Admin'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-black/20 text-gray-500 dark:text-gray-400">
                  Not an admin?
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-black/10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                Student Login
              </Link>
              <Link href="/" className="w-full flex justify-center py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Back to Home
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}