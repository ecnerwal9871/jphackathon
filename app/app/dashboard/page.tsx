'use client';
import { useEffect, useState } from 'react';
import { getMyTrips } from '@/lib/api';
import TripCard from '@/components/TripCard';
import type { Trip } from '@/lib/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyTrips()
      .then(setTrips)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const requests = trips.filter(t => t.type === 'request');
  const volunteers = trips.filter(t => t.type === 'volunteer');

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-900">My Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/request" className="bg-brand-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-brand-700">
            + Request Help
          </Link>
          <Link href="/volunteer" className="bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700">
            + Volunteer
          </Link>
        </div>
      </div>

      {loading && <p className="text-lg text-gray-500">Loading your trips...</p>}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Assistance Requests</h2>
        {requests.length === 0 && !loading && (
          <p className="text-gray-500">No requests yet. <Link href="/request" className="text-brand-600 underline">Post one now</Link>.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Volunteer Offers</h2>
        {volunteers.length === 0 && !loading && (
          <p className="text-gray-500">No volunteer trips yet. <Link href="/volunteer" className="text-brand-600 underline">Offer your help</Link>.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {volunteers.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      </section>
    </div>
  );
}
