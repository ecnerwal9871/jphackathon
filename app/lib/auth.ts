import { SwaUser } from './types';

export async function getCurrentUser(): Promise<SwaUser | null> {
  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.clientPrincipal) return null;
    return data.clientPrincipal as SwaUser;
  } catch {
    return null;
  }
}

export function getLoginUrl(): string {
  return '/.auth/login/google';
}

export function getLogoutUrl(): string {
  return '/.auth/logout';
}
