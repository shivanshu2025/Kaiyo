import { NextRequest, NextResponse } from 'next/server';
import { adminCredentials, createAdminToken } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const credentials = adminCredentials();

  if (body.username !== credentials.username || body.password !== credentials.password) {
    return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
  }

  const token = createAdminToken(credentials.username);
  const response = NextResponse.json({ success: true, token });
  response.cookies.set('kaiyo-admin-token', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
