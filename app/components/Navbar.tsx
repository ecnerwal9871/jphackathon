'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCurrentUser, getLoginUrl, getLogoutUrl } from '@/lib/auth';
import type { SwaUser } from '@/lib/types';

export default function Navbar() {
  const [user, setUser] = useState<SwaUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return (
    <nav className="bg-brand-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2">
          ✈️ FlightBuddy
        </Link>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-white text-2xl p-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5 text-lg">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline underline-offset-4">Dashboard</Link>
              <Link href="/request" className="hover:underline underline-offset-4">Request Help</Link>
              <Link href="/volunteer" className="hover:underline underline-offset-4">Volunteer</Link>
              <Link href="/matches" className="hover:underline underline-offset-4">Find Matches</Link>
              <Link href="/profile" className="hover:underline underline-offset-4">Profile</Link>
              <span className="text-brand-100 font-medium text-base">👤 {user.userDetails.split(/[@\s]/)[0]}</span>
              <a href={getLogoutUrl()} className="bg-white text-brand-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100">
                Sign Out
              </a>
            </>
          ) : (
            <a href={getLoginUrl()} className="bg-white text-brand-700 font-semibold px-5 py-3 rounded-lg hover:bg-gray-100 text-lg">
              Sign in with Google
            </a>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="sm:hidden border-t border-brand-600 px-4 py-4 space-y-3">
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-2 text-lg hover:underline">Dashboard</Link>
              <Link href="/request" onClick={() => setMenuOpen(false)} className="block py-2 text-lg hover:underline">Request Help</Link>
              <Link href="/volunteer" onClick={() => setMenuOpen(false)} className="block py-2 text-lg hover:underline">Volunteer</Link>
              <Link href="/matches" onClick={() => setMenuOpen(false)} className="block py-2 text-lg hover:underline">Find Matches</Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-lg hover:underline">Profile</Link>
              <div className="py-2 text-brand-100 font-medium">👤 {user.userDetails.split(/[@\s]/)[0]}</div>
              <a href={getLogoutUrl()} className="block bg-white text-brand-700 font-semibold px-4 py-3 rounded-lg text-center text-lg mt-2">
                Sign Out
              </a>
            </>
          ) : (
            <a href={getLoginUrl()} className="block bg-white text-brand-700 font-semibold px-4 py-3 rounded-lg text-center text-lg">
              Sign in with Google
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
