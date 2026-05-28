import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import type { Trip } from '@/lib/types';

export async function GET(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { resources: myVolunteerTrips } = await containers.trips().items.query<Trip>({
    query: "SELECT * FROM c WHERE c.userId = @userId AND c.type = 'volunteer' AND c.status = 'open'",
    parameters: [{ name: '@userId', value: caller.userId }],
  }).fetchAll();

  if (myVolunteerTrips.length === 0) return NextResponse.json([]);

  const vol = myVolunteerTrips[0];
  const date = new Date(vol.travelDate);
  const dayBefore = new Date(date); dayBefore.setDate(date.getDate() - 1);
  const dayAfter = new Date(date); dayAfter.setDate(date.getDate() + 1);

  const { resources } = await containers.trips().items.query<Trip>({
    query: `SELECT * FROM c
      WHERE c.type = 'request' AND c.status = 'open'
      AND c.fromAirport = @from AND c.toAirport = @to AND c.airline = @airline
      AND c.travelDate >= @dateFrom AND c.travelDate <= @dateTo
      AND c.userId != @myUserId`,
    parameters: [
      { name: '@from', value: vol.fromAirport },
      { name: '@to', value: vol.toAirport },
      { name: '@airline', value: vol.airline.toLowerCase() },
      { name: '@dateFrom', value: dayBefore.toISOString().slice(0, 10) },
      { name: '@dateTo', value: dayAfter.toISOString().slice(0, 10) },
      { name: '@myUserId', value: caller.userId },
    ],
  }).fetchAll();

  const safe = resources.map(({ contactNumber: _cn, ...rest }) => rest);
  return NextResponse.json(safe);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
