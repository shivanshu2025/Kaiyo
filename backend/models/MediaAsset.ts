import mongoose, { Schema, type Model } from 'mongoose';

export const MEDIA_KINDS = ['image', 'video'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_STORAGE_DRIVERS = ['local', 'vercel-blob', 's3'] as const;
export type MediaStorageDriver = (typeof MEDIA_STORAGE_DRIVERS)[number];

/**
 * Metadata for an uploaded asset.
 *
 * The bytes live in persistent storage (never the Vercel/Netlify filesystem -
 * see `lib/storage.ts`); this collection holds the public URL, the storage key
 * and the derived metadata that the admin Media page renders.
 */
const MediaAssetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    kind: { type: String, enum: MEDIA_KINDS, required: true, index: true },
    mimeType: { type: String, required: true, maxlength: 120 },
    size: { type: Number, required: true, min: 0 },

    /** Opaque key in the storage provider. Never a user-supplied path. */
    storageKey: { type: String, required: true, index: true },
    driver: { type: String, enum: MEDIA_STORAGE_DRIVERS, required: true },
    url: { type: String, required: true, maxlength: 2048 },

    width: { type: Number, default: null },
    height: { type: Number, default: null },
    alt: { type: String, trim: true, maxlength: 300, default: '' },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ createdAt: -1 });

export type MediaAssetDoc = mongoose.Document & {
  name: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  storageKey: string;
  driver: MediaStorageDriver;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export const MediaAsset: Model<MediaAssetDoc> =
  (mongoose.models.MediaAsset as Model<MediaAssetDoc>) ||
  mongoose.model<MediaAssetDoc>('MediaAsset', MediaAssetSchema);