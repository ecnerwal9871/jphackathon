import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import { sendMatchNotification } from '@/lib/email-server';
import type { Match, Trip } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { requestTripId, volunteerTripId } = await req.json() as { requestTripId: string; volunteerTripId: string };

  const { resources: trips } = await containers.trips().items.query<Trip>({
    query: 'SELECT * FROM c WHERE c.id = @reqId OR c.id = @volId',
    parameters: [{ name: '@reqId', value: requestTripId }, { name: '@volId', value: volunteerTripId }],
  }).fetchAll();

  const reqTrip = trips.find(t => t.id === requestTripId);
  const volTrip = trips.find(t => t.id === volunteerTripId);
  if (!reqTrip || !volTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  if (reqTrip.status !== 'open' || volTrip.status !== 'open') {
    return NextResponse.json({ error: 'Trip is not open' }, { status: 400 });
  }

  let requesterEmail = '', volunteerEmail = '';
  let requesterName = reqTrip.userName, volunteerName = volTrip.userName;
  try {
    const [{ resource: requester }, { resource: volunteer }] = await Promise.all([
      containers.users().item(reqTrip.userId, reqTrip.userId).read<{ name?: string; email?: string }>(),
      containers.users().item(volTrip.userId, volTrip.userId).read<{ name?: string; email?: string }>(),
    ]);
    if (requester?.name) requesterName = requester.name;
    if (volunteer?.name) volunteerName = volunteer.name;
    requesterEmail = requester?.email || '';
    volunteerEmail = volunteer?.email || '';
  } catch { /* proceed without user details */ }

  const match: Match = {
    id: uuidv4(),
    requestTripId,
    volunteerTripId,
    requesterId: reqTrip.userId,
    volunteerId: volTrip.userId,
    requesterName,
    volunteerName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await containers.matches().items.create(match);
  sendMatchNotification(requesterEmail, volunteerEmail, match.id).catch(console.error);

  return NextResponse.json(match, { status: 201 });
}
