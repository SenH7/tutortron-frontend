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