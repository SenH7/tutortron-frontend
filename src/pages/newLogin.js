import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Geist, Geist_Mono } from "next/font/google";
import { useAuth } from '@/hooks/useAuth';
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

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  const handleMicrosoftLogin = async () => {
    try {
      await login();
      router.push('/chat');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-foreground rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <Head>
        <title>Login - Tutortron</title>
        <meta name="description" content="Login to your Tutortron account with your McMaster credentials" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-12 w-12 bg-foreground rounded-lg flex items-center justify-center text-background text-xl font-bold">
              T
            </div>
            <span className="text-3xl font-bold">Tutortron</span>
          </Link>
        </div>
        
        {/* McMaster University branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* Add McMaster logo here if available */}
            <div className="h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            McMaster University
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in with your McMaster account
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <div className="space-y-6">
            {/* Microsoft Login Button */}
            <Button
              onClick={handleMicrosoftLogin}
              className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-3 py-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </Button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Use your McMaster student account<br />
                (e.g., huans106@mcmaster.ca)
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Only McMaster University students can access Tutortron.<br />
                Need help? Contact IT Support.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}