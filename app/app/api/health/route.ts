import { NextRequest, NextResponse } from 'next/server';
import { getCallerIdentity } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  const checks: Record<string, unknown> = {};

  // 1. Check auth
  const caller = getCallerIdentity(req);
  checks.auth = caller
    ? { ok: true, userId: caller.userId, email: caller.userDetails }
    : { ok: false, reason: 'No x-ms-client-principal header' };

  // 2. Check env vars
  checks.env = {
    COSMOS_ENDPOINT: process.env.COSMOS_ENDPOINT ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
    IDENTITY_ENDPOINT: process.env.IDENTITY_ENDPOINT ? 'SET' : 'MISSING',
    IDENTITY_HEADER: process.env.IDENTITY_HEADER ? 'SET' : 'MISSING',
    MSI_ENDPOINT: process.env.MSI_ENDPOINT ? 'SET' : 'MISSING',
    MSI_SECRET: process.env.MSI_SECRET ? 'SET' : 'MISSING',
  };

  // 3. Try Cosmos DB connection
  try {
    const { containers } = await import('@/lib/cosmos-server');
    const { resources } = await containers.trips().items.query({
      query: 'SELECT TOP 1 c.id FROM c',
    }).fetchAll();
    checks.cosmosDb = { ok: true, sampleCount: resources.length };
  } catch (e) {
    checks.cosmosDb = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split('\n').slice(0, 5) : undefined,
    };
  }

  return NextResponse.json(checks, { status: 200 });
}
