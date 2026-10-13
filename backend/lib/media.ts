import { db } from './db';
import { MediaAsset } from '@/backend/models/MediaAsset';
import { mergeCmsData, readContentDocument } from './cms-store';

/**
 * Server-side reader for the admin Media page.
 *
 * Combines two sources:
 *  - files uploaded through the dashboard (the `MediaAsset` collection, backed
 *    by persistent storage), and
 *  - the images/videos referenced by the CMS content (the seeded project assets
 *    that ship in `public/`).
 */

export type MediaItem = {
  id: string;
  name: string;
  kind: 'image' | 'video';
  mimeType: string;
  size: number;
  url: string;
  alt: string;
  createdAt: string;
};

export async function getMediaLibrary(): Promise<{
  uploaded: MediaItem[];
  cmsImages: Array<{ path: string; name: string }>;
  cmsVideos: Array<{ path: string; name: string }>;
}> {
  await db();

  const docs = await MediaAsset.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<Array<Record<string, unknown>>>();

  const uploaded: MediaItem[] = docs.map((doc) => ({
    id: doc._id as string,
    name: doc.name as string,
    kind: doc.kind as 'image' | 'video',
    mimeType: doc.mimeType as string,
    size: doc.size as number,
    url: doc.url as string,
    alt: (doc.alt as string) ?? '',
    createdAt: new Date(doc.createdAt as string).toISOString(),
  }));

  // Falls back to the shipped defaults if the CMS document cannot be read, so a
  // database hiccup renders an empty list instead of a 500.
  let cmsImages: Array<{ path: string; name: string }> = [];
  let cmsVideos: Array<{ path: string; name: string }> = [];
  try {
    const cms = mergeCmsData(await readContentDocument());
    cmsImages = cms.media?.images ?? [];
    cmsVideos = cms.media?.videos ?? [];
  } catch (error) {
    console.error('[media] failed to read CMS media lists:', (error as Error)?.message);
  }

  return { uploaded, cmsImages, cmsVideos };
}