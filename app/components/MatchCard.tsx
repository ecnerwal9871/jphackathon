import type { Match } from '@/lib/types';
import Link from 'next/link';
import { clsx } from 'clsx';

interface Props {
  match: Match;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function MatchCard({ match }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-3 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-700">Match #{match.id.slice(0, 8)}</span>
        <span className={clsx('text-sm font-semibold px-3 py-1 rounded-full', statusColors[match.status])}>
          {match.status.toUpperCase()}
        </span>
      </div>
      <div className="text-gray-600 space-y-1">
        <div>Traveller: <span className="font-semibold">{match.requesterName}</span></div>
        <div>Volunteer: <span className="font-semibold">{match.volunteerName}</span></div>
        <div className="text-sm text-gray-400">{new Date(match.createdAt).toLocaleDateString()}</div>
      </div>
      <Link
        href={`/matches/${match.id}`}
        className="block text-center bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-lg transition"
      >
        View Details
      </Link>
    </div>
  );
}
