import type { Trip } from '@/lib/types';
import { clsx } from 'clsx';

interface Props {
  trip: Trip;
  onAction?: () => void;
  actionLabel?: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  matched: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-600',
};

export default function TripCard({ trip, onAction, actionLabel }: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-3 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-brand-800">
          {trip.fromAirport} to {trip.toAirport}
        </div>
        <span className={clsx('text-sm font-semibold px-3 py-1 rounded-full', statusColors[trip.status])}>
          {trip.status.toUpperCase()}
        </span>
      </div>
      <div className="text-lg text-gray-700 space-y-1">
        <div>{trip.travelDate} | {trip.airline}</div>
        {trip.flightNumber && <div>Flight: {trip.flightNumber}</div>}
        <div>Language: <span className="font-semibold">{trip.language}</span></div>
        {trip.notes && <div>{trip.notes}</div>}
        <div className="text-sm text-gray-500">
          Posted by {trip.userName} | {new Date(trip.createdAt).toLocaleDateString()}
        </div>
      </div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-lg transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
