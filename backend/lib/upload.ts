import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  allowedMimeTypes,
  maxBytesFor,
  type MediaKind,
} from './storage';

/**
 * Upload validation.
 *
 * The declared `Content-Type` on a multipart part is attacker-controlled, so the
 * real type is determined from the file's magic bytes. A file that claims to be a
 * PNG but starts with `<?php` is rejected before it is ever written.
 */

const PREFIX_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

export type SniffResult = { mime: string; reason?: undefined } | { mime: null; reason: string };

/**
 * Identifies the true type of a buffer from its header. MP4/MOV/WebM/AVIF need
 * deeper probing than a byte prefix, so those are matched on their container
 * brand strings.
 */
export function sniffMime(buffer: Buffer): SniffResult {
  if (buffer.length < 12) return { mime: null, reason: 'File is empty or truncated.' };

  for (const signature of PREFIX_SIGNATURES) {
    const offset = signature.offset ?? 0;
    if (buffer.length < offset + signature.bytes.length) continue;
    const matches = signature.bytes.every((byte, index) => buffer[offset + index] === byte);
    if (matches) return { mime: signature.mime };
  }

  // ISO base media (MP4/MOV/AVIF): "....ftyp" at offset 4.
  const brand = buffer.subarray(4, 8).toString('latin1');
  if (brand === 'ftyp') {
    const majorBrand = buffer.subarray(8, 12).toString('latin1');
    if (majorBrand.startsWith('qt')) return { mime: 'video/quicktime' };
    if (majorBrand.startsWith('avif') || majorBrand.startsWith('avis')) {
      return { mime: 'image/avif' };
    }
    return { mime: 'video/mp4' };
  }

  // Matroska/WebM: EBML header.
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return { mime: 'video/webm' };
  }

  // SVG is text; guard against a script masquerading as markup.
  const head = buffer.subarray(0, 1024).toString('utf8').trimStart().toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) {
    if (/<script|javascript:|\son\w+\s*=/i.test(buffer.subarray(0, 2048).toString('utf8'))) {
      return { mime: null, reason: 'SVG files containing scripts are not allowed.' };
    }
    return { mime: 'image/svg+xml' };
  }

  return { mime: null, reason: 'Unsupported or unrecognised file format.' };
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

export type ValidatedUpload = {
  buffer: Buffer;
  kind: MediaKind;
  mimeType: string;
  extension: string;
  size: number;
  /** Sanitised display name, never used to build a filesystem path. */
  name: string;
};

/** Strips directory components and anything that is not a safe filename character. */
export function sanitiseFileName(raw: string, fallback = 'upload'): string {
  const base = (raw || '').split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
}

/**
 * Validates one uploaded file end to end: presence, size, real content type, and
 * that the content matches the requested kind.
 */
export async function validateUploadedFile(
  file: File,
  declaredKind?: MediaKind,
): Promise<ValidatedUpload> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new UploadError('No file was received.');
  }
  if (file.size <= 0) throw new UploadError('The uploaded file is empty.');

  const declaredMime = (file.type || '').toLowerCase();

  const kind: MediaKind =
    declaredKind ??
    (Object.keys(ALLOWED_IMAGE_TYPES).includes(declaredMime) ? 'image' : 'video');

  if (file.size > maxBytesFor(kind)) {
    throw new UploadError(
      `File is too large. The maximum size for a ${kind} is ${Math.round(
        maxBytesFor(kind) / (1024 * 1024),
      )} MB.`,
    );
  }

  // Reject an oversized body before buffering it into memory.
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > maxBytesFor(kind)) {
    throw new UploadError('File is larger than the configured limit.');
  }

  const sniffed = sniffMime(buffer);
  if (sniffed.mime === null) throw new UploadError(sniffed.reason);

  if (!allowedMimeTypes(kind).includes(sniffed.mime)) {
    throw new UploadError(
      `File content (${sniffed.mime}) does not match a supported ${kind} format.`,
    );
  }

  const extension = ALLOWED_IMAGE_TYPES[sniffed.mime] ?? ALLOWED_VIDEO_TYPES[sniffed.mime];
  const name = sanitiseFileName(file.name || `upload.${extension}`);

  return { buffer, kind, mimeType: sniffed.mime, extension, size: buffer.byteLength, name };
}