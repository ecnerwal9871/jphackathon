import { HttpRequest } from '@azure/functions';

export interface CallerIdentity {
  userId: string;
  userDetails: string;
}

export function getCallerIdentity(req: HttpRequest): CallerIdentity | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    const principal = JSON.parse(decoded);
    return {
      userId: principal.userId,
      userDetails: principal.userDetails,
    };
  } catch {
    return null;
  }
}
