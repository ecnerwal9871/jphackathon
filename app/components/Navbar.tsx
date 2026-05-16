'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser, getLoginUrl, getLogoutUrl } from '@/lib/auth';
import type { SwaUser } from '@/lib/types';

export default function Navbar() {
  const [user, setUser] = useState<SwaUser | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <nav className="bg-brand-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          FlightBuddy
        </Link>
        <div className="flex items-center gap-6 text-lg">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <Link href="/matches" className="hover:underline">Find Matches</Link>
              <Link href="/profile" className="hover:underline">Profile</Link>
              <a href={getLogoutUrl()} className="bg-white text-brand-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100">
                Sign Out
              </a>
            </>
          ) : (
            <a href={getLoginUrl()} className="bg-white text-brand-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100">
              Sign in with Google
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
