import { NextResponse } from 'next/server';
import { db, isDbConnected } from '@/backend/lib/db';
import { env } from '@/backend/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health  (PUBLIC)
 *
 * A liveness/readiness probe for the deployment platform. It reports whether the
 * process can reach MongoDB - nothing else.
 *
 * Deliberately minimal, because this endpoint is unauthenticated:
 *  - no connection string, host, cluster name, database name or version;
 *  - no collection names, counts, or environment values;
 *  - the underlying error is logged server-side but never returned, so a probe
 *    cannot be used to fingerprint the deployment.
 *
 * Responses: 200 healthy | 503 database unreachable
 */
export async function GET() {
  try {
    await db();
    const connected = isDbConnected();

    return NextResponse.json(
      {
        success: connected,
        status: connected ? 'ok' : 'degraded',
        checks: { database: connected ? 'up' : 'down' },
      },
      { status: connected ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[health] database check failed:', (error as Error)?.name);

    return NextResponse.json(
      {
        success: false,
        status: 'unavailable',
        checks: { database: 'down' },
        // `env.isProd` is a boolean about the runtime, not about the infrastructure.
        ...(env.isProd ? {} : { note: 'development fallback database in use' }),
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}