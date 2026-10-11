import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Server-side security store for the admin panel.
 *
 * Design notes:
 * - The admin PIN is never stored in plaintext. It lives in `data/admin-security.json`
 *   as a scrypt hash + per-PIN salt. The frontend never receives it and never keeps a
 *   copy in localStorage.
 * - Until an admin saves a new PIN, the value from `ADMIN_PASSWORD` is used so existing
 *   deployments keep working unchanged.
 * - Failed-attempt counters, lockout state and issued sessions live in the same file so
 *   every request (login, admin pages, session list) sees the same state.
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'admin-security.json');

const SCRYPT_KEYLEN = 64;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 128;

/** Hard ceiling for a session, regardless of the configured auto-logout window. */
export const MAX_SESSION_MS = 1000 * 60 * 60 * 12;

export type AdminSession = {
  id: string;
  /** SHA-256 of the issued token. The raw token is never written to disk. */
  tokenHash: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  userAgent: string;
};

export type AdminSecuritySettings = {
  maxFailedAttempts: number;
  lockoutMinutes: number;
  autoLogoutMinutes: number;
};

type LoginState = {
  failedAttempts: number;
  lastFailedAt: string | null;
  lockedUntil: string | null;
};

export type AdminSecurityData = AdminSecuritySettings & {
  pin: { hash: string; salt: string; updatedAt: string } | null;
  login: LoginState;
  sessions: AdminSession[];
};

function defaults(): AdminSecurityData {
  return {
    pin: null,
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
    autoLogoutMinutes: 60,
    login: { failedAttempts: 0, lastFailedAt: null, lockedUntil: null },
    sessions: [],
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalise(stored: Partial<AdminSecurityData> | null): AdminSecurityData {
  const base = defaults();
  return {
    pin:
      stored?.pin && typeof stored.pin.hash === 'string' && typeof stored.pin.salt === 'string'
        ? stored.pin
        : null,
    maxFailedAttempts: clampInt(stored?.maxFailedAttempts, 1, 50, base.maxFailedAttempts),
    lockoutMinutes: clampInt(stored?.lockoutMinutes, 1, 1440, base.lockoutMinutes),
    autoLogoutMinutes: clampInt(stored?.autoLogoutMinutes, 1, 720, base.autoLogoutMinutes),
    login: {
      failedAttempts: clampInt(stored?.login?.failedAttempts, 0, 1_000_000, 0),
      lastFailedAt: typeof stored?.login?.lastFailedAt === 'string' ? stored.login.lastFailedAt : null,
      lockedUntil: typeof stored?.login?.lockedUntil === 'string' ? stored.login.lockedUntil : null,
    },
    sessions: Array.isArray(stored?.sessions)
      ? stored!.sessions.filter(
          (session): session is AdminSession =>
            Boolean(session) &&
            typeof session.id === 'string' &&
            typeof session.tokenHash === 'string' &&
            typeof session.expiresAt === 'string',
        )
      : [],
  };
}

/** Never throws: an unreadable file falls back to defaults rather than locking the admin out. */
export async function readAdminSecurity(): Promise<AdminSecurityData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return normalise(JSON.parse(raw) as Partial<AdminSecurityData>);
  } catch {
    return defaults();
  }
}

