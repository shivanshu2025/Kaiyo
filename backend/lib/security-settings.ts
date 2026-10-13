import { db } from './db';
import { Admin } from '@/backend/models/Admin';
import { PASSWORD_MAX_BYTES } from './password';

/**
 * Per-account security policy.
 *
 * These values live on the `Admin` document rather than in a JSON file so they
 * are read on every request from the authoritative store, survive a redeploy,
 * and are scoped to the account they belong to.
 */

export type SecuritySettings = {
  maxFailedAttempts: number;
  lockoutMinutes: number;
  autoLogoutMinutes: number;
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
  autoLogoutMinutes: 60,
};

/**
 * bcrypt hashes have a 72-byte input limit. Anything longer is silently
 * truncated by bcrypt, so two passwords sharing a 72-byte prefix would compare
 * equal. `PASSWORD_MAX_BYTES` in `password.ts` is the enforced value - this re-export
 * exists so documentation and older call sites keep a single name for it.
 */
export const EFFECTIVE_PASSWORD_MAX_LENGTH = PASSWORD_MAX_BYTES;

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Resolves a raw `Admin.security` sub-document into effective, clamped settings.
 *
 * Pure, so the session resolver can apply the *same* policy to a value it already
 * has in hand (see `resolveAuth` in `admin-auth.ts`) without a second query and
 * without a second copy of the ranges drifting apart.
 */
export function resolveSecuritySettings(
  stored: Partial<SecuritySettings> | null | undefined,
): SecuritySettings {
  return {
    maxFailedAttempts: clamp(
      stored?.maxFailedAttempts,
      1,
      50,
      DEFAULT_SECURITY_SETTINGS.maxFailedAttempts,
    ),
    lockoutMinutes: clamp(
      stored?.lockoutMinutes,
      1,
      1440,
      DEFAULT_SECURITY_SETTINGS.lockoutMinutes,
    ),
    autoLogoutMinutes: clamp(
      stored?.autoLogoutMinutes,
      5,
      720,
      DEFAULT_SECURITY_SETTINGS.autoLogoutMinutes,
    ),
  };
}

export async function getSecuritySettings(adminId: string): Promise<SecuritySettings> {
  await db();

  const admin = await Admin.findById(adminId)
    .select('security')
    .lean<{ security?: Partial<SecuritySettings> }>();

  return resolveSecuritySettings(admin?.security);
}

export async function setSecuritySettings(
  adminId: string,
  patch: Partial<SecuritySettings>,
): Promise<SecuritySettings> {
  await db();

  const current = await getSecuritySettings(adminId);
  const next: SecuritySettings = {
    maxFailedAttempts: clamp(
      patch.maxFailedAttempts ?? current.maxFailedAttempts,
      1,
      50,
      current.maxFailedAttempts,
    ),
    lockoutMinutes: clamp(
      patch.lockoutMinutes ?? current.lockoutMinutes,
      1,
      1440,
      current.lockoutMinutes,
    ),
    autoLogoutMinutes: clamp(
      patch.autoLogoutMinutes ?? current.autoLogoutMinutes,
      5,
      720,
      current.autoLogoutMinutes,
    ),
  };

  await Admin.updateOne({ _id: adminId }, { $set: { security: next } });
  return next;
}