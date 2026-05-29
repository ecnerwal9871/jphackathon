import type { Trip } from '@/lib/types';
import { clsx } from 'clsx';

interface Props {
  trip: Trip;
  onAction?: () => void;
  actionLabel?: string;
}

const statusConfig: Record<string, { bg: string; label: string }> = {
  open: { bg: 'bg-green-100 text-green-800', label: '🟢 Looking for a match' },
  matched: { bg: 'bg-yellow-100 text-yellow-800', label: '🟡 Match found — waiting for confirmation' },
  closed: { bg: 'bg-gray-100 text-gray-600', label: '✅ Completed' },
};

export default function TripCard({ trip, onAction, actionLabel }: Props) {
  const status = statusConfig[trip.status] || statusConfig.open;

  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-4 border border-gray-200">
      <div className="flex items-start justify-between gap-3">
        <div className="text-2xl font-bold text-brand-800">
          ✈️ {trip.fromAirport} → {trip.toAirport}
        </div>
        <span className={clsx('text-base font-semibold px-3 py-1 rounded-full whitespace-nowrap', status.bg)}>
          {status.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-lg text-gray-800">
          <span className="font-semibold">Date:</span> {trip.travelDate}
        </div>
        <div className="text-lg text-gray-800">
          <span className="font-semibold">Airline:</span> {trip.airline}
        </div>
        {trip.flightNumber && (
          <div className="text-lg text-gray-800">
            <span className="font-semibold">Flight:</span> {trip.flightNumber}
          </div>
        )}
        <div className="text-lg text-gray-800">
          <span className="font-semibold">Language:</span> {trip.language}
        </div>
      </div>

      {trip.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-base text-gray-700">
          📝 {trip.notes}
        </div>
      )}

      <div className="text-base text-gray-600">
        Posted by {trip.userName} · {new Date(trip.createdAt).toLocaleDateString()}
      </div>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl text-lg transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
