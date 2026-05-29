import { Trip, Match, User } from './types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `API error ${res.status}`);
  }
  return res.json();
}

export const createTrip = (data: Partial<Trip>) =>
  apiFetch<Trip>('/api/trips', { method: 'POST', body: JSON.stringify(data) });

export const getMyTrips = () => apiFetch<Trip[]>('/api/trips');

export const getMatchingTrips = async (): Promise<Trip[]> => {
  const data = await apiFetch<Trip[] | { debug: string; results: Trip[] }>('/api/trips/matches');
  if (Array.isArray(data)) return data;
  console.log('[FlightBuddy debug]', data.debug);
  return data.results;
};

export const createMatch = (requestTripId: string, volunteerTripId: string) =>
  apiFetch<Match>('/api/matches', {
    method: 'POST',
    body: JSON.stringify({ requestTripId, volunteerTripId }),
  });

export const confirmMatch = (matchId: string) =>
  apiFetch<Match>(`/api/matches/${matchId}/confirm`, { method: 'PUT' });

export const getMatch = (matchId: string) =>
  apiFetch<Match & { requesterContact?: string; volunteerContact?: string }>(
    `/api/matches/${matchId}`
  );

export const getProfile = () => apiFetch<User>('/api/profile');

export const updateProfile = (data: Partial<User>) =>
  apiFetch<User>('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
