'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, ApiError } from '@/lib/admin-client';
import { Card } from '@/components/admin/ui';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import type { MediaItem } from '@/backend/lib/media';

/**
 * Upload / delete controls for the Media page.
 *
 * Uses the same card grid, button styles and toast feedback as the rest of the
 * dashboard. The component deliberately calls `router.refresh()` after every
 * mutation so the server component re-reads the database rather than trusting
 * local state.
 */

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminMediaLibrary({ uploaded }: { uploaded: MediaItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  /* Deleting an asset removes the stored object as well as the record, so it is
     confirmed first - the same guard the contact and testimonial screens use. */
  const [confirmDelete, setConfirmDelete] = useState<MediaItem | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append('files', file));

      // Through `adminFetch`, like every other mutation in the dashboard: it adds
      // the CSRF header *without* a JSON content type (so FormData keeps its own
      // boundary), unwraps the response envelope, and bounces an expired session to
      // the login page. A raw `fetch` here reported an expired session as nothing
      // more than "Upload failed." and left the admin on a dead screen.
      const response = await adminFetch<{ assets: Array<{ name: string }> }>('/api/admin/media', {
        method: 'POST',
        body: form,
      });

      toast.success(response.message || 'Upload complete.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    try {
      await adminFetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      toast.success('File deleted.');
      setConfirmDelete(null);
      router.refresh();
    } catch (error) {
      // The row stays on screen and the failure is reported, so a delete that did
      // not happen is never mistaken for one that did.
      toast.error(
        error instanceof ApiError ? error.message : 'Could not delete the file. Please try again.',
      );
    } finally {
      setDeleting(null);
    }
  }

  const images = uploaded.filter((item) => item.kind === 'image');
  const videos = uploaded.filter((item) => item.kind === 'video');

  return (
    <>
      <Card
        title="Upload"
        description="Images up to 8 MB, videos up to 100 MB. Files are checked by their actual content before they are stored."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload size={14} />
              {uploading ? 'Uploadingâ€¦' : 'Choose files'}
            </button>
          </>
        }
      >
        {uploaded.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No uploaded files yet.
          </p>
        ) : (
          <div className="space-y-5">
            {[
              { label: 'Uploaded images', items: images },
              { label: 'Uploaded videos', items: videos },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {group.label} ({group.items.length})
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-stone-200 bg-white"
                      >
                        <div className="flex h-32 items-center justify-center bg-stone-100">
                          {item.kind === 'image' ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.alt || item.name} className="h-full w-full object-contain" />
                          ) : (
                            <video src={item.url} className="h-full w-full object-contain" muted playsInline />
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-stone-800">{item.name}</p>
                            <p className="mt-0.5 truncate text-xs text-stone-500">{item.url}</p>
                            <p className="mt-0.5 text-xs text-stone-400">{formatSize(item.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(item)}
                            disabled={deleting === item.id}
                            aria-label={`Delete ${item.name}`}
                            className="shrink-0 rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this file?"
        description={
          confirmDelete
            ? `${confirmDelete.name || 'This file'} is removed from storage and from the library. Any page still using it will show a broken image.`
            : undefined
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void remove(confirmDelete.id);
        }}
      />
    </>
  );
}
