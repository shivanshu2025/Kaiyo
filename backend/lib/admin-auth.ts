import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { Admin } from '@/backend/models/Admin';
import { AdminSession, MAX_SESSION_MS } from '@/backend/models/AdminSession';
import { env } from './env';
import { resolveSecuritySettings, type SecuritySettings } from './security-settings';

/**
 * Admin authentication.
 *
 * Design:
 *  - Credentials are verified against a bcrypt hash stored on the `Admin`
 *    document. There is no environment-variable password fallback and no default
 *    account, so a deployment with an unconfigured database is locked shut rather
 *    than open.
 *  - Login mints a 256-bit opaque token. Only its SHA-256 digest is persisted, so
 *    the database never contains a usable credential.
 *  - The cookie is `HttpOnly` (script on the page cannot read it), `Secure` in
 *    production, `SameSite=Lax`, and `Path=/`. The previous implementation set
 *    `httpOnly: false`, which exposed the token to any XSS.
 *  - The token is rotated on every privilege change (login and password change)
 *    and revoked server-side on logout, which prevents session fixation and makes
 *    revocation immediate rather than advisory.
 */

export const SESSION_COOKIE = 'kaiyo-admin-token';
export const CSRF_COOKIE = 'kaiyo-admin-csrf';
export const CSRF_HEADER = 'x-kaiyo-csrf';

/**
 * Fallback inactivity window, in minutes, for an account that has never changed
 * the setting. `resolveAuth` prefers the account's own `security.autoLogoutMinutes`
 * (see `resolveSecuritySettings`), so this is only the default value.
 */
export const DEFAULT_AUTO_LOGOUT_MINUTES = 60;

export const DEFAULT_MAX_FAILED_ATTEMPTS = 5;
export const DEFAULT_LOCKOUT_MINUTES = 15;

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type AuthContext = {
  admin: AdminIdentity;
  sessionId: string;
};

/* ------------------------------- tokens -------------------------------- */

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * The CSRF token is an HMAC of the session token under a server-only secret.
 * It changes whenever the session rotates and can never be derived from data the
 * browser already has, so a cross-site form post cannot supply a matching value.
 */
export function csrfTokenFor(sessionToken: string): string {
  const secret = env.csrfSecret;
  if (!secret) {
    if (env.isProd) throw new Error('CSRF_SECRET is not configured.');
    // Development-only fallback so `npm run dev` works before secrets are set.
    return crypto.createHmac('sha256', 'kaiyo-dev-csrf').update(sessionToken).digest('hex');
  }
  return crypto.createHmac('sha256', secret).update(sessionToken).digest('hex');
}

/** Constant-time string comparison that tolerates differing lengths. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    // Still perform a comparison so the timing does not reveal the length.
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

/* ------------------------------- cookies ------------------------------- */

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function csrfCookieOptions(maxAgeSeconds: number) {
  // Readable by the client so the dashboard can echo it in a header.
  return {
    httpOnly: false,
    secure: env.isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/* ------------------------------ sessions ------------------------------- */

export async function issueSession(
  adminId: string,
  userAgent: string,
  ip: string,
  ttlMinutes: number,
): Promise<{ token: string; sessionId: string; maxAgeSeconds: number }> {
  await db();

  const token = generateSessionToken();
  const maxAgeSeconds = Math.min(
    Math.floor(MAX_SESSION_MS / 1000),
    Math.max(60, Math.floor(ttlMinutes * 60)),
  );

  const now = new Date();
  const session = await AdminSession.create({
    adminId,
    tokenHash: hashToken(token),
    createdAtIp: ip.slice(0, 64),
    userAgent: (userAgent || 'Unknown device').slice(0, 200),
    lastSeenAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + maxAgeSeconds * 1000),
  });

  return { token, sessionId: session.id as string, maxAgeSeconds };
}

export type ResolveOptions = {
  /** Slide the inactivity window forward. Disabled for read-only checks. */
  touch?: boolean;
  /** Minutes of inactivity allowed before the session is considered expired. */
  idleMinutes?: number;
};

/**
 * Resolves the session cookie into an admin identity.
 *
 * Returns `null` for any missing, malformed, expired, revoked, or idle-timed-out
 * session. Callers treat `null` as "not authenticated" - there is no fallback
 * path that grants access.
 */
export async function resolveAuth(options: ResolveOptions = {}): Promise<AuthContext | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20) return null;

  await db();

  const session = await AdminSession.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    // The ref lives on `adminId`, so that is the populate path. `security` is
    // selected too: the account's own auto-logout window has to be known here or
    // the Admin Settings control would be cosmetic.
    .populate<{
      adminId: {
        _id: unknown;
        email: string;
        name: string;
        role: string;
        active: boolean;
        security?: Partial<SecuritySettings>;
      };
    }>('adminId', 'email name role active security')
    .lean<{
      _id: string;
      adminId: {
        _id: unknown;
        email: string;
        name: string;
        role: string;
        active: boolean;
        security?: Partial<SecuritySettings>;
      } | null;
      lastActivityAt: Date;
      expiresAt: Date;
    }>();

  if (!session?.adminId) return null;

  const admin = session.adminId;

  // A deactivated or deleted account loses access immediately, even with a live
  // session cookie.
  if (!admin.active) return null;

  // The account's configured inactivity window, not a hard-coded constant: this is
  // the authoritative side of the "Auto Logout" control in Admin Settings. The
  // client-side `AdminIdleGuard` only makes the sign-out prompt; this is the
  // boundary, so a caller who never runs that script still loses access on time.
  const idleMinutes =
    options.idleMinutes ?? resolveSecuritySettings(admin.security).autoLogoutMinutes;
  const idleDeadline = session.lastActivityAt.getTime() + idleMinutes * 60_000;
  if (Date.now() > idleDeadline) {
    await AdminSession.updateOne(
      { _id: session._id },
      { $set: { revokedAt: new Date(), revokedByIp: 'idle-timeout' } },
    );
    return null;
  }

  if (options.touch !== false) {
    const now = new Date();
    // Only write when the window has meaningfully moved, to avoid a DB write on
    // every asset request.
    const shouldTouch = now.getTime() - session.lastActivityAt.getTime() > 60_000;
    const patch: Record<string, Date> = {};
    if (shouldTouch) {
      patch.lastActivityAt = now;
      patch.lastSeenAt = now;
      if (idleMinutes > 0) {
        const remaining = Math.min(MAX_SESSION_MS, idleMinutes * 60_000);
        const expiresAt = new Date(now.getTime() + remaining);
        if (expiresAt > session.expiresAt) patch.expiresAt = expiresAt;
      }
    }
    if (Object.keys(patch).length > 0) {
      await AdminSession.updateOne({ _id: session._id }, { $set: patch });
    }
  }

  return {
    admin: {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
    sessionId: session._id,
  };
}

