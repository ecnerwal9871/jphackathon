import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import AppInsightsInit from '@/components/AppInsightsInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlightBuddy - Travel Companion for Elderly Flyers',
  description:
    'Connect elderly solo travelers with willing volunteers on the same international flight.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <AppInsightsInit />
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
