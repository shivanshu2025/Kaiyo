import { NextRequest, NextResponse } from 'next/server';
import { revokeSessionByToken } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  // Drop the server-side session record too, so this token cannot be replayed
  // even if it was copied before the cookie was cleared.
  const token = request.cookies.get('kaiyo-admin-token')?.value ?? null;
  await revokeSessionByToken(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set('kaiyo-admin-token', '', { path: '/', maxAge: 0 });
  return response;
}