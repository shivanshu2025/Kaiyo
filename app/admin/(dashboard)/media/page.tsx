import { promises as fs } from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { Card } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin — Media' };

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

type Asset = { name: string; path: string; size: number };

async function readFolder(folder: 'images' | 'video', extensions: string[]): Promise<Asset[]> {
  const directory = path.join(process.cwd(), 'public', folder);

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return Promise.all(
      files.map(async (name) => {
        const stats = await fs.stat(path.join(directory, name));
        return { name, path: `/${folder}/${name}`, size: stats.size };
      })
    );
  } catch {
    return [];
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AssetGrid({ assets, kind }: { assets: Asset[]; kind: 'image' | 'video' }) {
  if (assets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
        No {kind}s found in /public.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <li key={asset.path} className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div className="flex h-32 items-center justify-center bg-stone-100">
            {kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.path} alt={asset.name} className="h-full w-full object-contain" />
            ) : (
              <video src={asset.path} className="h-full w-full object-contain" muted playsInline />
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-medium text-stone-800">{asset.name}</p>
            <p className="mt-0.5 truncate text-xs text-stone-500">{asset.path}</p>
            <p className="mt-0.5 text-xs text-stone-400">{formatSize(asset.size)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminMediaPage() {
  const [images, videos] = await Promise.all([
    readFolder('images', IMAGE_EXTENSIONS),
    readFolder('video', VIDEO_EXTENSIONS),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Media</h1>
        <p className="mt-1 text-sm text-stone-500">
          Existing project assets from /public. These files are used by the live pages — this page
          only lists them.
        </p>
      </div>

      <Card title={`Images (${images.length})`}>
        <AssetGrid assets={images} kind="image" />
      </Card>

      <Card title={`Videos (${videos.length})`}>
        <AssetGrid assets={videos} kind="video" />
      </Card>
    </div>
  );
}