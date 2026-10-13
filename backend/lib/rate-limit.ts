import crypto from 'crypto';
import { db } from './db';
import { RateLimit } from '@/backend/models/RateLimit';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSeconds: number;
  limit: number;
};

export type RateLimitRule = {
  /** Namespace so `login:1.2.3.4` and `contact:1.2.3.4` are tracked separately. */
  bucket: string;
  limit: number;
  windowSeconds: number;
};

/**
 * Fixed-window rate limiter backed by MongoDB.
 *
 * Counters live in the database rather than in process memory so the limits are
 * shared across every serverless instance and survive a redeployment - an
 * in-process Map would silently reset on each cold start and be trivially
 * bypassed by parallel requests.
 *
 * The window is maintained in three steps. Step 3 is an atomic `$inc`, which is
 * what makes concurrent requests from the same identifier unable to race past
 * the limit. (An aggregation-pipeline update would be tidier, but MongoDB does
 * not support those together with `upsert`.)
 */
export async function consumeRateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  await db();

  const now = new Date();
  const key = `${rule.bucket}:${identifier}`;
  const resetAt = new Date(now.getTime() + rule.windowSeconds * 1000);

  // 1. Create the counter if this is the first request in the bucket.
  await RateLimit.updateOne(
    { key },
    { $setOnInsert: { key, count: 0, resetAt } },
    { upsert: true },
  );

  // 2. Start a fresh window once the previous one has elapsed.
  await RateLimit.updateOne({ key, resetAt: { $lte: now } }, { $set: { count: 0, resetAt } });

  // 3. Atomically count this request.
  const doc = await RateLimit.findOneAndUpdate({ key }, { $inc: { count: 1 } }, { new: true })
    .lean<{ count: number; resetAt: Date }>();

  const count = doc?.count ?? 1;
  const windowEndsAt = doc?.resetAt ? new Date(doc.resetAt).getTime() : now.getTime();
  const retryAfterSeconds = Math.max(0, (windowEndsAt - Date.now()) / 1000);

  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds,
    limit: rule.limit,
  };
}

/** Clears a counter - called after a successful login so honest admins are not penalised. */
export async function resetRateLimit(identifier: string, bucket: string): Promise<void> {
  await db();
  await RateLimit.deleteOne({ key: `${bucket}:${identifier}` });
}

/**
 * Reads a bucket **without** incrementing it.
 *
 * `consumeRateLimit` counts the request, which would make "am I currently locked?"
 * impossible to ask - the very act of asking would extend the window. This is the
 * read-only counterpart used to enforce a lockout that is already in force.
 */
export async function peekRateLimit(identifier: string, bucket: string): Promise<RateLimitResult> {
  await db();

  const key = `${bucket}:${identifier}`;
  const doc = await RateLimit.findOne({ key }).lean<{ count: number; resetAt: Date }>();

  const now = Date.now();
  const expiresAt = doc ? new Date(doc.resetAt).getTime() : 0;
  const active = Boolean(doc) && (doc?.count ?? 0) > 0 && expiresAt > now;

  return {
    allowed: !active,
    remaining: 0,
    retryAfterSeconds: active ? Math.max(1, Math.ceil((expiresAt - now) / 1000)) : 0,
    limit: 1,
  };
}

/**
 * Locks one identifier out of one bucket for `windowSeconds`.
 *
 * The window is stored as the document's `resetAt`, which `consumeRateLimit` already
 * treats as the expiry point, so a lockout needs no reaper of its own: once the
 * window elapses the bucket resets itself and the identifier is admitted again.
 *
 * This is deliberately keyed on the *request source*, never on an account. A lockout
 * that any anonymous caller could trigger on a shared account is a denial-of-service
 * primitive, not a security control - see `app/api/admin/login/route.ts`.
 */
