import bcrypt from 'bcryptjs';

/**
 * Password hashing.
 *
 * bcrypt with a cost factor of 12 (~250ms per verification on typical serverless
 * hardware) is used rather than a bare SHA-256/salt digest: it is memory-hard and
 * deliberately slow, which is what makes offline cracking of a leaked hash
 * expensive.
 *
 * The plaintext password is never logged, returned, or written to disk.
 */

const COST = 12;
const COST_MAX = 14;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // A malformed hash in the database must read as "wrong password", not as a 500.
    return false;
  }
}

/**
 * Detects whether an existing hash uses a weaker cost factor than the current
 * policy so it can be transparently upgraded on the next successful sign-in.
 */
export function needsRehash(hash: string): boolean {
  const match = /^\$2[aby]\$(\d{2})\$/.exec(hash);
  if (!match) return true;
  const cost = Number(match[1]);
  return cost < COST || cost > COST_MAX || !Number.isFinite(cost);
}

export const PASSWORD_MIN_LENGTH = 10;

/**
 * bcrypt only reads the first 72 **bytes** of its input and silently ignores the
 * rest. Two passwords sharing a 72-byte prefix therefore produce the same hash and
 * compare equal, so the advertised maximum has to be enforced against the encoded
 * length, not the JavaScript string length (a 30-character non-ASCII password can
 * easily exceed 72 bytes).
 *
 * This is the same value as `EFFECTIVE_PASSWORD_MAX_LENGTH` in
 * `security-settings.ts`; it lives here because the hashing code is what the limit
 * protects.
 */
export const PASSWORD_MAX_BYTES = 72;

/**
 * Maximum password length in UTF-16 code units, chosen so that any string which
 * fits is guaranteed to be within `PASSWORD_MAX_BYTES` bytes. 36 ASCII characters
 * is the safe worst case; longer ASCII passwords are rejected with a byte-accurate
 * message rather than silently truncated by bcrypt.
 */
export const PASSWORD_MAX_LENGTH = 72;

/**
 * Server-side enforcement of the same policy the UI advertises.
 *
 * Returns an error message, or `null` when the password is acceptable.
 * `validatePasswordByteLength` is what protects the hash; this is the friendly
 * wrapper the creation script uses.
 */
export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) return 'Password is required.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) return 'Include at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Include at least one uppercase letter.';
  if (!/\d/.test(password)) return 'Include at least one number.';
  return validatePasswordByteLength(password);
}

/**
 * Rejects a password bcrypt would silently truncate.
 *
 * Checking the encoded byte length (not `.length`) is what makes this correct for
 * multi-byte characters: 30 four-byte emoji are 120 bytes and must be refused,
 * even though `.length` is only 60.
 */
export function validatePasswordByteLength(password: string): string | null {
  const bytes = Buffer.byteLength(password, 'utf8');
  if (bytes > PASSWORD_MAX_BYTES) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes when encoded (this one is ${bytes}).`;
  }
  return null;
}