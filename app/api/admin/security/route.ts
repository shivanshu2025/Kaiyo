import { NextRequest, NextResponse } from 'next/server';
import { requestHasAdminAuth } from '@/lib/admin-auth';
import {
  currentSessionId,
  listSessions,
  pinWasChanged,
  readAdminSecurity,
  updateSecuritySettings,
} from '@/lib/admin-security';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!requestHasAdminAuth(request)) return unauthorized();

  const token = request.cookies.get('kaiyo-admin-token')?.value ?? null;
  const [settings, sessions, pinUpdated] = await Promise.all([
    readAdminSecurity(),
    listSessions(),
    pinWasChanged(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      maxFailedAttempts: settings.maxFailedAttempts,
      lockoutMinutes: settings.lockoutMinutes,
      autoLogoutMinutes: settings.autoLogoutMinutes,
      failedAttempts: settings.login.failedAttempts,
      lockedUntil:
        settings.login.lockedUntil &&
        new Date(settings.login.lockedUntil).getTime() > Date.now()
          ? settings.login.lockedUntil
          : null,
      pinUpdatedAt: settings.pin?.updatedAt ?? null,
      pinChanged: pinUpdated,
      currentSessionId: await currentSessionId(token),
      sessions,
    },
  });
}

export async function PUT(request: NextRequest) {
  if (!requestHasAdminAuth(request)) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }

  const settings = await updateSecuritySettings(body as Record<string, unknown>);
  return NextResponse.json({
    success: true,
    data: {
      maxFailedAttempts: settings.maxFailedAttempts,
      lockoutMinutes: settings.lockoutMinutes,
      autoLogoutMinutes: settings.autoLogoutMinutes,
    },
    message: 'Security settings saved.',
  });
}