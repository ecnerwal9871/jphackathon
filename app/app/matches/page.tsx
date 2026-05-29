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
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    Promise.all([getMatchingTrips(), getMyTrips()])
      .then(([matches, myTrips]) => {
        setMatchingTrips(matches);
        const vol = myTrips.find(t => t.type === 'volunteer' && t.status === 'open');
        setMyVolunteerTrip(vol || null);
      })
      .catch(e => {
        const msg = (e as Error).message || 'Unknown error';
        if (msg.includes('COSMOS_ENDPOINT') || msg.includes('API error')) {
          setError('Unable to connect to the database. Please ensure the backend is configured and running.');
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleHelp(requestTrip: Trip) {
    if (!myVolunteerTrip) return;
    setSuccessMsg('');
    setError('');
    try {
      await createMatch(requestTrip.id, myVolunteerTrip.id);
      setMatchingTrips(prev => prev.filter(t => t.id !== requestTrip.id));
      setSuccessMsg('Your offer has been sent! The traveller will be notified by email. They must confirm before contact details are shared.');
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong. Please try again.');
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-brand-900">People Who May Need Help on Your Flight</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-lg text-green-800">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-lg text-red-700">
          ⚠️ {error}
        </div>
      )}

      {!myVolunteerTrip && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-lg text-yellow-800 space-y-3">
          <p className="font-semibold">You need to post a volunteer trip first.</p>
          <p>Tell us your flight details so we can show you travellers on the same route.</p>
          <a href="/volunteer" className="inline-block bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700">
            🤝 Post a volunteer trip
          </a>
        </div>
      )}

      {loading && <p className="text-gray-700 text-lg">Looking for matching requests...</p>}

      {matchingTrips.length === 0 && !loading && myVolunteerTrip && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center space-y-3">
          <p className="text-lg text-gray-700">No travellers need help on your route right now.</p>
          <p className="text-base text-gray-600">Check back later — new requests are posted daily.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {matchingTrips.map(trip => (
          <TripCard
            key={trip.id}
            trip={trip}
            onAction={myVolunteerTrip ? () => handleHelp(trip) : undefined}
            actionLabel="🤝 Offer to help this traveller"
          />
        ))}
      </div>
    </div>
  );
}
