import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { env } from './env';

/**
 * Pluggable media storage.
 *
 * The previous implementation listed and served uploads from `public/`, which is
 * part of the deployment bundle: files disappear on the next deploy and cannot be
 * written at all on a read-only serverless filesystem. This module makes the
 * backing store explicit and refuses to run on an ephemeral filesystem in
 * production.
 *
 * Drivers:
 *  - `local`     - development only. Writes to `.uploads/`, served by
 *                  `app/uploads/[...path]/route.ts`.
 *  - `vercel-blob` - Vercel Blob via the REST API (no extra dependency; uploads
 *                  are authenticated with `BLOB_READ_WRITE_TOKEN`).
 *  - `s3`        - a generic S3-compatible write endpoint. NOTE: AWS SigV4 signing
 *                  is not implemented, so this needs an endpoint that accepts an
 *                  anonymous (or static-token) PUT. `vercel-blob` is the supported
 *                  production driver.
 */

export type StoredObject = { key: string; url: string; driver: string };

export type MediaKind = 'image' | 'video';

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export function allowedMimeTypes(kind: 'image' | 'video'): string[] {
  return kind === 'image' ? Object.keys(ALLOWED_IMAGE_TYPES) : Object.keys(ALLOWED_VIDEO_TYPES);
}

export function maxBytesFor(kind: 'image' | 'video'): number {
  return kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Builds a storage key from server-generated randomness.
 *
 * The key is never derived from the client-supplied filename, which removes the
 * path-traversal and overwrite vectors entirely (`../../etc/passwd` becomes an
 * unrelated random name). The original name is preserved as metadata.
 */
export function buildStorageKey(kind: 'image' | 'video', extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const id = crypto.randomBytes(12).toString('hex');
  return `${kind}/${stamp}/${id}.${extension}`;
}

export function storageDriver(): 'local' | 'vercel-blob' | 's3' {
  const configured = (process.env.MEDIA_STORAGE_DRIVER || '').trim();
  if (configured === 'vercel-blob' || configured === 's3') return configured;
  return 'local';
}

/** Production must never write to the deployment filesystem. */
export function assertDriverUsable(driver: string): void {
  if (driver === 'local' && env.isProd) {
    throw new StorageError(
      'MEDIA_STORAGE_DRIVER is "local" in production, but the deployment filesystem is not persistent. Set MEDIA_STORAGE_DRIVER to "vercel-blob" or "s3".',
      503,
    );
  }
}

/* ------------------------------- local --------------------------------- */

const LOCAL_ROOT = path.join(process.cwd(), '.uploads');

function localPathFor(key: string): string {
  // Defence in depth: resolve and confirm the result is still inside the root.
  const resolved = path.resolve(LOCAL_ROOT, key);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT) + path.sep)) {
    throw new StorageError('Invalid storage key.', 400);
  }
  return resolved;
}

async function putLocal(key: string, body: Buffer): Promise<StoredObject> {
  const target = localPathFor(key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, body);
  return { key, url: `/uploads/${key}`, driver: 'local' };
}

async function deleteLocal(key: string): Promise<void> {
  await fs.rm(localPathFor(key), { force: true });
}

/**
 * Reads a locally stored object. Used only by the development upload-serving
 * route; returns `null` for anything that resolves outside the upload root.
 */
export async function readLocal(key: string): Promise<Buffer | null> {
  try {
    const resolved = path.resolve(LOCAL_ROOT, key);
    if (!resolved.startsWith(path.resolve(LOCAL_ROOT) + path.sep)) return null;
    return await fs.readFile(resolved);
  } catch {
    return null;
  }
}

/* ---------------------------- vercel blob ------------------------------ */

const BLOB_ENDPOINT = 'https://blob.vercel-storage.com';

async function putVercelBlob(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new StorageError('BLOB_READ_WRITE_TOKEN is not configured.', 503);
  }

  const response = await fetch(`${BLOB_ENDPOINT}/${key}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': contentType,
      'x-content-type': contentType,
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new StorageError(`Blob upload failed with status ${response.status}.`, 502);
  }

  const payload = (await response.json().catch(() => null)) as { url?: string } | null;
  return {
    key,
    url: payload?.url ?? `${BLOB_ENDPOINT}/${key}`,
    driver: 'vercel-blob',
  };
}

async function deleteVercelBlob(key: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return;

  await fetch(`${BLOB_ENDPOINT}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  }).catch(() => undefined);
}

/* --------------------------------- s3 ---------------------------------- */

/**
 * Generic S3-compatible driver.
 *
 * SCOPE / LIMITATION - read this before choosing it in production:
 * AWS Signature V4 signing is **not** implemented, so this driver cannot upload to
 * real Amazon S3 or to a bucket that requires signed requests. It only works
 * against an endpoint that accepts an unauthenticated `PUT` - a self-hosted
 * MinIO with a public-write bucket, or a CDN write endpoint.
 *
 * `S3_AUTH_TOKEN` is sent as a bearer token when set, which covers endpoints that
 * require a static shared token.
 *
 * The supported production driver is `vercel-blob` (see `putVercelBlob`), which is
 * authenticated properly and needs only `BLOB_READ_WRITE_TOKEN`. Use it unless you
 * have a specific reason to run your own object store.
 */
async function putS3(key: string, body: Buffer, contentType: string): Promise<StoredObject> {
  const base = process.env.S3_UPLOAD_BASE?.trim();
  if (!base) throw new StorageError('S3_UPLOAD_BASE is not configured.', 503);

  if (env.isProd && !process.env.S3_AUTH_TOKEN?.trim()) {
    // Anonymous writes to a public bucket are a configuration worth surfacing
    // rather than discovering after the first upload fails.
    console.warn(
      '[storage] MEDIA_STORAGE_DRIVER=s3 without S3_AUTH_TOKEN. Uploads will be ' +
        'anonymous. AWS SigV4 signing is not implemented - use the vercel-blob ' +
        'driver for a managed production store.',
    );
  }

  const target = `${base.replace(/\/$/, '')}/${key}`;
  const authToken = process.env.S3_AUTH_TOKEN?.trim();

  const response = await fetch(target, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
      ...(authToken ? { authorization: `Bearer ${authToken}` } : {}),
    },
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    throw new StorageError(`Object storage upload failed with status ${response.status}.`, 502);
  }

  const publicBase = process.env.S3_PUBLIC_BASE?.trim();
  return { key, url: publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : target, driver: 's3' };
}

async function deleteS3(key: string): Promise<void> {
  const base = process.env.S3_DELETE_BASE?.trim();
  if (!base) return;

  const authToken = process.env.S3_AUTH_TOKEN?.trim();

  await fetch(`${base.replace(/\/$/, '')}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    ...(authToken ? { headers: { authorization: `Bearer ${authToken}` } } : {}),
  }).catch(() => undefined);
}

/* ------------------------------ public API ----------------------------- */

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<StoredObject> {
  const driver = storageDriver();
  assertDriverUsable(driver);

  switch (driver) {
    case 'vercel-blob':
      return putVercelBlob(key, body, contentType);
    case 's3':
      return putS3(key, body, contentType);
    default:
      return putLocal(key, body);
  }
}

export async function deleteObject(key: string, driver: string): Promise<void> {
  switch (driver) {
    case 'vercel-blob':
      return deleteVercelBlob(key);
    case 's3':
      return deleteS3(key);
    default:
      return deleteLocal(key);
  }
}