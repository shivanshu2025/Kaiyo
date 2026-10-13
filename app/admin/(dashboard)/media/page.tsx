import type { Metadata } from 'next';
import AdminMediaLibrary from '@/components/admin/AdminMediaLibrary';
import { getMediaLibrary } from '@/backend/lib/media';
import { Card } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin â€” Media' };

/**
 * Media management.
 *
 * The previous version read `public/` off the server filesystem. On a serverless
 * host that directory is part of the immutable deployment bundle: it cannot be
 * written to, and anything uploaded would vanish on the next deploy. This page
 * now reads the `MediaAsset` collection and the CMS media lists, and the upload
 * and delete actions go through `/api/admin/media`.
 *
 * Server-rendered so the layout and styling are unchanged; the interactive parts
 * are a client island rendered in the same card structure.
 */
export default async function AdminMediaPage() {
  const { uploaded, cmsImages, cmsVideos } = await getMediaLibrary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Media</h1>
        <p className="text-sm text-stone-500">
          Uploaded files and the site assets referenced by your content. Uploads are
          stored in persistent storage, so they survive a redeploy.
        </p>
      </div>

      <AdminMediaLibrary uploaded={uploaded} />

      <Card title={`Site images (${cmsImages.length})`}>
        {cmsImages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No images are referenced by your content yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cmsImages.map((asset) => (
              <li
                key={asset.path}
                className="overflow-hidden rounded-lg border border-stone-200 bg-white"
              >
                <div className="flex h-32 items-center justify-center bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.path} alt={asset.name} className="h-full w-full object-contain" />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-stone-800">{asset.name}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{asset.path}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Site videos (${cmsVideos.length})`}>
        {cmsVideos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No videos are referenced by your content yet.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cmsVideos.map((asset) => (
              <li
                key={asset.path}
                className="overflow-hidden rounded-lg border border-stone-200 bg-white"
              >
                <div className="flex h-32 items-center justify-center bg-stone-100">
                  <video src={asset.path} className="h-full w-full object-contain" muted playsInline />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-stone-800">{asset.name}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-500">{asset.path}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}