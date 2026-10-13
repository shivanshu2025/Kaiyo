import { NextRequest } from 'next/server';
import { db } from '@/backend/lib/db';
import { Admin } from '@/backend/models/Admin';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  csrfCookieOptions,
  csrfTokenFor,
  issueSession,
  revokeOtherSessions,
  sessionCookieOptions,
} from '@/backend/lib/admin-auth';
import { verifyPassword, hashPassword } from '@/backend/lib/password';
import { getSecuritySettings } from '@/backend/lib/security-settings';
import { requireAdminMutation } from '@/backend/lib/guards';
import { changePinSchema, fieldErrors } from '@/backend/lib/validation';
import { fail, handleRouteError, ok } from '@/backend/lib/api-response';
import { clientIp } from '@/backend/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/pin  (kept at its original path so the existing Admin Settings
 * screen keeps working)
 *
 * Body: `{ currentPin, newPin, confirmPin }`
 *
 * Guards:
 *  - requires an authenticated `admin` session plus a valid CSRF token,
 *  - re-verifies the *current* PIN against the stored bcrypt hash, so possession of
 *    a live session alone is not enough to take over the account,
 *  - stores only a new hash - the plaintext is never persisted or logged,
 *  - revokes every other session, then rotates the caller's own token so a token
 *    captured before the change cannot be replayed.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = changePinSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Some fields are invalid.', 422, fieldErrors(parsed.error));
    }

    const { currentPin, newPin } = parsed.data;

    await db();

    const admin = await Admin.findById(guard.auth.admin.id).select('passwordHash');
    if (!admin) return fail('Account not found.', 404);

    if (!(await verifyPassword(currentPin, admin.passwordHash))) {
      return fail('Current PIN is incorrect.', 403);
    }

    const passwordHash = await hashPassword(newPin);

    await Admin.updateOne(
      { _id: guard.auth.admin.id },
      {
        $set: {
          passwordHash,
          passwordUpdatedAt: new Date(),
          passwordChangedAt: new Date(),
          passwordChangedBy: guard.auth.admin.id,
        },
        // A new PIN also clears any active lockout from earlier failed attempts.
        $unset: { failedAttempts: 1, lockedUntil: 1, lastFailedAt: 1 },
      },
    );

    // Every existing session - including the caller's - is invalidated, then a
    // brand-new token is issued. A token captured before the change is therefore
    // useless, and the caller stays signed in without any token-reuse window.
    await revokeOtherSessions(guard.auth.admin.id, null);

    const { token, maxAgeSeconds } = await issueSession(
      guard.auth.admin.id,
      request.headers.get('user-agent') || 'Unknown device',
      clientIp(request),
      // The account's configured window, not the 60-minute default: `login` already
      // honours it, and using the default here meant that changing the Auto Logout
      // setting silently stopped applying after the next PIN change.
      (await getSecuritySettings(guard.auth.admin.id)).autoLogoutMinutes,
    );

    // The standard envelope. This route used to hand-roll `{ success, message }`
    // with no `data` key, so `adminFetch` resolved with `data === undefined` for
    // every other caller in the app.
    const response = ok(null, {
      message: 'Password updated. All other sessions have been signed out.',
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAgeSeconds));
    response.cookies.set(CSRF_COOKIE, csrfTokenFor(token), csrfCookieOptions(maxAgeSeconds));

    return response;
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/pin');
  }
}

export async function GET() {
  return fail('Use POST to change the admin password.', 405);
}