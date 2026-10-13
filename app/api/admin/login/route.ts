import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/backend/lib/db';
import { Admin } from '@/backend/models/Admin';
import { AdminSession } from '@/backend/models/AdminSession';
import {
  CSRF_COOKIE,
  DEFAULT_AUTO_LOGOUT_MINUTES,
  DEFAULT_LOCKOUT_MINUTES,
  DEFAULT_MAX_FAILED_ATTEMPTS,
  SESSION_COOKIE,
  csrfCookieOptions,
  csrfTokenFor,
  issueSession,
  sessionCookieOptions,
} from '@/backend/lib/admin-auth';
import { verifyPassword, needsRehash, hashPassword } from '@/backend/lib/password';
import {
  clientIp,
  consumeRateLimit,
  lockOutRateLimit,
  peekRateLimit,
  RATE_LIMITS,
  resetRateLimit,
} from '@/backend/lib/rate-limit';
import { fieldErrors, pinLoginSchema } from '@/backend/lib/validation';
import { created, fail, handleRouteError, tooManyRequests } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * A precomputed bcrypt hash of a value nobody will submit. Used to spend the same
 * CPU when the PIN cannot possibly match, so response time does not reveal whether
 * a particular account exists.
 */
const TIMING_DECOY_HASH = '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';

