import { NextRequest, NextResponse } from 'next/server';
import { adminCredentials, createAdminToken } from '@/lib/admin-auth';
import {
  createSession,
  getLockoutState,
  registerFailedAttempt,
  resetFailedAttempts,
  sessionTtlMs,
  verifyPin,
} from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const credentials = adminCredentials();

  // A lockout is checked before the PIN so a locked account cannot be probed.
  const lockout = await getLockoutState();
  if (lockout.lockedUntil) {
    const minutes = Math.max(
      1,
      Math.ceil((new Date(lockout.lockedUntil).getTime() - Date.now()) / 60_000),
    );
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      },
      { status: 429 },
    );
  }

  if (!(await verifyPin(body.password))) {
    const attempt = await registerFailedAttempt();
    if (attempt.lockedUntil) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. This account is temporarily locked.' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: `Invalid admin credentials. ${attempt.remainingAttempts} attempt${
          attempt.remainingAttempts === 1 ? '' : 's'
        } remaining.`,
      },
      { status: 401 },
    );
  }

  await resetFailedAttempts();

  const token = createAdminToken(credentials.username, sessionTtlMs(lockout.autoLogoutMinutes));
  await createSession(token, request.headers.get('user-agent') || 'Unknown device');

  const response = NextResponse.json({ success: true, token });
  response.cookies.set('kaiyo-admin-token', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionTtlMs(lockout.autoLogoutMinutes) / 1000,
  });
  return response;
}