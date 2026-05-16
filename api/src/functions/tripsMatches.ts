import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { initTelemetry } from '../lib/telemetry';
import { containers } from '../lib/cosmos';
import { getCallerIdentity } from '../lib/auth';
import type { Trip } from '../lib/types';

initTelemetry();

async function tripsMatchesHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  void context;
  const caller = getCallerIdentity(req);
  if (!caller) return { status: 401, body: 'Unauthorized' };

  const tripsContainer = containers.trips();

  const myQuery = {
    query: "SELECT * FROM c WHERE c.userId = @userId AND c.type = 'volunteer' AND c.status = 'open'",
    parameters: [{ name: '@userId', value: caller.userId }],
  };
  const { resources: myVolunteerTrips } = await tripsContainer.items.query<Trip>(myQuery).fetchAll();
  if (myVolunteerTrips.length === 0) {
    return { status: 200, jsonBody: [] };
  }

  const vol = myVolunteerTrips[0];

  const date = new Date(vol.travelDate);
  const dayBefore = new Date(date); dayBefore.setDate(date.getDate() - 1);
  const dayAfter = new Date(date); dayAfter.setDate(date.getDate() + 1);

  const matchQuery = {
    query: `SELECT * FROM c 
      WHERE c.type = 'request' 
      AND c.status = 'open'
      AND c.fromAirport = @from
      AND c.toAirport = @to
      AND c.airline = @airline
      AND c.travelDate >= @dateFrom
      AND c.travelDate <= @dateTo
      AND c.userId != @myUserId`,
    parameters: [
      { name: '@from', value: vol.fromAirport },
      { name: '@to', value: vol.toAirport },
      { name: '@airline', value: vol.airline.toLowerCase() },
      { name: '@dateFrom', value: dayBefore.toISOString().slice(0, 10) },
      { name: '@dateTo', value: dayAfter.toISOString().slice(0, 10) },
      { name: '@myUserId', value: caller.userId },
    ],
  };

  const { resources } = await tripsContainer.items.query<Trip>(matchQuery).fetchAll();
  const safeTrips = resources.map(({ contactNumber: _cn, ...rest }) => rest);
  return { status: 200, jsonBody: safeTrips };
}

app.http('tripsMatches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'trips/matches',
  handler: tripsMatchesHandler,
});
