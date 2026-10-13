import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CSRF_COOKIE, SESSION_COOKIE, revokeSessionByToken } from '@/backend/lib/admin-auth';
import { env } from '@/backend/lib/env';
import { verifyCsrf } from '@/backend/lib/guards';
import { fail, handleRouteError, ok } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/logout
 *
 * Revokes the session record server-side *and* clears both cookies. Revocation is
 * the important half: even a copy of the token taken before logout stops working
 * immediately, because the `AdminSession` document is what the gate trusts.
 *
 * Requires a valid CSRF header so a third-party page cannot sign a user out.
 * Idempotent - calling it without a session still returns 200.
 */
export async function POST(request: NextRequest) {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value ?? null;

    // Genuinely idempotent, as documented: with no session there is nothing to
    // revoke, so this clears the cookies and reports success. `verifyCsrf` requires
    // a session cookie to compute the HMAC and would otherwise reject a caller that
    // has already been signed out - turning "already signed out" into a 403.
    if (!token) {
      return clearAndRespond(ok(null, { message: 'Already signed out.' }));
    }

    if (!verifyCsrf(request)) {
      // Without a CSRF token we still clear the cookies but do not touch the
      // session record, so an attacker cannot destroy a victim's session.
      return clearAndRespond(
        fail('Security token missing or invalid. Sign in again.', 403),
      );
    }

    await revokeSessionByToken(token, 'logout');
    return clearAndRespond(ok(null, { message: 'Signed out.' }));
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/logout');
  }
}

/**
 * Expiring a cookie requires writing to the *response*, not to the request jar.
 * `cookies()` from `next/headers` is read-only inside a Route Handler, so the
 * original implementation threw before the response was ever sent and the browser
 * kept both cookies. `login` and `pin` already set cookies this way; this route
 * now matches them.
 */
function clearAndRespond(response: NextResponse) {
  // Deletion must repeat the attributes used when the cookie was set, otherwise a
  // browser may treat it as a different cookie and leave the original in place.
  const expiry = { httpOnly: false, secure: env.isProd, sameSite: 'lax' as const, path: '/', maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, '', { ...expiry, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, '', expiry);

  return response;
}
