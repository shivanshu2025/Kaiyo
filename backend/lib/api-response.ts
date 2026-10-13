import { NextResponse } from 'next/server';

/**
 * A single response envelope for every API route, so clients can branch on
 * `success` and read `error` without knowing which route they called.
 */
export type ApiSuccess<T> = { success: true; data: T; message?: string };
export type ApiFailure = {
  success: false;
  error: string;
  /** Field-level messages, present only on validation failures. */
  fields?: Record<string, string>;
};

export function ok<T>(data: T, init?: { status?: number; message?: string }) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data, ...(init?.message ? { message: init.message } : {}) },
    { status: init?.status ?? 200 },
  );
}

export function created<T>(data: T, message?: string) {
  return ok(data, { status: 201, message });
}

export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ApiFailure>(
    { success: false, error, ...(fields ? { fields } : {}) },
    { status },
  );
}

export const unauthorized = (message = 'Authentication required.') => fail(message, 401);
export const forbidden = (message = 'Administrator access required.') => fail(message, 403);
export const notFound = (message = 'Record not found.') => fail(message, 404);
export const tooManyRequests = (message: string, retryAfterSeconds: number) =>
  NextResponse.json<ApiFailure>(
    { success: false, error: message },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) } },
  );

/**
 * Last-resort handler. It logs the real error server-side but returns a generic
 * message so stack traces, driver errors and connection strings never reach a
 * client.
 */
export function handleRouteError(error: unknown, context: string) {
  const err = error as { message?: string; stack?: string } | null;
  console.error(`[api] ${context} failed:`, err?.stack || err?.message || error);
  return fail('Something went wrong. Please try again.', 500);
}

/** Parses a JSON body without throwing on malformed input. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Parses a query string into a small typed helper used for pagination/filters. */
export function pagination(searchParams: URLSearchParams, defaults = { limit: 20, maxLimit: 100 }) {
  const rawLimit = toInt(searchParams.get('limit'));
  const rawPage = toInt(searchParams.get('page'));

  const limit = rawLimit === null
    ? defaults.limit
    : Math.min(defaults.maxLimit, Math.max(1, rawLimit));
  const page = rawPage === null ? 1 : Math.max(1, rawPage);

  return { limit, page, skip: (page - 1) * limit };
}

/**
 * `Number(null)` is `0` and `Number('')` is `0`, so a missing parameter has to be
 * detected explicitly - otherwise the default page size would silently become 1.
 */
function toInt(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.floor(parsed) : null;
}