'use client';
import { useEffect, useState } from 'react';
import { getMyTrips } from '@/lib/api';
import TripCard from '@/components/TripCard';
import type { Trip } from '@/lib/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyTrips()
      .then(setTrips)
      .catch(e => setError((e as Error).message || 'Failed to load trips'))
      .finally(() => setLoading(false));
  }, []);

  const requests = trips.filter(t => t.type === 'request');
  const volunteers = trips.filter(t => t.type === 'volunteer');

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-brand-900">Your Trips &amp; Matches</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/request" className="bg-brand-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-brand-700 text-center text-lg">
            ✈️ Request Help
          </Link>
          <Link href="/volunteer" className="bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 text-center text-lg">
            🤝 Volunteer
          </Link>
        </div>
      </div>

      {loading && <p className="text-lg text-gray-700">Loading your trips...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-lg text-red-700">
          ⚠️ {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Assistance Requests</h2>
        {requests.length === 0 && !loading && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
            <p className="text-lg text-gray-700">You haven't posted a travel assistance request yet.</p>
            <Link href="/request" className="inline-block bg-brand-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-700 text-lg">
              ✈️ Post a request now
            </Link>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Volunteer Offers</h2>
        {volunteers.length === 0 && !loading && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
            <p className="text-lg text-gray-700">You haven't offered to volunteer yet.</p>
            <Link href="/volunteer" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 text-lg">
              🤝 Offer your help
            </Link>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {volunteers.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      </section>
    </div>
  );
}
