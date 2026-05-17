import { NextRequest, NextResponse } from 'next/server';
import { containers } from '@/lib/cosmos-server';
import { getCallerIdentity } from '@/lib/auth-server';
import type { User } from '@/lib/types';

export async function GET(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { resource } = await containers.users().item(caller.userId, caller.userId).read<User>();
    if (!resource) {
      const newUser: User = {
        id: caller.userId,
        name: caller.userDetails.split('@')[0],
        email: caller.userDetails,
        phone: '',
        preferredLanguage: 'English',
        createdAt: new Date().toISOString(),
      };
      await containers.users().items.create(newUser);
      return NextResponse.json(newUser);
    }
    return NextResponse.json(resource);
  } catch {
    return NextResponse.json({ error: 'Error reading profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const caller = getCallerIdentity(req);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json() as Partial<User>;
    const { resource: existing } = await containers.users().item(caller.userId, caller.userId).read<User>();
    const updated: User = { ...existing!, ...body, id: caller.userId, email: caller.userDetails };
    await containers.users().items.upsert(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
  }
}
