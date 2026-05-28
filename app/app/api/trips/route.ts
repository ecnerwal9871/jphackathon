import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import type { Trip } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { resources } = await containers.trips().items.query<Trip>({
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: caller.userId }],
    }).fetchAll();

    const safe = resources.map(({ contactNumber: _cn, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as Partial<Trip>;
  let userName = caller.userDetails.split('@')[0];
  try {
    const { resource: user } = await containers.users().item(caller.userId, caller.userId).read<{ name?: string }>();
    if (user?.name) userName = user.name;
  } catch { /* user not yet created */ }

  const travelDate = body.travelDate!;
  const expiresDate = new Date(travelDate);
  expiresDate.setDate(expiresDate.getDate() + 30);

  const trip: Trip = {
    id: uuidv4(),
    userId: caller.userId,
    userName,
    type: body.type!,
    fromAirport: body.fromAirport!.toUpperCase(),
    toAirport: body.toAirport!.toUpperCase(),
    travelDate,
    airline: body.airline!.toLowerCase(),
    flightNumber: body.flightNumber,
    contactNumber: body.contactNumber!,
    language: body.language!,
    notes: body.notes,
    status: 'open',
    expiresAt: expiresDate.toISOString(),
    createdAt: new Date().toISOString(),
  };

  await containers.trips().items.create(trip);
    const { contactNumber: _cn, ...safeTrip } = trip;
    return NextResponse.json(safeTrip, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
