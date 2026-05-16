import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../lib/cosmos';
import { getCallerIdentity } from '../lib/auth';
import type { User } from '../lib/types';

async function profileHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  void context;
  const caller = getCallerIdentity(req);
  if (!caller) return { status: 401, body: 'Unauthorized' };

  const usersContainer = containers.users();

  if (req.method === 'GET') {
    try {
      const { resource } = await usersContainer.item(caller.userId, caller.userId).read<User>();
      if (!resource) {
        const newUser: User = {
          id: caller.userId,
          name: caller.userDetails.split('@')[0],
          email: caller.userDetails,
          phone: '',
          preferredLanguage: 'English',
          createdAt: new Date().toISOString(),
        };
        await usersContainer.items.create(newUser);
        return { status: 200, jsonBody: newUser };
      }
      return { status: 200, jsonBody: resource };
    } catch {
      return { status: 500, body: 'Error reading profile' };
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = await req.json() as Partial<User>;
      const { resource: existing } = await usersContainer.item(caller.userId, caller.userId).read<User>();
      const updated: User = { ...existing!, ...body, id: caller.userId, email: caller.userDetails };
      await usersContainer.items.upsert(updated);
      return { status: 200, jsonBody: updated };
    } catch {
      return { status: 500, body: 'Error updating profile' };
    }
  }

  return { status: 405, body: 'Method not allowed' };
}

app.http('profile', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: profileHandler,
});
