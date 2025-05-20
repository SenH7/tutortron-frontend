import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '../ui/Button';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('tutortronUser');
    setIsLoggedIn(!!user);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('tutortronUser');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 border-b border-black/10 dark:border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-10 w-10 relative">
            {/* Replace with your logo */}
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

          {isLoggedIn ? (
            <>
              <Button href="/chat" variant="secondary">
                Go to Chat
              </Button>
              <Button onClick={handleLogout}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button href="/chat" variant="secondary">
                Go to Chat
              </Button>
              <Button variant="secondary" href="/login">
                Login
              </Button>
              <Button href="/signup">
                Sign Up
              </Button>
            </>
          )}
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
              {isLoggedIn ? (
                <>
                  <Button href="/chat" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    Go to Chat
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Button>
                  <Button href="/signup" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;