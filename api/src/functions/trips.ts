import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../lib/cosmos';
import { getCallerIdentity } from '../lib/auth';
import type { Trip } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

async function tripsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  void context;
  const caller = getCallerIdentity(req);
  if (!caller) return { status: 401, body: 'Unauthorized' };

  const tripsContainer = containers.trips();
  const usersContainer = containers.users();

  if (req.method === 'GET') {
    const query = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: caller.userId }],
    };
    const { resources } = await tripsContainer.items.query<Trip>(query).fetchAll();
    const safeTrips = resources.map(({ contactNumber: _cn, ...rest }) => rest);
    return { status: 200, jsonBody: safeTrips };
  }

  if (req.method === 'POST') {
    const body = await req.json() as Partial<Trip>;
    const { resource: user } = await usersContainer.item(caller.userId, caller.userId).read();
    const travelDate = body.travelDate!;
    const expiresDate = new Date(travelDate);
    expiresDate.setDate(expiresDate.getDate() + 30);

    const trip: Trip = {
      id: uuidv4(),
      userId: caller.userId,
      userName: (user as { name?: string } | undefined)?.name || caller.userDetails,
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

    await tripsContainer.items.create(trip);
    const { contactNumber: _cn, ...safeTrip } = trip;
    return { status: 201, jsonBody: safeTrip };
  }

  return { status: 405, body: 'Method not allowed' };
}

app.http('trips', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'trips',
  handler: tripsHandler,
});
