'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import { adminFetch, ApiError } from '@/lib/admin-client';
import AdminPagination from '@/components/admin/AdminPagination';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, inputClass, textareaClass } from '@/components/admin/ui';

/**
 * Testimonials: page copy plus the moderation queue.
 *
 * ## How records are written now (and why it changed)
 *
 * This screen used to save by sending the whole `testimonials.items` array through
 * `PUT /api/cms`. That is a *replacement* of the collection: the server treated
 * the submitted array as the complete truth, so every testimonial missing from it
 * was deleted. It was only ever safe while the dashboard happened to hold every
 * record - and it does not, because `readCmsData()` composes at most
 * `MAX_COMPOSED_CHILDREN` rows. A single save past that point destroyed real
 * customer testimonials.
 *
 * So testimonial *records* no longer travel through the CMS document at all. Each
 * one is addressed on its own:
 *
 *   create   -> POST   /api/admin/testimonials
 *   edit     -> PUT    /api/testimonials      (one `id`, only the fields sent)
 *   publish  -> PUT    /api/testimonials      (`status: 'published'`)
 *   unpublish-> PUT    /api/testimonials      (`status: 'pending'`)
 *   delete   -> DELETE /api/testimonials?id=
 *
 * and the list is read from the paginated `GET /api/testimonials` rather than from
 * the composed CMS payload. A save can therefore only ever touch the records that
 * are actually on screen. The page heading still goes through `PUT /api/cms`,
 * because that genuinely is CMS content - and the patch sends `hero` only, never
 * `items`, so the collection sync is not triggered at all.
 *
 * The ↑/↓ controls renumber the visible page and `Save changes` writes those ranks
 * back through the same per-record `PUT`, so the order survives a reload.
 *
 * The endpoints, their authentication, the `admin` role check, the CSRF header and
 * the server-side validation are all unchanged.
 */

type TestimonialStatus = 'published' | 'pending';

type TestimonialRecord = {
  id: string;
  name: string;
  content: string;
  rating: number;
  designation?: string;
  company?: string;
  avatar?: string;
  image?: string;
  status: TestimonialStatus;
  displayOrder: number;
  createdAt: string;
};

