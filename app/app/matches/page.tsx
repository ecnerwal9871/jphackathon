'use client';
import { useEffect, useState } from 'react';
import { getMatchingTrips, createMatch, getMyTrips } from '@/lib/api';
import TripCard from '@/components/TripCard';
import type { Trip } from '@/lib/types';

export default function MatchesPage() {
  const [matchingTrips, setMatchingTrips] = useState<Trip[]>([]);
  const [myVolunteerTrip, setMyVolunteerTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getMatchingTrips(), getMyTrips()])
      .then(([matches, myTrips]) => {
        setMatchingTrips(matches);
        const vol = myTrips.find(t => t.type === 'volunteer' && t.status === 'open');
        setMyVolunteerTrip(vol || null);
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function handleHelp(requestTrip: Trip) {
    if (!myVolunteerTrip) return;
    try {
      await createMatch(requestTrip.id, myVolunteerTrip.id);
      setMatchingTrips(prev => prev.filter(t => t.id !== requestTrip.id));
      alert('Match created! Both of you will receive an email notification.');
    } catch (e: unknown) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-900">Available Requests</h1>
      {!myVolunteerTrip && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-lg text-yellow-800">
          You need to <a href="/volunteer" className="underline font-semibold">post a volunteer trip</a> first before you can help someone.
        </div>
      )}
      {loading && <p className="text-gray-500 text-lg">Loading requests...</p>}
      {error && <p className="text-red-600 text-lg">{error}</p>}
      {matchingTrips.length === 0 && !loading && (
        <p className="text-gray-500 text-lg">No matching requests right now. Check back later!</p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {matchingTrips.map(trip => (
          <TripCard
            key={trip.id}
            trip={trip}
            onAction={myVolunteerTrip ? () => handleHelp(trip) : undefined}
            actionLabel="I'll Help"
          />
        ))}
      </div>
    </div>
  );
}
