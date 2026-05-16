import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initTelemetry } from '../lib/telemetry';
import { containers } from '../lib/cosmos';
import { getCallerIdentity } from '../lib/auth';
import { sendMatchConfirmedNotification } from '../lib/email';
import type { Match, Trip } from '../lib/types';

initTelemetry();

async function matchesByIdHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const caller = getCallerIdentity(req);
  if (!caller) return { status: 401, body: 'Unauthorized' };

  const matchId = req.params['id'];
  const matchesContainer = containers.matches();

  const query = {
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: matchId }],
  };
  const { resources } = await matchesContainer.items.query<Match>(query).fetchAll();
  const match = resources[0];
  if (!match) return { status: 404, body: 'Match not found' };

  if (match.requesterId !== caller.userId && match.volunteerId !== caller.userId) {
    return { status: 403, body: 'Forbidden' };
  }

  if (req.method === 'GET') {
    const result: Record<string, unknown> = { ...match };

    if (match.status === 'confirmed') {
      const tripsContainer = containers.trips();
      const reqQuery = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: match.requestTripId }],
      };
      const volQuery = {
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: match.volunteerTripId }],
      };
      const [{ resources: [reqTrip] }, { resources: [volTrip] }] = await Promise.all([
        tripsContainer.items.query<Trip>(reqQuery).fetchAll(),
        tripsContainer.items.query<Trip>(volQuery).fetchAll(),
      ]);
      result['requesterContact'] = reqTrip?.contactNumber;
      result['volunteerContact'] = volTrip?.contactNumber;
    }

    return { status: 200, jsonBody: result };
  }

  if (req.method === 'PUT') {
    const isConfirm = req.url.includes('/confirm');
    if (!isConfirm) return { status: 400, body: 'Use /confirm to confirm a match' };
    if (match.requesterId !== caller.userId) return { status: 403, body: 'Only the traveller can confirm' };
    if (match.status !== 'pending') return { status: 400, body: 'Match is not pending' };

    const updated: Match = { ...match, status: 'confirmed' };
    await matchesContainer.items.upsert(updated);

    const usersContainer = containers.users();
    const [{ resource: requesterUser }, { resource: volunteerUser }] = await Promise.all([
      usersContainer.item(match.requesterId, match.requesterId).read(),
      usersContainer.item(match.volunteerId, match.volunteerId).read(),
    ]);
    sendMatchConfirmedNotification(
      (requesterUser as { email?: string } | undefined)?.email || '',
      (volunteerUser as { email?: string } | undefined)?.email || '',
      match.id
    ).catch(context.error);

    return { status: 200, jsonBody: updated };
  }

  return { status: 405, body: 'Method not allowed' };
}

app.http('matchesById', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'matches/{id}/{action?}',
  handler: matchesByIdHandler,
});