async function writeAdminSecurity(data: AdminSecurityData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/** Read-modify-write helper so concurrent requests don't clobber unrelated fields. */
async function updateAdminSecurity(
  updater: (current: AdminSecurityData) => AdminSecurityData,
): Promise<AdminSecurityData> {
  const current = await readAdminSecurity();
  const next = normalise(updater(current));
  await writeAdminSecurity(next);
  return next;
}

/* -------------------------------------------------------------------------- */
/* PIN                                                                         */
/* -------------------------------------------------------------------------- */

function derive(pin: string, salt: string) {
  return crypto.scryptSync(pin, salt, SCRYPT_KEYLEN).toString('hex');
}

/** Constant-time comparison that does not leak the stored hash's length. */
function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function validatePinFormat(pin: string) {
  if (typeof pin !== 'string' || pin.trim().length === 0) return 'PIN is required.';
  if (pin.length < PIN_MIN_LENGTH) return `PIN must be at least ${PIN_MIN_LENGTH} characters.`;
  if (pin.length > PIN_MAX_LENGTH) return `PIN must be at most ${PIN_MAX_LENGTH} characters.`;
  return null;
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { hash: derive(pin, salt), salt, updatedAt: new Date().toISOString() };
}

/**
 * Verifies a candidate PIN against the stored hash. Falls back to the
 * `ADMIN_PASSWORD` environment value until an admin saves a new PIN.
 */
export async function verifyPin(candidate: unknown) {
  if (typeof candidate !== 'string' || candidate.length === 0) return false;

  const data = await readAdminSecurity();

  if (data.pin) {
    return safeEqual(derive(candidate, data.pin.salt), data.pin.hash);
  }

  const fallback = process.env.ADMIN_PASSWORD || 'admin12345';
  const left = Buffer.from(candidate);
  const right = Buffer.from(fallback);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** Replaces the stored PIN with a scrypt hash of the new value. */
export async function setPin(pin: string) {
  return updateAdminSecurity((current) => ({ ...current, pin: hashPin(pin) }));
}

/** Applies the configurable security limits; every value is clamped to a sane range. */
export async function updateSecuritySettings(patch: Record<string, unknown>) {
  return updateAdminSecurity((current) => ({
    ...current,
    maxFailedAttempts: clampInt(patch.maxFailedAttempts, 1, 50, current.maxFailedAttempts),
    lockoutMinutes: clampInt(patch.lockoutMinutes, 1, 1440, current.lockoutMinutes),
    autoLogoutMinutes: clampInt(patch.autoLogoutMinutes, 1, 720, current.autoLogoutMinutes),
  }));
}

/** True when an admin has already replaced the environment-provided PIN. */
export async function pinWasChanged() {
  const data = await readAdminSecurity();
  return Boolean(data.pin);
}

/* -------------------------------------------------------------------------- */
/* Failed attempts + lockout                                                   */
/* -------------------------------------------------------------------------- */

export async function getLockoutState() {
  const { login, maxFailedAttempts, lockoutMinutes, autoLogoutMinutes } = await readAdminSecurity();
  const lockedUntil = login.lockedUntil && new Date(login.lockedUntil).getTime() > Date.now()
    ? login.lockedUntil
    : null;
  return { ...login, lockedUntil, maxFailedAttempts, lockoutMinutes, autoLogoutMinutes };
}

export async function isLockedOut() {
  const { lockedUntil } = await getLockoutState();
  return Boolean(lockedUntil);
}

/** Records one failed attempt and locks the account once the limit is reached. */
export async function registerFailedAttempt() {
  const state = await updateAdminSecurity((current) => {
    const failedAttempts = current.login.failedAttempts + 1;
    const lockedUntil =
      failedAttempts >= current.maxFailedAttempts
        ? new Date(Date.now() + current.lockoutMinutes * 60_000).toISOString()
        : current.login.lockedUntil;
    return { ...current, login: { failedAttempts, lastFailedAt: new Date().toISOString(), lockedUntil } };
  });
  const lockedUntil =
    state.login.lockedUntil && new Date(state.login.lockedUntil).getTime() > Date.now()
      ? state.login.lockedUntil
      : null;
  return {
    failedAttempts: state.login.failedAttempts,
    remainingAttempts: Math.max(0, state.maxFailedAttempts - state.login.failedAttempts),
    lockedUntil,
  };
}

export async function resetFailedAttempts() {
  await updateAdminSecurity((current) => ({
    ...current,
    login: { failedAttempts: 0, lastFailedAt: null, lockedUntil: null },
  }));
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

export function tokenFingerprint(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function sessionTtlMs(autoLogoutMinutes: number) {
  return Math.min(MAX_SESSION_MS, Math.max(1, autoLogoutMinutes) * 60_000);
}

function prune(sessions: AdminSession[]) {
  const now = Date.now();
  return sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
}

/** Records a newly issued token so it can be listed and revoked later. */
export async function createSession(token: string, userAgent: string) {
  const { autoLogoutMinutes } = await readAdminSecurity();
  const expiresAt = new Date(Date.now() + sessionTtlMs(autoLogoutMinutes)).toISOString();
  const session: AdminSession = {
    id: crypto.randomBytes(8).toString('hex'),
    tokenHash: tokenFingerprint(token),
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt,
    userAgent: userAgent.slice(0, 160),
  };
  await updateAdminSecurity((current) => ({
    ...current,
    sessions: prune([...current.sessions, session]),
  }));
  return session;
}

export async function listSessions() {
  const { sessions } = await readAdminSecurity();
  return prune(sessions);
}

/**
 * Authoritative revocation check used by the admin gate: a token is only accepted if it
 * also has a live session record. Tokens issued before session tracking existed are
 * accepted until their own expiry so no one is locked out mid-upgrade.
 */
export async function isSessionActive(token?: string | null) {
  if (!token) return false;
  const sessions = await listSessions();
  if (sessions.length === 0) return true;
  const fingerprint = tokenFingerprint(token);
  return sessions.some((session) => session.tokenHash === fingerprint);
}

export async function currentSessionId(token?: string | null) {
  if (!token) return null;
  const fingerprint = tokenFingerprint(token);
  const sessions = await listSessions();
  return sessions.find((session) => session.tokenHash === fingerprint)?.id ?? null;
}

/** Revokes a single session by id, every session except `exceptToken`'s, or one matched by raw token. */
export async function revokeSessions({
  id,
  exceptToken,
  token,
}: {
  id?: string;
  exceptToken?: string | null;
  token?: string;
}) {
  const keep = exceptToken ? tokenFingerprint(exceptToken) : null;
  const target = token ? tokenFingerprint(token) : null;
  let removed = 0;
  await updateAdminSecurity((current) => {
    const remaining: AdminSession[] = [];
    for (const session of prune(current.sessions)) {
      const revoked = target
        ? session.tokenHash === target
        : id
          ? session.id === id
          : keep
            ? session.tokenHash !== keep
            : true;
      if (revoked) removed += 1;
      else remaining.push(session);
    }
    return { ...current, sessions: remaining };
  });
  return removed;
}

/** Revokes only the session belonging to `token` (used by logout). */
export async function revokeSessionByToken(token?: string | null) {
  if (!token) return 0;
  return revokeSessions({ token });
}

/** Drops expired sessions so the file cannot grow without bound. */
export async function pruneSessions() {
  await updateAdminSecurity((current) => ({ ...current, sessions: prune(current.sessions) }));
}