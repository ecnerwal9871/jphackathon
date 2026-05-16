import { CosmosClient, Database } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

const endpoint = process.env.COSMOS_ENDPOINT;
const databaseId = 'flightbuddy';

let _db: Database | null = null;

export function getDatabase(): Database {
  if (!endpoint) {
    throw new Error('COSMOS_ENDPOINT is not configured. Set it in local.settings.json (local) or SWA app settings (Azure).');
  }
  if (!_db) {
    const credential = new DefaultAzureCredential();
    const client = new CosmosClient({ endpoint, aadCredentials: credential });
    _db = client.database(databaseId);
  }
  return _db;
}

export const containers = {
  users: () => getDatabase().container('users'),
  trips: () => getDatabase().container('trips'),
  matches: () => getDatabase().container('matches'),
};
