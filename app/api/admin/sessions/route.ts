import { NextRequest, NextResponse } from 'next/server';
import { requestHasAdminAuth } from '@/lib/admin-auth';
import { currentSessionId, listSessions, revokeSessions } from '@/lib/admin-security';

export async function GET(request: NextRequest) {
  if (!requestHasAdminAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = request.cookies.get('kaiyo-admin-token')?.value ?? null;
  return NextResponse.json({
    success: true,
    data: { sessions: await listSessions(), currentSessionId: await currentSessionId(token) },
  });
}

/** Revokes one session (`{ id }`) or every session except the caller's own (`{ others: true }`). */
export async function DELETE(request: NextRequest) {
  if (!requestHasAdminAuth(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = request.cookies.get('kaiyo-admin-token')?.value ?? null;
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : undefined;
  const others = Boolean(body?.others);

  if (others && id) {
    return NextResponse.json(
      { success: false, error: 'Provide either a session id or `others`' },
      { status: 400 },
    );
  }

  const currentId = await currentSessionId(token);
  const removed = await revokeSessions({ id, exceptToken: others ? token : null });

  // Revoking the caller's own session must end it immediately.
  if (id && id === currentId) {
    const response = NextResponse.json({
      success: true,
      removed,
      message: 'This session was signed out.',
    });
    response.cookies.set('kaiyo-admin-token', '', { path: '/', maxAge: 0 });
    return response;
  }

  return NextResponse.json({
    success: true,
    removed,
    message: others ? 'All other sessions signed out.' : 'Session revoked.',
  });
}