/**
 * POST /api/admin/login
 *
 * Body: `{ pin }`
 *
 * Sign-in is PIN-only. The PIN is compared with `bcrypt.compare` against the
 * stored hash in `Admin.passwordHash` (which is `select: false`, so the hash is
 * never attached to a response by accident). There is no username, so the PIN is
 * matched against every active administrator; `Admin.email` remains an identity
 * record for the account, not a login identifier.
 *
 * Defences, in order:
 *  1. Source lockout - a burst of wrong PINs from one client parks *that client*
 *     for `lockoutMinutes`.
 *  2. IP rate limit (10 attempts / 15 min) - stops distributed and serial brute force.
 *  3. bcrypt comparison against the stored hash - no plaintext, no default PIN, and
 *     the stored value is never returned.
 *  4. Session fixation defence - a brand-new opaque token is minted on every
 *     successful login.
 *
 * Every failure path returns the same generic message, so the response cannot be
 * used to enumerate accounts or to tell a wrong PIN from a locked one at a glance.
 *
 * Why the lockout is keyed on the request source and not on the account
 * ----------------------------------------------------------------------
 * Sign-in is PIN-only and there is no username, so a failure cannot be attributed
 * to any particular administrator. The previous implementation therefore wrote
 * `lockedUntil` to *every* active admin and refused all sign-ins while any of them
 * was locked. That made the lockout an unauthenticated denial-of-service primitive:
 * five guesses from an anonymous client locked out every administrator, and because
 * the lock lived on the account it could not be cleared from the login page - it
 * needed direct database access. A failed attempt now counts against the caller's
 * own source bucket only, so an anonymous attacker can lock *themselves* out and
 * nobody else. Brute-force resistance is unchanged in strength: the same
 * `maxFailedAttempts` guesses are allowed per source before the lockout fires, and
 * the hard rate limit still caps attempts regardless.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    // Checked BEFORE consuming the rate limit so an already-parked source is not
    // granted further guesses, and so `peekRateLimit` (read-only) does not extend
    // the window it is inspecting.
    const sourceLock = await peekRateLimit(ip, RATE_LIMITS.loginLockout.bucket);
    if (!sourceLock.allowed) {
      return tooManyRequests(
        'Too many failed attempts. This device is temporarily blocked from signing in.',
        sourceLock.retryAfterSeconds,
      );
    }

    const limit = await consumeRateLimit(ip, RATE_LIMITS.login);
    if (!limit.allowed) {
      return tooManyRequests(
        'Too many sign-in attempts. Please wait a few minutes and try again.',
        limit.retryAfterSeconds,
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = pinLoginSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Enter your PIN.', 422, fieldErrors(parsed.error));
    }

    const { pin } = parsed.data;

    await db();

    const activeAdmins = await Admin.find({ active: true }).select(
      'email name role passwordHash failedAttempts lockedUntil security',
    );

    if (activeAdmins.length === 0) {
      // Spend comparable CPU, then answer indistinguishably from a wrong PIN.
      await verifyPassword(pin, TIMING_DECOY_HASH);
      console.warn('[auth] sign-in attempted but no administrator account exists');
      return fail('Incorrect PIN.', 401);
    }

    // NOTE: there is deliberately no "is any account locked?" pre-check here. A
    // PIN-only failure cannot be attributed to one administrator, so honouring a
    // lockout stored on an account would let any anonymous caller decide whether
    // every administrator can sign in. The lockout lives on the caller's source
    // bucket instead (see the `login-lockout` check above).

    // Compare against every account, even after a match, so the amount of bcrypt
    // work does not depend on which account matched (or on how many exist).
    let matched: (typeof activeAdmins)[number] | null = null;
    for (const admin of activeAdmins) {
      const ok = await verifyPassword(pin, admin.passwordHash);
      if (ok && !matched) matched = admin;
    }

    if (!matched) {
      const settings = activeAdmins[0].security || {};
      const maxFailedAttempts = clampInt(settings?.maxFailedAttempts, 1, 50, DEFAULT_MAX_FAILED_ATTEMPTS);
      const lockoutMinutes = clampInt(settings?.lockoutMinutes, 1, 1440, DEFAULT_LOCKOUT_MINUTES);

      // The failure is counted against THIS client source, using the same
      // administrator-configured thresholds that previously drove the account
      // lockout. `allowed` goes false on attempt maxFailedAttempts + 1, at which
      // point only this source is parked - no Admin document is written to.
      const failures = await consumeRateLimit(ip, {
        bucket: RATE_LIMITS.loginFailure.bucket,
        limit: maxFailedAttempts,
        windowSeconds: lockoutMinutes * 60,
      });

      // `failedAttempts` is kept as a read-only diagnostic (the Admin Settings screen
      // displays it), but it no longer grants or withholds access.
      await Admin.updateMany(
        { _id: { $in: activeAdmins.map((admin) => admin._id) } },
        { $inc: { failedAttempts: 1 }, $set: { lastFailedAt: new Date() } },
      );

      if (!failures.allowed) {
        await lockOutRateLimit(ip, RATE_LIMITS.loginLockout.bucket, lockoutMinutes * 60);
        console.warn(`[auth] sign-in source locked for ${lockoutMinutes}m after repeated failures`);
        return tooManyRequests(
          `Too many failed attempts. This device is blocked for ${lockoutMinutes} minutes.`,
          lockoutMinutes * 60,
        );
      }

      return fail(
        `Incorrect PIN. ${failures.remaining} attempt${failures.remaining === 1 ? '' : 's'} remaining.`,
        401,
      );
    }

    // Success ------------------------------------------------------------------
    const settings = matched.security || {};

    await Admin.updateMany(
      { _id: { $in: activeAdmins.map((admin) => admin._id) } },
      { $set: { failedAttempts: 0, lockedUntil: null, lastFailedAt: null } },
    );
    await Admin.updateOne({ _id: matched._id }, { $set: { lastLoginAt: new Date() } });

    // Opportunistically upgrade a hash stored with an older cost factor.
    if (needsRehash(matched.passwordHash)) {
      const upgraded = await hashPassword(pin);
      await Admin.updateOne({ _id: matched._id }, { $set: { passwordHash: upgraded } });
    }

    const { token, maxAgeSeconds } = await issueSession(
      matched._id as string,
      request.headers.get('user-agent') || 'Unknown device',
      ip,
      clampInt(settings?.autoLogoutMinutes, 5, 720, DEFAULT_AUTO_LOGOUT_MINUTES),
    );

    // Clear every sign-in bucket for this source, so an administrator who proves
    // they know the PIN is not left throttled by an earlier run of wrong guesses.
    await resetRateLimit(ip, RATE_LIMITS.login.bucket);
    await resetRateLimit(ip, RATE_LIMITS.loginFailure.bucket);
    await resetRateLimit(ip, RATE_LIMITS.loginLockout.bucket);

    const response = created(
      { name: matched.name, role: matched.role, expiresIn: maxAgeSeconds },
      'Signed in.',
    );

    // HttpOnly: page scripts cannot read this value, so an XSS cannot exfiltrate it.
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAgeSeconds));
    response.cookies.set(
      CSRF_COOKIE,
      csrfTokenFor(token),
      csrfCookieOptions(maxAgeSeconds),
    );

    return response;
  } catch (error) {
    return handleRouteError(error, 'POST /api/admin/login');
  }
}

/**
 * Session state probe used by the dashboard to react to an expired session.
 *
 * This is an `/api/admin/*` endpoint, so it applies the same access-control policy
 * as every other one: the caller must hold a live session for an **active account
 * with the `admin` role**. It previously checked only `active`, which was the one
 * place in the admin surface where a lower-privilege `editor` still got a 200 - even
 * though such an account cannot load a single dashboard page or call a single admin
 * API. The dashboard treats a 401 here as "signed out" and shows the login form, which
 * is the correct outcome for an account that has no admin access to begin with.
 */
export async function GET() {
  try {
    await db();
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return fail('Not signed in.', 401);

    const session = await AdminSession.findOne({
      // The digest is recomputed server-side; the raw token is never queried.
      tokenHash: (await import('@/backend/lib/admin-auth')).hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .populate('adminId', 'name role active')
      .lean<{ adminId: { name: string; role: string; active: boolean } | null }>();

    if (!session?.adminId?.active) return fail('Not signed in.', 401);
    if (session.adminId.role !== 'admin') return fail('Not signed in.', 401);

    return NextResponse.json({
      success: true,
      data: { name: session.adminId.name, role: session.adminId.role },
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/login');
  }
}