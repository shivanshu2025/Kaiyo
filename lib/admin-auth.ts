import crypto from 'crypto';
import { NextRequest } from 'next/server';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function secret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'kaiyo-local-admin-secret';
}

export function adminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin12345',
  };
}

function sign(payload: string) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createAdminToken(username: string) {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  const exp = Number(parts[1]);
  return expected === parts[2] && Number.isFinite(exp) && exp > Date.now();
}

export function requestHasAdminAuth(request: NextRequest) {
  const header = request.headers.get('authorization');
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const cookie = request.cookies.get('kaiyo-admin-token')?.value;
  return verifyAdminToken(bearer || cookie);
}
