export type TripType = 'request' | 'volunteer';
export type TripStatus = 'open' | 'matched' | 'closed';
export type MatchStatus = 'pending' | 'confirmed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  userId: string;
  userName: string;
  type: TripType;
  fromAirport: string;
  toAirport: string;
  travelDate: string;
  airline: string;
  flightNumber?: string;
  contactNumber?: string;
  language: string;
  notes?: string;
  status: TripStatus;
  matchedTripId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Match {
  id: string;
  requestTripId: string;
  volunteerTripId: string;
  requesterId: string;
  volunteerId: string;
  requesterName: string;
  volunteerName: string;
  status: MatchStatus;
  createdAt: string;
}

export interface SwaUser {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}
