import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import { sendMatchConfirmedNotification } from '@/lib/email-server';
import type { Match } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  void req;
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { resources } = await containers.matches().items.query<Match>({
    query: 'SELECT * FROM c WHERE c.id = @id',
    parameters: [{ name: '@id', value: params.id }],
  }).fetchAll();

  const match = resources[0];
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (match.requesterId !== caller.userId) {
    return NextResponse.json({ error: 'Only the traveller can confirm' }, { status: 403 });
  }
  if (match.status !== 'pending') {
    return NextResponse.json({ error: 'Match is not pending' }, { status: 400 });
  }

  const updated: Match = { ...match, status: 'confirmed' };
  await containers.matches().items.upsert(updated);

  let requesterEmail = '', volunteerEmail = '';
  try {
    const [{ resource: requester }, { resource: volunteer }] = await Promise.all([
      containers.users().item(match.requesterId, match.requesterId).read<{ email?: string }>(),
      containers.users().item(match.volunteerId, match.volunteerId).read<{ email?: string }>(),
    ]);
    requesterEmail = requester?.email || '';
    volunteerEmail = volunteer?.email || '';
  } catch { /* proceed without emails */ }

  sendMatchConfirmedNotification(requesterEmail, volunteerEmail, match.id).catch(console.error);

  return NextResponse.json(updated);
}
