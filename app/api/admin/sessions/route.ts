import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE,
  CSRF_COOKIE,
  listSessions,
  revokeOtherSessions,
  revokeSessionById,
  revokeSessionByToken,
} from '@/backend/lib/admin-auth';
import { env } from '@/backend/lib/env';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import { fieldErrors, revokeSessionSchema } from '@/backend/lib/validation';
import { fail, handleRouteError, ok, readJson } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sessions
 *
 * Admin only. Lists this account's live sessions so "Active sessions" in Admin
 * Settings reflects real server-side state rather than local browser state.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    const sessions = await listSessions(guard.auth.admin.id, guard.auth.sessionId);
    return ok({ sessions, currentSessionId: guard.auth.sessionId });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/sessions');
  }
}

/**
 * DELETE /api/admin/sessions
 *
 * Body: `{ id }` revokes one session, `{ others: true }` revokes every session
 * except the caller's, `{ all: true }` revokes everything including the caller's
 * (which then clears the cookies).
 *
 * Admin only + CSRF. A session id belonging to a different account is rejected
 * rather than silently ignored, so the endpoint cannot be used to probe ids.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    const parsed = revokeSessionSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return fail('Invalid request.', 422, fieldErrors(parsed.error));
    }

    const { id, others, all } = parsed.data;
    const currentToken = cookies().get(SESSION_COOKIE)?.value ?? null;

    if (all) {
      // `revokeOtherSessions` clears every session for this account *except* the
      // one presented on this request, and the caller's own token is then revoked
      // by token. This branch used to revoke only that token and still answer
      // "All sessions signed out", so an administrator who used it to end a
      // session on a lost device left that device signed in and usable - the
      // response claimed a result the database never reflected.
      await revokeOtherSessions(guard.auth.admin.id, currentToken);
      await revokeSessionByToken(currentToken, 'revoke-all');
      return clearSessionCookies(ok(null, { message: 'All sessions signed out.' }));
    }

    if (others) {
      const removed = await revokeOtherSessions(guard.auth.admin.id, currentToken);
      return ok({ removed }, { message: `${removed} other session${removed === 1 ? '' : 's'} signed out.` });
    }

    if (id) {
      if (id === guard.auth.sessionId) {
        await revokeSessionById(guard.auth.admin.id, id);
        return clearSessionCookies(ok(null, { message: 'This session was signed out.' }));
      }

      const removed = await revokeSessionById(guard.auth.admin.id, id);
      if (removed === 0) return fail('Session not found.', 404);
      return ok({ removed }, { message: 'Session revoked.' });
    }

    return fail('Provide either a session id, `others`, or `all`.', 400);
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/sessions');
  }
}

/**
 * Cookie deletion has to happen on the response. `cookies()` from `next/headers`
 * is read-only inside a Route Handler, so writing to it here threw and the browser
 * kept the old cookies even though the session records were correctly revoked.
 */
function clearSessionCookies<T extends NextResponse>(response: T): T {
  // Repeat the attributes used at sign-in, or the browser treats this as a
  // different cookie and leaves the original behind.
  const expiry = { httpOnly: false, secure: env.isProd, sameSite: 'lax' as const, path: '/', maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, '', { ...expiry, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, '', expiry);
  return response;
}