/* -------------------------- server-component gate ---------------------- */

/**
 * Authoritative guard for admin React Server Components. Redirects to the
 * existing login page when the session is absent, expired, or does not belong to
 * an account holding the `admin` role.
 *
 * The role check mirrors `requireAdmin` in `lib/guards.ts` deliberately. The API
 * guards are the true boundary, but a lower-privilege account must not be able to
 * render dashboard pages either - it would still expose the CMS editor chrome and
 * every server-rendered summary on them.
 */
export async function requireAdminPage(): Promise<AuthContext> {
  const context = await resolveAuth();
  if (!context || context.admin.role !== 'admin') redirect('/admin/login');
  return context;
}

/**
 * Resolves the session for an admin *read* without redirecting, and only for the
 * `admin` role. Returns `null` for an anonymous or lower-privilege caller so a
 * public endpoint can fall back to its public projection instead of 401-ing.
 */
export async function resolveAdminSession(): Promise<AuthContext | null> {
  const context = await resolveAuth({ touch: false });
  if (!context || context.admin.role !== 'admin') return null;
  return context;
}

/* ------------------------------ lockout -------------------------------- */

export type LockoutState = {
  locked: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
  remainingAttempts: number;
  lockoutMinutes: number;
  maxFailedAttempts: number;
};

export async function registerFailedAttempt(
  adminId: string,
  maxFailedAttempts = DEFAULT_MAX_FAILED_ATTEMPTS,
  lockoutMinutes = DEFAULT_LOCKOUT_MINUTES,
): Promise<LockoutState> {
  await db();

  const now = new Date();
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    {
      $inc: { failedAttempts: 1 },
      $set: { lastFailedAt: now },
    },
    { new: true },
  ).lean<{ failedAttempts: number; lockedUntil: Date | null }>();

  const failedAttempts = admin?.failedAttempts ?? maxFailedAttempts;
  const lockoutMs = lockoutMinutes * 60_000;
  let lockedUntil = admin?.lockedUntil ?? null;

  if (failedAttempts >= maxFailedAttempts) {
    lockedUntil = new Date(now.getTime() + lockoutMs);
    await Admin.updateOne({ _id: adminId }, { $set: { lockedUntil } });
  } else {
    lockedUntil = null;
  }

  return {
    locked: Boolean(lockedUntil),
    lockedUntil,
    failedAttempts,
    remainingAttempts: Math.max(0, maxFailedAttempts - failedAttempts),
    lockoutMinutes,
    maxFailedAttempts,
  };
}

export async function clearFailedAttempts(adminId: string): Promise<void> {
  await db();
  await Admin.updateOne(
    { _id: adminId },
    { $set: { failedAttempts: 0, lockedUntil: null, lastFailedAt: null, lastLoginAt: new Date() } },
  );
}

export function isLocked(admin: { failedAttempts?: number; lockedUntil?: Date | null }): boolean {
  if (!admin.lockedUntil) return false;
  return new Date(admin.lockedUntil).getTime() > Date.now();
}

/* ---------------------------- revocation ------------------------------- */

/** Revokes the caller's session (logout). */
export async function revokeSessionByToken(token: string | null, reason = 'logout'): Promise<number> {
  if (!token) return 0;
  await db();
  const result = await AdminSession.updateMany(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date(), revokedByIp: reason } },
  );
  return result.modifiedCount ?? 0;
}

export async function revokeSessionById(adminId: string, sessionId: string): Promise<number> {
  await db();
  const result = await AdminSession.updateMany(
    { adminId, _id: sessionId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  return result.modifiedCount ?? 0;
}

/** Revokes every session except the one identified by `keepToken`. */
export async function revokeOtherSessions(adminId: string, keepToken: string | null): Promise<number> {
  await db();
  const result = await AdminSession.updateMany(
    {
      adminId,
      revokedAt: null,
      ...(keepToken ? { tokenHash: { $ne: hashToken(keepToken) } } : {}),
    },
    { $set: { revokedAt: new Date() } },
  );
  return result.modifiedCount ?? 0;
}

export async function listSessions(adminId: string, currentSessionId: string) {
  await db();
  return AdminSession.find({
    adminId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastActivityAt: -1 })
    .limit(50)
    .lean<Array<{
      _id: string;
      userAgent: string;
      createdAtIp: string | null;
      createdAt: Date;
      lastActivityAt: Date;
      expiresAt: Date;
    }>>()
    .then((rows) =>
      rows.map((row) => ({
        id: row._id,
        userAgent: row.userAgent,
        ip: row.createdAtIp,
        createdAt: row.createdAt.toISOString(),
        lastActivityAt: row.lastActivityAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        current: row._id === currentSessionId,
      })),
    );
}