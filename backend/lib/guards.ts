import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { fail, forbidden, unauthorized } from './api-response';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  csrfTokenFor,
  resolveAuth,
  safeEqual,
  type AuthContext,
} from './admin-auth';
import { env } from './env';

/**
 * Guards for protected route handlers.
 *
 * Every admin API calls one of these *before* touching data. The dashboard's
 * client-side code is never treated as an authorization boundary - hiding a page
 * or a button does not prevent a crafted request, so the check lives here.
 */

export type GuardResult = { ok: true; auth: AuthContext } | { ok: false; response: Response };

/** Methods that do not mutate state and therefore need no CSRF token. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function currentSessionToken(): string | null {
  return cookies().get('kaiyo-admin-token')?.value ?? null;
}

/**
 * Authenticates the caller and requires the `admin` role.
 *
 * Returns a ready-to-return 401/403 response instead of throwing, so route
 * handlers can use `if (!allowed.ok) return allowed.response;`.
 */
export async function requireAdmin(
  request: NextRequest,
  options: { touch?: boolean } = {},
): Promise<GuardResult> {
  let auth: AuthContext | null = null;
  try {
    auth = await resolveAuth({ touch: options.touch ?? true });
  } catch (error) {
    console.error('[auth] session resolution failed:', (error as Error)?.message);
    return {
      ok: false,
      response: fail('Authentication is temporarily unavailable. Please try again.', 503),
    };
  }

  if (!auth) {
    return { ok: false, response: unauthorized('Your session has expired. Please sign in again.') };
  }

  if (auth.admin.role !== 'admin') {
    return { ok: false, response: forbidden('Administrator access is required for this action.') };
  }

  return { ok: true, auth };
}

/**
 * CSRF verification for cookie-authenticated state changes.
 *
 * The header must carry an HMAC of the session token made with a server-only
 * secret, so a third-party site cannot forge it even though it can make the
 * browser attach the session cookie automatically (`SameSite=Lax` already blocks
 * cross-site POSTs; this is the second, explicit layer).
 */
export function verifyCsrf(request: NextRequest): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  // Note: this used to contain an `if (request.headers.get('origin') || ...)` block
  // whose comment claimed cross-site requests are rejected "before the HMAC check".
  // The block was empty - control simply fell through - so no rejection ever
  // happened there. The real defences are the ones below: `SameSite=Lax` on the
  // session cookie stops the browser attaching it to a cross-site POST at all, and
  // the HMAC cannot be produced by a third-party page.
  const sessionToken = currentSessionToken();
  if (!sessionToken) return false;

  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = cookies().get(CSRF_COOKIE)?.value;
  if (!headerToken || !cookieToken) return false;
  if (!safeEqual(headerToken, cookieToken)) return false;

  return safeEqual(headerToken, csrfTokenFor(sessionToken));
}

/**
 * The standard guard for a mutating admin endpoint: authenticate, check the role,
 * then check CSRF. `Origin` is validated against the deployment's own origin.
 */
export async function requireAdminMutation(request: NextRequest): Promise<GuardResult> {
  // Authentication is checked first so an anonymous caller gets a 401 rather
  // than a CSRF 403 - the more accurate answer, and it avoids leaking whether
  // the CSRF mechanism is in play.
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth;

  const origin = request.headers.get('origin');
  if (origin) {
    const allowed = env.siteUrl;
    let originHost: string;
    let allowedHost: string;
    try {
      originHost = new URL(origin).host;
      allowedHost = new URL(allowed).host;
    } catch {
      return { ok: false, response: forbidden('Invalid request origin.') };
    }
    if (originHost !== allowedHost) {
      return { ok: false, response: forbidden('Cross-origin requests are not allowed.') };
    }
  }

  if (!verifyCsrf(request)) {
    return {
      ok: false,
      response: fail('Security token missing or invalid. Please refresh the page.', 403),
    };
  }

  return auth;
}