import { CosmosClient, Database } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = 'flightbuddy';

let _db: Database | null = null;

export function getDatabase(): Database {
  if (!endpoint) {
    throw new Error('COSMOS_ENDPOINT is not configured.');
  }
  if (!key) {
    throw new Error('COSMOS_KEY is not configured.');
  }
  if (!_db) {
    const client = new CosmosClient({ endpoint, key });
    _db = client.database(databaseId);
  }
  return _db;
}

export const containers = {
  users: () => getDatabase().container('users'),
  trips: () => getDatabase().container('trips'),
  matches: () => getDatabase().container('matches'),
};
