import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import type { Match, Trip } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resources } = await containers.matches().items.query<Match>({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: params.id }],
  }).fetchAll();

  const match = resources[0];
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (match.requesterId !== caller.userId && match.volunteerId !== caller.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result: Record<string, unknown> = { ...match };

  if (match.status === 'confirmed') {
    const [{ resources: [reqTrip] }, { resources: [volTrip] }] = await Promise.all([
      containers.trips().items.query<Trip>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: match.requestTripId }],
      }).fetchAll(),
      containers.trips().items.query<Trip>({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: match.volunteerTripId }],
      }).fetchAll(),
    ]);
    result['requesterContact'] = reqTrip?.contactNumber;
    result['volunteerContact'] = volTrip?.contactNumber;
  }

  return NextResponse.json(result);
}
