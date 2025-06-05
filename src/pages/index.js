import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Geist, Geist_Mono } from "next/font/google";

// Import layout components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Import home page components
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTASection from '@/components/home/CTASection';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in, redirect to chat if yes
  useEffect(() => {
    const user = localStorage.getItem('tutortronUser');
    if (user) {
      router.push('/chat');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 border-t-2 border-b-2 border-foreground rounded-full animate-spin"></div>
          <h1 className="text-xl font-medium">Loading Tutortron...</h1>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)]`}>
      <Head>
        <title>Tutortron - Free AI-Powered Tutoring Platform</title>
        <meta name="description" content="Tutortron is a free AI-powered tutoring platform that helps students learn at their own pace through personalized learning experiences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}