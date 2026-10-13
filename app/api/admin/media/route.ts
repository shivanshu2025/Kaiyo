import { NextRequest } from 'next/server';
import { db } from '@/backend/lib/db';
import { MediaAsset } from '@/backend/models/MediaAsset';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import { buildStorageKey, deleteObject, putObject, StorageError } from '@/backend/lib/storage';
import { UploadError, validateUploadedFile } from '@/backend/lib/upload';
import { consumeRateLimit, RATE_LIMITS } from '@/backend/lib/rate-limit';
import {
  created,
  fail,
  handleRouteError,
  notFound,
  ok,
  pagination,
  tooManyRequests,
} from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/** Number of files accepted per upload request. */
const MAX_FILES_PER_REQUEST = 10;

/**
 * GET /api/admin/media  (ADMIN ONLY)
 *
 * Paginated library of uploaded assets. `kind` filters to images or videos.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    await db();

    const { limit, page, skip } = pagination(request.nextUrl.searchParams, {
      limit: 30,
      maxLimit: 100,
    });
    const kind = request.nextUrl.searchParams.get('kind');

    const filter: Record<string, unknown> = {};
    if (kind === 'image' || kind === 'video') filter.kind = kind;

    const [items, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Array<Record<string, unknown>>>(),
      MediaAsset.countDocuments(filter),
    ]);

    return ok({
      items: items.map((item) => ({
        id: item._id,
        name: item.name,
        kind: item.kind,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        width: item.width,
        height: item.height,
        alt: item.alt,
        createdAt: new Date(item.createdAt as string).toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/media');
  }
}

/**
 * POST /api/admin/media  (ADMIN ONLY + CSRF)
 *
 * Body: `multipart/form-data` with one or more `files` parts and an optional
 * `kind` field.
 *
 * Each file is validated by its real content (magic bytes), not its declared
 * MIME type, and written under a server-generated key - a client-supplied name
 * never becomes a path, which removes traversal and overwrite.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const limit = await consumeRateLimit(guard.auth.admin.id, RATE_LIMITS.mediaUpload);
    if (!limit.allowed) {
      return tooManyRequests('Upload limit reached. Please try again later.', limit.retryAfterSeconds);
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return fail('Expected a multipart/form-data upload.', 415);
    }

    const form = await request.formData();
    const declaredKind = form.get('kind');
    const kind =
      declaredKind === 'image' || declaredKind === 'video' ? declaredKind : undefined;

    const files = form
      .getAll('files')
      .filter((entry): entry is File => typeof File !== 'undefined' && entry instanceof File);

    const fallbackFile = form.get('file');
    if (files.length === 0 && fallbackFile instanceof File) files.push(fallbackFile);

    if (files.length === 0) return fail('No files were uploaded.', 400);
    if (files.length > MAX_FILES_PER_REQUEST) {
      return fail(`Upload at most ${MAX_FILES_PER_REQUEST} files at a time.`, 400);
    }

    await db();

    const stored = [];

    for (const file of files) {
      const validated = await validateUploadedFile(file, kind);

      const storageKey = buildStorageKey(validated.kind, validated.extension);
      const object = await putObject(storageKey, validated.buffer, validated.mimeType);

      const document = await MediaAsset.create({
        name: validated.name,
        kind: validated.kind,
        mimeType: validated.mimeType,
        size: validated.size,
        storageKey: object.key,
        driver: object.driver as never,
        url: object.url,
        alt: '',
        uploadedBy: guard.auth.admin.id,
      });

      stored.push({
        id: document._id,
        name: document.name,
        kind: document.kind,
        mimeType: document.mimeType,
        size: document.size,
        url: document.url,
      });
    }

    return created({ assets: stored }, `${stored.length} file${stored.length === 1 ? '' : 's'} uploaded.`);
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, 415);
    if (error instanceof StorageError) return fail(error.message, error.status);
    return handleRouteError(error, 'POST /api/admin/media');
  }
}

/**
 * DELETE /api/admin/media?id=<assetId>  (ADMIN ONLY + CSRF)
 *
 * Deletes the storage object and its metadata record together. The key comes
 * from the database, never from the request, so no caller can target an arbitrary
 * path or another site's asset.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return fail('Missing media id.', 400);

    // A malformed id is a client mistake, not a server fault. `findById` would
    // otherwise throw a CastError that surfaces as a 500 - indistinguishable, to
    // the dashboard, from the database being down.
    if (!/^[a-f\d]{24}$/i.test(id)) return fail('Invalid media id.', 400);

    await db();

    const asset = await MediaAsset.findById(id);
    if (!asset) return notFound('Media not found.');

    await deleteObject(asset.storageKey, asset.driver as string);
    await asset.deleteOne();

    return ok({ id }, { message: 'File deleted.' });
  } catch (error) {
    if (error instanceof StorageError) return fail(error.message, error.status);
    return handleRouteError(error, 'DELETE /api/admin/media');
  }
}