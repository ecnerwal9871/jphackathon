import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../lib/cosmos';
import { getCallerIdentity } from '../lib/auth';
import { sendMatchNotification } from '../lib/email';
import type { Match, Trip } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

async function matchesHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const caller = getCallerIdentity(req);
  if (!caller) return { status: 401, body: 'Unauthorized' };

  if (req.method === 'POST') {
    const { requestTripId, volunteerTripId } = await req.json() as { requestTripId: string; volunteerTripId: string };

    const tripsContainer = containers.trips();
    const matchesContainer = containers.matches();
    const usersContainer = containers.users();

    const tripsQuery = {
      query: 'SELECT * FROM c WHERE c.id = @reqId OR c.id = @volId',
      parameters: [{ name: '@reqId', value: requestTripId }, { name: '@volId', value: volunteerTripId }],
    };
    const { resources: trips } = await tripsContainer.items.query<Trip>(tripsQuery).fetchAll();
    const reqTrip = trips.find(t => t.id === requestTripId);
    const volTrip = trips.find(t => t.id === volunteerTripId);

    if (!reqTrip || !volTrip) return { status: 404, body: 'Trip not found' };
    if (reqTrip.status !== 'open' || volTrip.status !== 'open') return { status: 400, body: 'Trip is not open' };

    const { resource: requester } = await usersContainer.item(reqTrip.userId, reqTrip.userId).read();
    const { resource: volunteer } = await usersContainer.item(volTrip.userId, volTrip.userId).read();

    const match: Match = {
      id: uuidv4(),
      requestTripId,
      volunteerTripId,
      requesterId: reqTrip.userId,
      volunteerId: volTrip.userId,
      requesterName: (requester as { name?: string } | undefined)?.name || reqTrip.userName,
      volunteerName: (volunteer as { name?: string } | undefined)?.name || volTrip.userName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await matchesContainer.items.create(match);

    sendMatchNotification(
      (requester as { email?: string } | undefined)?.email || '',
      (volunteer as { email?: string } | undefined)?.email || '',
      match.id
    ).catch(context.error);

    return { status: 201, jsonBody: match };
  }

  return { status: 405, body: 'Method not allowed' };
}

app.http('matches', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'matches',
  handler: matchesHandler,
});
