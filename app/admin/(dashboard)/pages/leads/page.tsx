'use client';

import { useCallback, useEffect, useState } from 'react';
import { Inbox, Trash2 } from 'lucide-react';
import { adminFetch, ApiError } from '@/lib/admin-client';
import AdminPagination from '@/components/admin/AdminPagination';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, EmptyState, ErrorBlock, inputClass } from '@/components/admin/ui';

/**
 * Solution inquiries.
 *
 * Every solution landing page and every solution detail page renders a form that
 * POSTs to `/api/leads`, so this collection is the commercial inbox of the site.
 * The endpoint (`GET`/`PUT`/`DELETE /api/admin/leads`) has existed and been tested
 * since the backend was moved to MongoDB, but no screen ever read it - inquiries
 * were persisted correctly and then invisible.
 *
 * This page is the reader for it. It talks to the paginated endpoint directly
 * rather than through the composed CMS document, because:
 *  - leads contain personal data and are never part of `CmsData` for the public
 *    projection, so there is nothing to compose;
 *  - `readCmsData()` caps a composed child collection at `MAX_COMPOSED_CHILDREN`,
 *    which silently truncated the list past that point.
 *
 * Nothing about the endpoints changes here: authentication, the `admin` role, the
 * CSRF header on every write and the server-side status enum are all unchanged.
 * The status `<select>` is a control, not a source of truth - the server still
 * rejects any value outside `LEAD_STATUSES` with a 422.
 */

type LeadStatus = 'new' | 'contacted' | 'closed';

type Lead = {
  id: string;
  solutionSlug: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  status: LeadStatus;
  markedSpam: boolean;
  createdAt: string;
};

type ListResponse = {
  items: Lead[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

const PAGE_SIZE = 25;

/** The only statuses the server accepts, mirrored here so the control matches it. */
const STATUSES: Array<{ value: LeadStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: 'bg-stone-100 text-stone-700',
  contacted: 'bg-blue-50 text-blue-700',
  closed: 'bg-green-50 text-green-700',
};

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
        STATUS_BADGE[status] ?? STATUS_BADGE.new
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminLeadsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [slugInput, setSlugInput] = useState('');
  const [solutionSlug, setSolutionSlug] = useState('');

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (status) params.set('status', status);
      if (solutionSlug) params.set('solutionSlug', solutionSlug);

      const response = await adminFetch<ListResponse>(`/api/admin/leads?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      setData(null);
      setLoadError(error instanceof ApiError ? error.message : 'Unable to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [page, status, solutionSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * The slug filter is a free-text box, so it is applied on a short debounce
   * instead of on every keystroke - otherwise each character would be a request.
   * A cleared box returns to "no slug filter" rather than filtering on "".
   */
  useEffect(() => {
    const trimmed = slugInput.trim();
    const timer = setTimeout(() => {
      setSolutionSlug((current) => (current === trimmed ? current : trimmed));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [slugInput]);

  const updateStatus = async (lead: Lead, next: LeadStatus) => {
    if (lead.status === next || busy) return;
    setBusy(true);
    setStatusMessage(null);
    try {
      const response = await adminFetch<{ id: string; status: LeadStatus }>('/api/admin/leads', {
        method: 'PUT',
        json: { id: lead.id, status: next },
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === lead.id ? { ...item, status: response.data.status } : item,
              ),
            }
          : current,
      );
      setStatusMessage({ kind: 'success', text: response.message || 'Inquiry updated.' });
    } catch (error) {
      setStatusMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to update the inquiry.',
      });
      // The optimistic-looking local state was never applied, but re-reading
      // guarantees the table matches the server whatever happened.
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await adminFetch(`/api/admin/leads?id=${encodeURIComponent(pendingDelete.id)}`, {
        method: 'DELETE',
      });
      setPendingDelete(null);
      await load();
    } catch (error) {
      setStatusMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to delete the inquiry.',
      });
    } finally {
      setBusy(false);
    }
  };

  const leads = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Inquiries</h1>
        <p className="mt-1 text-sm text-stone-500">
          Messages sent from the inquiry form on every service page.
        </p>
      </div>

      {statusMessage && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-xs font-medium ${
            statusMessage.kind === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.text}
        </p>
      )}

      <Card
        title="Filters"
        description="Narrow the list by status or by a single service slug."
        actions={
          <Button onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-700">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as LeadStatus | '');
                setPage(1);
              }}
              className={inputClass}
            >
              {STATUSES.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-700">Service slug</span>
            <input
              value={slugInput}
              onChange={(event) => setSlugInput(event.target.value)}
              placeholder="e.g. brand-logos"
              className={inputClass}
            />
          </label>
        </div>
      </Card>

      <Card title={`Inquiries (${pagination.total})`}>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
            <span className="sr-only">Loading inquiries…</span>
          </div>
        ) : loadError || !data ? (
          <ErrorBlock message={loadError || 'Inquiries unavailable'} onRetry={() => void load()} />
        ) : leads.length === 0 ? (
          <EmptyState message="No inquiries match these filters yet." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Phone</th>
                    <th className="py-2 pr-3">Message</th>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-stone-100 align-top">
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700">
                          <Inbox size={11} /> {lead.solutionSlug}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-medium text-stone-800">
                        {lead.name}
                        {lead.company && (
                          <span className="block text-[11px] font-normal text-stone-500">
                            {lead.company}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-stone-600 underline-offset-2 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="py-2 pr-3 text-stone-600">{lead.phone || '—'}</td>
                      <td className="max-w-[260px] truncate py-2 pr-3 text-stone-600">
                        {lead.message}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-stone-500">
                        {new Date(lead.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={lead.status} />
                          <select
                            value={lead.status}
                            disabled={busy}
                            aria-label={`Status for ${lead.name}`}
                            onChange={(event) =>
                              void updateStatus(lead, event.target.value as LeadStatus)
                            }
                            className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] text-stone-700 outline-none transition focus:border-[var(--admin-brand)] disabled:opacity-60"
                          >
                            {STATUSES.filter((option) => option.value !== '').map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-2">
                        <Button variant="danger" onClick={() => setPendingDelete(lead)}>
                          <Trash2 size={13} /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this inquiry?"
        description={
          pendingDelete
            ? `${pendingDelete.name} · ${pendingDelete.solutionSlug}. This permanently removes the message from the store.`
            : undefined
        }
        confirmLabel={busy ? 'Deleting…' : 'Delete'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={remove}
      />
    </div>
  );
}