type ListResponse = {
  items: TestimonialRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

const PAGE_SIZE = 25;

/** Only the fields a record edit may carry - mirrors `testimonialUpdateSchema`. */
type EditableFields = Partial<
  Pick<TestimonialRecord, 'name' | 'content' | 'rating' | 'designation' | 'company' | 'avatar' | 'image'>
>;

function StatusBadge({ status }: { status: TestimonialStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
        status === 'published' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {status === 'published' ? 'Published' : 'Pending'}
    </span>
  );
}

export default function AdminTestimonialsPage() {
  /* Page copy - unchanged CMS path. */
  const { data, loading, loadError, reload } = useCmsAdmin();
  const [hero, setHero] = useState<{ heading: string; description: string } | null>(null);
  const [savedHero, setSavedHero] = useState<{ heading: string; description: string } | null>(null);

  /* Records - paginated, per-record writes. */
  const [list, setList] = useState<ListResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TestimonialStatus | ''>('');

  const [items, setItems] = useState<TestimonialRecord[]>([]);
  const [savedItems, setSavedItems] = useState<TestimonialRecord[]>([]);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TestimonialRecord | null>(null);

  useEffect(() => {
    const section = data?.testimonials?.hero;
    if (!section) return;
    setHero({ heading: section.heading, description: section.description });
    setSavedHero({ heading: section.heading, description: section.description });
  }, [data]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filter) params.set('status', filter);

      const response = await adminFetch<ListResponse>(`/api/testimonials?${params.toString()}`);
      setList(response.data);
      setItems(response.data.items);
      setSavedItems(response.data.items);
    } catch (error) {
      setList(null);
      setItems([]);
      setSavedItems([]);
      setListError(error instanceof ApiError ? error.message : 'Unable to load testimonials.');
    } finally {
      setListLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  /** The last server snapshot of one record, used to decide what actually changed. */
  const baselineFor = (id: string): EditableFields => {
    const found = savedItems.find((entry) => entry.id === id);
    if (!found) return {};
    return {
      name: found.name,
      content: found.content,
      rating: found.rating,
      designation: found.designation,
      company: found.company,
      avatar: found.avatar,
      image: found.image,
    };
  };

  /** Only the fields that actually differ, so a save never mass-assigns. */
  const changedFields = (item: TestimonialRecord): EditableFields => {
    const baseline = baselineFor(item.id);
    const patch: EditableFields = {};
    for (const key of Object.keys(baseline) as Array<keyof EditableFields>) {
      if ((item[key] ?? '') !== (baseline[key] ?? '')) {
        patch[key] = item[key] as never;
      }
    }
    return patch;
  };

  const update = (id: string, patch: Partial<TestimonialRecord>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const dirtyIds = useMemo(
    () => items.filter((item) => Object.keys(changedFields(item)).length > 0).map((item) => item.id),
    // `changedFields` reads `savedItems`, which is part of the dependency set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, savedItems],
  );

  const heroDirty = Boolean(
    hero && savedHero && (hero.heading !== savedHero.heading || hero.description !== savedHero.description),
  );

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [entry] = next.splice(index, 1);
    next.splice(to, 0, entry);
    // Renumber the whole visible page so the persisted order matches what the
    // admin just saw. The page's offset is included: `displayOrder` is the
    // collection-wide rank, so renumbering page 2 from zero would push those rows
    // in front of page 1. Records outside the page keep their stored order.
    const offset = (pagination.page - 1) * PAGE_SIZE;
    setItems(next.map((item, position) => ({ ...item, displayOrder: offset + position })));
  };

  /**
   * Rows whose rank changed. `displayOrder` is not part of `changedFields` - it is
   * not a field edit - so without this the ↑/↓ controls only reordered the screen
   * and the order was lost on the next read.
   */
  const reorderedIds = useMemo(
    () =>
      items
        .filter((item) => {
          const baseline = savedItems.find((entry) => entry.id === item.id);
          return baseline ? baseline.displayOrder !== item.displayOrder : false;
        })
        .map((item) => item.id),
    [items, savedItems],
  );

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);

    try {
      if (heroDirty && hero) {
        // `hero` only - deliberately no `items`, so the collection is never synced
        // from this screen.
        await adminFetch('/api/cms', {
          method: 'PUT',
          json: { testimonials: { hero } },
        });
      }

      for (const id of dirtyIds) {
        const item = items.find((entry) => entry.id === id);
        if (!item) continue;
        const patch = changedFields(item);
        if (Object.keys(patch).length === 0) continue;
        await adminFetch('/api/testimonials', { method: 'PUT', json: { id, ...patch } });
      }

      // Order is persisted per record through the same endpoint, which accepts
      // `displayOrder`. Only rows that actually moved are sent, and each request
      // carries nothing else, so a reorder can never rewrite a field.
      for (const id of reorderedIds) {
        const item = items.find((entry) => entry.id === id);
        if (!item) continue;
        await adminFetch('/api/testimonials', {
          method: 'PUT',
          json: { id, displayOrder: item.displayOrder },
        });
      }

      const changed = dirtyIds.length + reorderedIds.length;

      setMessage({
        kind: 'success',
        text: changed === 0 && !heroDirty ? 'No changes to save.' : 'Changes saved.',
      });
      await Promise.all([reload(), loadList()]);
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to save changes.',
      });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (item: TestimonialRecord, status: TestimonialStatus) => {
    if (busy || item.status === status) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminFetch('/api/testimonials', { method: 'PUT', json: { id: item.id, status } });
      setMessage({
        kind: 'success',
        text: status === 'published' ? 'Testimonial published.' : 'Testimonial unpublished.',
      });
      await loadList();
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to update the testimonial.',
      });
    } finally {
      setBusy(false);
    }
  };

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await adminFetch<{ id: string }>('/api/admin/testimonials', {
        method: 'POST',
        json: { name: 'New testimonial', content: '', rating: 5 },
      });
      setMessage({ kind: 'success', text: response.message || 'Testimonial created.' });
      // A new row lands at the end of the collection, so jump to the last page.
      const lastPage = Math.max(1, Math.ceil(((list?.pagination.total ?? 0) + 1) / PAGE_SIZE));
      setPage(lastPage);
      if (lastPage === page) await loadList();
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to create a testimonial.',
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await adminFetch(`/api/testimonials?id=${encodeURIComponent(confirmDelete.id)}`, {
        method: 'DELETE',
      });
      setConfirmDelete(null);
      setMessage({ kind: 'success', text: 'Testimonial deleted.' });
      await loadList();
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to delete the testimonial.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (loadError || !data) {
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={reload} />;
  }

  const pagination = list?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 };
  const pendingCount = (list?.items ?? []).filter((item) => item.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Testimonials</h1>
        <p className="mt-1 text-sm text-stone-500">
          Testimonials submitted from the website arrive here as{' '}
          <span className="font-semibold text-amber-700">Pending</span> and stay hidden from the
          public page until you publish them.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            message.kind === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <Card title="Page heading">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={hero?.heading ?? ''}
              onChange={(event) => setHero({ ...(hero ?? { description: '' }), heading: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <input
              value={hero?.description ?? ''}
              onChange={(event) => setHero({ ...(hero ?? { heading: '' }), description: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title={`Testimonials (${pagination.total})`}
        description={
          pendingCount > 0
            ? `${pendingCount} on this page ${pendingCount === 1 ? 'is' : 'are'} waiting for approval.`
            : undefined
        }
        actions={
          <>
            <select
              value={filter}
              aria-label="Filter by status"
              onChange={(event) => {
                setFilter(event.target.value as TestimonialStatus | '');
                setPage(1);
              }}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 outline-none transition focus:border-[var(--admin-brand)]"
            >
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
            </select>
            <Button onClick={() => void loadList()} disabled={listLoading}>
              Refresh
            </Button>
            <Button variant="primary" onClick={create} disabled={busy}>
              + Add testimonial
            </Button>
          </>
        }
      >
        {listLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
            <span className="sr-only">Loading testimonials…</span>
          </div>
        ) : listError || !list ? (
          <ErrorBlock message={listError || 'Testimonials unavailable'} onRetry={() => void loadList()} />
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            {filter ? 'No testimonials with this status.' : 'No testimonials yet.'}
          </p>
        ) : (
          <>
            {items.map((item, index) => {
              const changed =
                Object.keys(changedFields(item)).length > 0 ||
                reorderedIds.includes(item.id);

              return (
                <Card
                  key={item.id}
                  title={`Testimonial ${index + 1}`}
                  description={
                    item.createdAt
                      ? `Added ${new Date(item.createdAt).toLocaleDateString('en-IN')}`
                      : undefined
                  }
                  actions={
                    <>
                      <StatusBadge status={item.status} />
                      {item.status === 'published' ? (
                        <Button onClick={() => void setStatus(item, 'pending')} disabled={busy}>
                          Unpublish
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => void setStatus(item, 'published')} disabled={busy}>
                          Publish
                        </Button>
                      )}
                      <Button onClick={() => move(index, -1)} disabled={busy || index === 0} title="Move up">
                        ↑
                      </Button>
                      <Button
                        onClick={() => move(index, 1)}
                        disabled={busy || index === items.length - 1}
                        title="Move down"
                      >
                        ↓
                      </Button>
                      <Button variant="danger" onClick={() => setConfirmDelete(item)} disabled={busy}>
                        Delete
                      </Button>
                    </>
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={item.name}
                        onChange={(event) => update(item.id, { name: event.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        value={item.designation ?? ''}
                        onChange={(event) => update(item.id, { designation: event.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Company">
                      <input
                        value={item.company ?? ''}
                        onChange={(event) => update(item.id, { company: event.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Image URL / avatar">
                      <input
                        value={item.avatar || item.image || ''}
                        onChange={(event) =>
                          update(item.id, {
                            avatar: event.target.value,
                            image: event.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Content" className="sm:col-span-2">
                      <textarea
                        value={item.content}
                        onChange={(event) => update(item.id, { content: event.target.value })}
                        className={textareaClass}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs font-medium text-stone-700">Rating</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => update(item.id, { rating: star })}
                          aria-label={`Set rating to ${star}`}
                          className="p-0.5"
                        >
                          <Star
                            size={20}
                            className={star <= item.rating ? 'text-yellow-400' : 'text-stone-300'}
                            fill={star <= item.rating ? 'var(--admin-swatch)' : 'transparent'}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-stone-500">{item.rating}/5</span>
                    {changed && (
                      <span className="ml-auto text-[11px] font-semibold text-amber-700">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}

            <AdminPagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              busy={busy}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      {/* One bar for the whole screen: the heading through the CMS patch, each
          edited record through its own endpoint. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
        <button
          type="button"
          onClick={save}
          disabled={busy || (!heroDirty && dirtyIds.length === 0 && reorderedIds.length === 0)}
          className="rounded-lg bg-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {!heroDirty && dirtyIds.length === 0 && reorderedIds.length === 0 && (
          <span className="text-xs text-stone-500">No unsaved changes</span>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this testimonial?"
        description={
          confirmDelete
            ? `${confirmDelete.name || 'This testimonial'} will be removed from the public testimonials page.`
            : undefined
        }
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