export async function lockOutRateLimit(
  identifier: string,
  bucket: string,
  windowSeconds: number,
): Promise<number> {
  await db();

  const key = `${bucket}:${identifier}`;
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  await RateLimit.updateOne({ key }, { $set: { key, count: 1, resetAt } }, { upsert: true });

  return windowSeconds;
}

/**
 * A stable, non-reversible pseudonym for an IP address.
 *
 * Storing a hash rather than the raw address means an admin can still correlate
 * repeat submissions from one source, but a database disclosure does not hand
 * over a list of visitor IP addresses.
 */
export function hashIp(ip: string | null, salt: string): string {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/**
 * Best-effort client IP, from headers a *trustworthy* proxy sets.
 *
 * ## Why a plain `.split(',')[0]` is not safe on its own
 *
 * The leftmost `X-Forwarded-For` entry is the value a client can most easily
 * forge, so the general rule is: only use a forwarded header when something you
 * control overwrites it. Whether that guarantee exists depends entirely on the
 * deployment surface, not on the code.
 *
 * ## Vercel (verified behaviour)
 *
 * Vercel populates `X-Forwarded-For` itself from the TCP connection of the
 * request it receives and **overwrites any incoming value**, explicitly "to
 * prevent IP spoofing" (Vercel docs, request-headers reference). Because Vercel
 * sets the header rather than appending to it, the leftmost entry on a Vercel
 * deployment is the real client address and cannot be chosen by the caller.
 *
 * Vercel also sets `VERCEL=1` in both the build and the runtime environment of
 * every deployment, which is what makes this detectable without configuration.
 * On Vercel the header is therefore trusted automatically - there is nothing for
 * the operator to remember to switch on.
 *
 * Two caveats, both of which fail closed rather than open:
 *  - If *another* CDN or proxy sits in front of Vercel, Vercel records the
 *    *proxy's* address, not the visitor's, and every visitor collapses into one
 *    bucket. Restoring real client IPs behind a proxy needs Vercel's "Verified
 *    Proxy" / Trusted Proxy (Enterprise), which is a platform setting, not
 *    something this code can fix.
 *  - `x-vercel-forwarded-for` is deliberately NOT used as a fallback: Vercel's own
 *    documentation describes it as the address that connected *directly* to
 *    Vercel, which behind another proxy is the proxy itself.
 *
 * ## Self-hosted
 *
 * A bare Node server exposes these headers to the client, where anyone could send
 * `x-forwarded-for: <victim>` to burn another visitor's budget, or send a random
 * value on every request to get a fresh bucket. `TRUSTED_PROXY` is the explicit
 * opt-in for that case - set it only when a proxy you control rewrites the header
 * (nginx `proxy_set_header X-Forwarded-For $remote_addr;`, not the
 * `$proxy_add_x_forwarded_for` variant, which appends to client input).
 *
 * ## Validation
 *
 * A header is only used when its value is actually shaped like an IP address.
 * This keeps `ratelimits` keys bounded to real addresses: without it, a
 * misconfigured proxy would let a caller mint an unlimited number of distinct
 * rate-limit documents.
 */
function trustProxyHeaders(): boolean {
  const flag = (process.env.TRUSTED_PROXY ?? '').trim().toLowerCase();
  return flag === '1' || flag === 'true';
}

/** True when running on Vercel, which overwrites `x-forwarded-for` for us. */
function onVercel(): boolean {
  return Boolean((process.env.VERCEL ?? '').trim());
}

/**
 * Accepts a bare IPv4 or IPv6 address and nothing else.
 *
 * The check is strict on purpose. This value becomes part of a MongoDB key, so a
 * looser test ("looks vaguely like an address") would still let a caller mint an
 * unbounded number of distinct rate-limit documents and grow the `ratelimits`
 * collection without limit. Both branches below match a *finite* set of strings:
 * IPv4 against the numeric octet rule, IPv6 against a fixed character set and a
 * hard length cap.
 */
function isIpAddress(value: string): boolean {
  if (value.length === 0 || value.length > 45) return false; // 45 = longest IPv6 text form

  if (!value.includes(':')) {
    // Strict dotted-quad: four octets, each 0-255, no leading zeros.
    const octets = value.split('.');
    if (octets.length !== 4) return false;
    return octets.every((octet) => /^(0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255);
  }

  // IPv6: hex digits and colons only, at least one compression group or a full
  // eight-group address. This is a shape test, not a parser - it rejects
  // arbitrary attacker-chosen strings, which is the property that matters here.
  if (!/^[0-9a-fA-F:.]+$/.test(value)) return false;
  const colons = value.match(/:/g)?.length ?? 0;
  return colons >= 2;
}

/**
 * The leftmost `X-Forwarded-For` entry, validated.
 *
 * The leftmost entry is correct only because the edge we are behind overwrites
 * the whole header (see the note above). When a proxy *appends* instead - the
 * default for nginx and most other proxies - this position is client-controlled,
 * which is exactly why the result is validated and why the header is gated on a
 * trustworthy edge in the first place.
 */
function forwardedFor(request: Request): string | null {
  const raw = request.headers.get('x-forwarded-for');
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  if (!first || !isIpAddress(first)) return null;
  return first;
}

function headerIp(request: Request, name: string): string | null {
  const value = request.headers.get(name)?.trim();
  if (!value || !isIpAddress(value)) return null;
  return value;
}

export function clientIp(request: Request): string {
  // Vercel overwrites `x-forwarded-for` from the TCP connection, so it is an
  // authenticated identifier on that platform and needs no operator opt-in.
  if (onVercel()) {
    return forwardedFor(request) ?? headerIp(request, 'x-real-ip') ?? 'untrusted';
  }

  if (trustProxyHeaders()) {
    return forwardedFor(request) ?? headerIp(request, 'x-real-ip') ?? 'untrusted';
  }

  // No trustworthy edge: there is no reliable client address through the Fetch
  // API. A single shared bucket is the safe failure mode - it is a real (deny)
  // rate limit rather than a bypassable one.
  return 'untrusted';
}

/* ---------------------------- shared rules ------------------------------ */

export const RATE_LIMITS = {
  login: { bucket: 'login', limit: 10, windowSeconds: 15 * 60 },
  /**
   * Counts consecutive wrong PINs from one request source. On the Nth failure the
   * source is parked in `loginLockout`; the numeric limits here are only the
   * defaults - `app/api/admin/login/route.ts` overrides them with the
   * administrator-configured `maxFailedAttempts` / `lockoutMinutes`.
   */
  loginFailure: { bucket: 'login-failure', limit: 5, windowSeconds: 15 * 60 },
  /** An in-force lockout for one request source. Count is 0 (open) or 1 (locked). */
  loginLockout: { bucket: 'login-lockout', limit: 1, windowSeconds: 15 * 60 },
  contact: { bucket: 'contact', limit: 5, windowSeconds: 10 * 60 },
  testimonial: { bucket: 'testimonial', limit: 5, windowSeconds: 60 * 60 },
  lead: { bucket: 'lead', limit: 3, windowSeconds: 30 * 60 },
  /** Per-solution bucket, so one page cannot be flooded from many addresses. */
  leadPerSolution: { bucket: 'lead-solution', limit: 20, windowSeconds: 30 * 60 },
  testimonialUpload: { bucket: 'testimonial-upload', limit: 5, windowSeconds: 60 * 60 },
  /**
   * The quote endpoint is unauthenticated and hits the database on every call, so
   * it needs a budget like the other public write paths. It is deliberately far
   * more generous than `contact`/`lead`: a visitor legitimately re-runs the
   * calculator while they experiment with a project value.
   */
  calculatorQuote: { bucket: 'calculator-quote', limit: 120, windowSeconds: 60 * 60 },
  mediaUpload: { bucket: 'media-upload', limit: 60, windowSeconds: 60 * 60 },
  cmsWrite: { bucket: 'cms-write', limit: 300, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;