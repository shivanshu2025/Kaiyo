import { NextRequest } from 'next/server';
import { readLocal, storageDriver } from '@/backend/lib/storage';
import { env } from '@/backend/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /uploads/<key>  - development-only static file server for the `local`
 * media driver.
 *
 * In production this route is disabled outright: persistent media belongs in
 * object storage (see `lib/storage.ts`), because a serverless filesystem is
 * rebuilt on every deploy.
 *
 * Path traversal is blocked twice - by `readLocal`, which re-resolves the path
 * and rejects anything outside the upload root, and by the check below.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } },
) {
  if (env.isProd || storageDriver() !== 'local') {
    return new Response('Not found', { status: 404 });
  }

  const segments = params.path ?? [];
  if (segments.length === 0) return new Response('Not found', { status: 404 });

  // Reject traversal explicitly rather than relying solely on normalisation.
  if (segments.some((segment) => segment === '..' || segment.includes('..') || segment.includes('\0'))) {
    return new Response('Not found', { status: 404 });
  }

  // `decodeURIComponent` throws a `URIError` on malformed percent-encoding
  // (`/uploads/%`). Left unhandled that escaped as an opaque framework 500; a bad
  // URL is simply a path that does not exist.
  let key: string;
  try {
    key = segments.map((segment) => decodeURIComponent(segment)).join('/');
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const body = await readLocal(key);
  if (!body) return new Response('Not found', { status: 404 });

  const extension = key.split('.').pop()?.toLowerCase() ?? '';
  const contentType: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
  };

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': contentType[extension] ?? 'application/octet-stream',
      // Uploads are immutable (the key contains a random id), so cache hard.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}