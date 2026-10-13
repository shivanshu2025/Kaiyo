import { NextRequest } from 'next/server';
import { db } from '@/backend/lib/db';
import { MediaAsset } from '@/backend/models/MediaAsset';
import { buildStorageKey, putObject, StorageError } from '@/backend/lib/storage';
import { UploadError, validateUploadedFile } from '@/backend/lib/upload';
import { clientIp, consumeRateLimit, RATE_LIMITS } from '@/backend/lib/rate-limit';
import { created, fail, handleRouteError, tooManyRequests } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/testimonials/avatar  (PUBLIC)
 *
 * Body: `multipart/form-data` with a single `file` part.
 *
 * Returns `{ url }` - a real, validated image URL - for use as a testimonial
 * avatar. This exists because the testimonial schema deliberately accepts only
 * http(s) or site-relative URLs: a base64 `data:` payload is not a valid avatar
 * reference, so the browser must upload the file first and send back the URL.
 *
 * This is the only public endpoint that writes to storage, so it is deliberately
 * narrow:
 *  - images only, and the real type is determined from magic bytes, never from the
 *    browser-supplied `Content-Type`;
 *  - SVG is rejected outright. A browser-served SVG is same-origin script when it
 *    is navigated to directly, and unlike the admin-only media library this endpoint
 *    has no authenticated caller to justify the risk;
 *  - 8 MB ceiling (the shared `MAX_IMAGE_BYTES`), one file per request;
 *  - rate limited per IP;
 *  - the storage key is generated server-side, so a client filename can never
 *    become a path;
 *  - the object is recorded as a `MediaAsset`, so it shows up in the admin Media
 *    library and can be deleted from there like any other upload.
 *
 * Nothing is written unless validation passes.
 */
const PUBLIC_AVATAR_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    const limit = await consumeRateLimit(ip, RATE_LIMITS.testimonialUpload);
    if (!limit.allowed) {
      return tooManyRequests(
        'Too many uploads. Please try again later.',
        limit.retryAfterSeconds,
      );
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return fail('Expected a multipart/form-data upload.', 415);
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || typeof File === 'undefined') {
      return fail('No file was uploaded.', 400);
    }

    // Force the image branch so a video cannot be smuggled in through `kind`.
    const validated = await validateUploadedFile(file, 'image');

    if (!PUBLIC_AVATAR_TYPES.has(validated.mimeType)) {
      throw new UploadError('Upload a PNG, JPEG, WebP, AVIF or GIF image.');
    }

    const storageKey = buildStorageKey('image', validated.extension);
    const object = await putObject(storageKey, validated.buffer, validated.mimeType);

    // Tracked like any other upload. Without this record the object existed only
    // in storage: it never appeared in the admin Media library, could not be
    // deleted from the dashboard, and `mediaImages` in the overview count ignored
    // it - so every avatar a visitor uploaded became an unremovable orphan.
    // `uploadedBy` stays null because the caller is anonymous by design.
    await db();
    await MediaAsset.create({
      name: validated.name,
      kind: 'image',
      mimeType: validated.mimeType,
      size: validated.size,
      storageKey: object.key,
      driver: object.driver as never,
      url: object.url,
      alt: '',
    });

    return created({ url: object.url }, 'Image uploaded.');
  } catch (error) {
    if (error instanceof UploadError) return fail(error.message, 415);
    if (error instanceof StorageError) return fail(error.message, error.status);
    return handleRouteError(error, 'POST /api/testimonials/avatar');
  }
}