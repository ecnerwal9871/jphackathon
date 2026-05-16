'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getMatch, confirmMatch } from '@/lib/api';
import type { Match } from '@/lib/types';
import Link from 'next/link';

interface MatchDetail extends Match {
  requesterContact?: string;
  volunteerContact?: string;
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMatch(id)
      .then(setMatch)
      .catch(() => setError('Failed to load match'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      const updated = await confirmMatch(id);
      setMatch(updated as MatchDetail);
    } catch {
      setError('Failed to confirm match');
    } finally {
      setConfirming(false);
    }
  }

  if (loading) return <div className="p-8 text-xl">Loading match details...</div>;
  if (error) return <div className="p-8 text-xl text-red-600">{error}</div>;
  if (!match) return <div className="p-8 text-xl">Match not found</div>;

  const statusColor = match.status === 'confirmed' ? 'text-green-600' : match.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600';

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <Link href="/dashboard" className="text-blue-600 text-lg hover:underline">&larr; Back to Dashboard</Link>
      <h1 className="text-4xl font-bold mt-6 mb-4">Match Details</h1>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4 border border-gray-200">
        <div>
          <span className="text-gray-500 text-lg">Status: </span>
          <span className={`font-bold text-xl uppercase ${statusColor}`}>{match.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-lg">
          <div>
            <p className="text-gray-500">Traveller</p>
            <p className="font-semibold text-xl">{match.requesterName}</p>
          </div>
          <div>
            <p className="text-gray-500">Volunteer</p>
            <p className="font-semibold text-xl">{match.volunteerName}</p>
          </div>
        </div>

        {match.status === 'confirmed' && (
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 space-y-3">
            <h2 className="text-2xl font-bold text-green-700">Contact Details</h2>
            {match.requesterContact && (
              <p className="text-xl">📱 Traveller: <span className="font-bold">{match.requesterContact}</span></p>
            )}
            {match.volunteerContact && (
              <p className="text-xl">📱 Volunteer: <span className="font-bold">{match.volunteerContact}</span></p>
            )}
          </div>
        )}

        {match.status === 'pending' && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-lg text-yellow-800 mb-4">
              A volunteer has offered to help! Confirm the match to exchange contact details.
            </p>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-3 px-8 rounded-xl disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : '✅ Confirm Match'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
