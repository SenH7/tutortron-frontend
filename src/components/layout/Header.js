// src/components/layout/Header.js - Updated with admin link
import { useState } from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-black/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 relative">
            <div className="h-10 w-10 bg-foreground rounded-lg flex items-center justify-center text-background text-lg font-bold">
              T
            </div>
          </div>
          <span className="text-xl font-bold">Tutortron</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="hover:text-gray-600 dark:hover:text-gray-300">
            Features
          </Link>
          <Link href="#how-it-works" className="hover:text-gray-600 dark:hover:text-gray-300">
            How It Works
          </Link>
          <Link href="#testimonials" className="hover:text-gray-600 dark:hover:text-gray-300">
            Testimonials
          </Link>

          <Button href="/chat" variant="secondary">
            Go to Chat
          </Button>
          <Button variant="secondary" href="/login">
            Login
          </Button>
          <Button href="/signup">
            Sign Up
          </Button>
          
          {/* Admin link - small and discrete */}
          <Link 
            href="/admin/login" 
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Admin
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-black/10 dark:border-white/10 z-50">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="#features"
              className="block hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="block hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#testimonials"
              className="block hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </Link>
            <div className="pt-4 flex flex-col gap-3">
              <Button href="/chat" variant="secondary">
                Go to Chat
              </Button>
              <Button variant="secondary" href="/login">
                Login
              </Button>
              <Button href="/signup">
                Sign Up
              </Button>
              <Link 
                href="/admin/login" 
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-center py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;