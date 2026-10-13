'use client';

/**
 * Browser-side helper for admin API calls.
 *
 * Centralises three things every dashboard request needs:
 *  1. the CSRF header (read from the non-HttpOnly CSRF cookie), which the server
 *     requires on every state-changing request,
 *  2. uniform error extraction from the `{ success, error, fields }` envelope,
 *  3. reacting to an expired session by sending the user to the login page
 *     instead of showing a confusing "failed to load" message.
 */

export const CSRF_COOKIE = 'kaiyo-admin-csrf';
export const CSRF_HEADER = 'x-kaiyo-csrf';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }
}

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/** Headers for a mutating request: JSON content type plus the CSRF token. */
export function adminHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = { 'x-requested-with': 'fetch' };
  if (json) headers['Content-Type'] = 'application/json';
  const csrf = readCookie(CSRF_COOKIE);
  if (csrf) headers[CSRF_HEADER] = csrf;
  return headers;
}

/** Redirects to the login page exactly once when the session has gone. */
let redirecting = false;
function handleExpiry() {
  if (redirecting || typeof window === 'undefined') return;
  redirecting = true;
  const from = window.location.pathname + window.location.search;
  window.location.replace(`/admin/login?reason=session&from=${encodeURIComponent(from)}`);
}

export type AdminResponse<T> = { data: T; message?: string };

/**
 * Performs an authenticated admin request.
 *
 * Returns `{ data, message }` on success and throws an {@link ApiError}
 * otherwise, so callers get a single, predictable failure path and a 401
 * automatically bounces the user to the login page.
 */
export async function adminFetch<T = unknown>(
  input: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<AdminResponse<T>> {
  const { json, ...rest } = init;

  const response = await fetch(input, {
    ...rest,
    cache: 'no-store',
    headers: {
      ...adminHeaders(json !== undefined),
      ...(rest.headers as Record<string, string> | undefined),
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        success?: boolean;
        data?: T;
        error?: string;
        message?: string;
        fields?: Record<string, string>;
      }
    | null;

  if (!response.ok || !payload?.success) {
    if (response.status === 401) handleExpiry();
    throw new ApiError(
      payload?.error || `Request failed with status ${response.status}.`,
      response.status,
      payload?.fields,
    );
  }

  return { data: payload?.data as T, message: payload?.message };
}