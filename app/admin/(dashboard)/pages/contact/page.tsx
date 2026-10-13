'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import AdminPagination from '@/components/admin/AdminPagination';
import { adminFetch, ApiError } from '@/lib/admin-client';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type {
  CmsData,
  ContactSubmission,
  ContactSubmissionStatus,
  FaqItem,
} from '@/lib/cms-types';

/**
 * Contact page content + the message inbox.
 *
 * The two halves are deliberately different data paths:
 *
 *  - the heading, description, phone, WhatsApp number and FAQs are CMS content and
 *    are saved through `PUT /api/cms`, exactly as before;
 *  - the submitted messages are personal data held in their own collection and are
 *    read through the paginated `GET /api/contact-submissions`.
 *
 * They used to share one payload: the list came from `data.contact.submissions`,
 * i.e. the CMS document composed by `readCmsData()`, which caps a child
 * collection at `MAX_COMPOSED_CHILDREN`. Past that cap the inbox silently stopped
 * showing messages, and every load of any admin page dragged up to 500 rows of
 * personal data with it. The paginated endpoint existed and was tested; nothing
 * called it.
 */
type Submission = Omit<ContactSubmission, 'status' | 'markedSpam'> & {
  status: ContactSubmissionStatus;
  markedSpam: boolean;
};

type ListResponse = {
  items: Submission[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

const PAGE_SIZE = 25;

const STATUSES: Array<{ value: ContactSubmissionStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
];

type ViewedSubmission = Submission | null;

export default function AdminContactPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [faqDelete, setFaqDelete] = useState<number | null>(null);
  const [submissionDelete, setSubmissionDelete] = useState<string | null>(null);
  const [viewed, setViewed] = useState<ViewedSubmission>(null);
  const [deleting, setDeleting] = useState(false);

  /* Inbox - its own paginated read, independent of the CMS payload. */
  const [list, setList] = useState<ListResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ContactSubmissionStatus | ''>('');
  const [rowBusy, setRowBusy] = useState(false);
  const [inboxMessage, setInboxMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  );

  useEffect(() => {
    setDraft(data);
  }, [data]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter) params.set('status', statusFilter);

      const response = await adminFetch<ListResponse>(`/api/contact-submissions?${params.toString()}`);
      setList(response.data);
    } catch (error) {
      setList(null);
      setListError(
        error instanceof ApiError ? error.message : 'Unable to load form submissions.',
      );
    } finally {
      setListLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const dirty = useMemo(
    () => Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data)),
    [draft, data]
  );

  if (loading) return <LoadingBlock />;
  if (loadError || !data || !draft) {
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={reload} />;
  }

  const contact = draft.contact;
  const submissions = list?.items ?? [];
  const pagination = list?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 };

  const setFaqs = (faqs: FaqItem[]) => {
    setDraft({ ...draft, contact: { ...contact, faqs } });
  };

  /**
   * Marks a message read as soon as it is opened - reading it *is* the action,
   * so it does not need a second click, and `new` is never re-applied to a row
   * that is already `read` or `archived`.
   */
  const markViewed = async (submission: Submission) => {
    setViewed(submission);
    if (submission.status !== 'new' || rowBusy) return;

    setRowBusy(true);
    try {
      await adminFetch('/api/contact-submissions', {
        method: 'PUT',
        json: { id: submission.id, status: 'read' },
      });
      setList((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === submission.id ? { ...item, status: 'read' as ContactSubmissionStatus } : item,
              ),
            }
          : current,
      );
      setViewed({ ...submission, status: 'read' });
    } catch (error) {
      setInboxMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to update the submission.',
      });
    } finally {
      setRowBusy(false);
    }
  };

  const updateStatus = async (submission: Submission, next: ContactSubmissionStatus) => {
    if (submission.status === next || rowBusy) return;
    setRowBusy(true);
    setInboxMessage(null);
    try {
      const response = await adminFetch<{ id: string; status: ContactSubmissionStatus }>(
        '/api/contact-submissions',
        { method: 'PUT', json: { id: submission.id, status: next } },
      );
      setList((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === submission.id ? { ...item, status: response.data.status } : item,
              ),
            }
          : current,
      );
      setInboxMessage({ kind: 'success', text: response.message || 'Submission updated.' });
    } catch (error) {
      setInboxMessage({
        kind: 'error',
        text: error instanceof ApiError ? error.message : 'Unable to update the submission.',
      });
      await loadList();
    } finally {
      setRowBusy(false);
    }
  };

  const deleteSubmission = async () => {
    if (!submissionDelete) return;
    setDeleting(true);
    setInboxMessage(null);
    try {
      const response = await adminFetch(
        `/api/contact-submissions?id=${encodeURIComponent(submissionDelete)}`,
        { method: 'DELETE' },
      );
      setViewed(null);
      setSubmissionDelete(null);
      setInboxMessage({ kind: 'success', text: response.message || 'Submission deleted.' });
      // Re-read the authoritative page from the database.
      await loadList();
    } catch (error) {
      // Previously swallowed: the dialog closed and the row vanished with no
      // explanation, so a failed delete looked exactly like a successful one.
      // The dialog stays open and the reason is shown on the inbox.
      setInboxMessage({
        kind: 'error',
        text:
          error instanceof ApiError ? error.message : 'Unable to delete the submission. Please try again.',
      });
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Contact</h1>
        <p className="mt-1 text-sm text-stone-500">
          Page content, FAQs and messages submitted through the contact form.
        </p>
      </div>

      <Card title="Page content">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={contact.heading}
              onChange={(event) =>
                setDraft({ ...draft, contact: { ...contact, heading: event.target.value } })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <textarea
              value={contact.description}
              onChange={(event) =>
                setDraft({ ...draft, contact: { ...contact, description: event.target.value } })
              }
              className={textareaClass}
            />
          </Field>
          <Field label="Contact information heading">
            <input
              value={contact.contactInfoHeading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  contact: { ...contact, contactInfoHeading: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Contact information description">
            <input
              value={contact.contactInfoDescription}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  contact: { ...contact, contactInfoDescription: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              value={contact.phone}
              onChange={(event) =>
                setDraft({ ...draft, contact: { ...contact, phone: event.target.value } })
              }
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              value={contact.whatsapp}
              onChange={(event) =>
                setDraft({ ...draft, contact: { ...contact, whatsapp: event.target.value } })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="FAQs"
        actions={
          <Button onClick={() => setFaqs([...contact.faqs, { question: '', answer: '' }])}>
            + Add FAQ
          </Button>
        }
      >
        {contact.faqs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No FAQs yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {contact.faqs.map((faq: FaqItem, index) => (
              <li key={index} className="rounded-lg border border-stone-200 p-3">
                <input
                  value={faq.question}
                  placeholder="Question"
                  onChange={(event) =>
                    setFaqs(
                      contact.faqs.map((entry, i) =>
                        i === index ? { ...entry, question: event.target.value } : entry
                      )
                    )
                  }
                  className={inputClass}
                />
                <textarea
                  value={faq.answer}
                  placeholder="Answer"
                  onChange={(event) =>
                    setFaqs(
                      contact.faqs.map((entry, i) =>
                        i === index ? { ...entry, answer: event.target.value } : entry
                      )
                    )
                  }
                  className={`${textareaClass} mt-2`}
                />
                <Button variant="danger" className="mt-2" onClick={() => setFaqDelete(index)}>
                  Delete FAQ
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title={`Form submissions (${pagination.total})`}
        description="Messages sent from the public contact form, stored on the server."
        actions={
          <>
            <select
              value={statusFilter}
              aria-label="Filter submissions by status"
              onChange={(event) => {
                setStatusFilter(event.target.value as ContactSubmissionStatus | '');
                setPage(1);
              }}
              className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 outline-none transition focus:border-[var(--admin-brand)]"
            >
              {STATUSES.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button onClick={() => void loadList()} disabled={listLoading}>
              Refresh
            </Button>
          </>
        }
      >
        {inboxMessage && (
          <p
            role="status"
            className={`mb-3 rounded-lg px-3 py-2 text-xs font-medium ${
              inboxMessage.kind === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {inboxMessage.text}
          </p>
        )}

        {listLoading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
            <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
            <span className="sr-only">Loading form submissionsâ€¦</span>
          </div>
        ) : listError || !list ? (
          <ErrorBlock
            message={listError || 'Form submissions unavailable'}
            onRetry={() => void loadList()}
          />
        ) : submissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            {statusFilter ? 'No submissions with this status.' : 'No submissions yet.'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
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
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-stone-100 align-top">
                      <td className="py-2 pr-3 font-medium text-stone-800">{submission.name}</td>
                      <td className="py-2 pr-3 text-stone-600">{submission.email}</td>
                      <td className="py-2 pr-3 text-stone-600">{submission.phone || 'â€”'}</td>
                      <td className="max-w-[240px] truncate py-2 pr-3 text-stone-600">
                        {submission.message}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-stone-500">
                        {new Date(submission.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={submission.status}
                          disabled={rowBusy}
                          aria-label={`Status for ${submission.name}`}
                          onChange={(event) =>
                            void updateStatus(submission, event.target.value as ContactSubmissionStatus)
                          }
                          className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] font-semibold capitalize text-stone-700 outline-none transition focus:border-[var(--admin-brand)] disabled:opacity-60"
                        >
                          {STATUSES.filter((option) => option.value !== '').map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap py-2">
                        <span className="inline-flex gap-1">
                          <Button onClick={() => void markViewed(submission)}>
                            <Eye size={13} /> View
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => {
                              // Only one dialog may be open: a previously opened
                              // details panel is closed here too.
                              setViewed(null);
                              setSubmissionDelete(submission.id);
                            }}
                          >

                            <Trash2 size={13} /> Delete
                          </Button>
                        </span>
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
              busy={rowBusy}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() =>
          // `submissions` is stripped: the inbox is read from its own paginated
          // endpoint now, and re-sending up to `MAX_COMPOSED_CHILDREN` rows of
          // personal data on every content save would be pure waste. The server
          // drops the key regardless - `persistSections` never writes it.
          save({ contact: { ...draft.contact, submissions: [] } })
        }
      />

      <ConfirmDialog
        open={faqDelete !== null}
        title="Delete this FAQ?"
        description="It is removed from the public contact page."
        onCancel={() => setFaqDelete(null)}
        onConfirm={() => {
          if (faqDelete !== null) {
            setFaqs(contact.faqs.filter((_, i) => i !== faqDelete));
          }
          setFaqDelete(null);
        }}
      />

      <ConfirmDialog
        open={viewed !== null}
        title="Submission details"
        confirmLabel="Delete submission"
        onCancel={() => setViewed(null)}
        onConfirm={() => {
          if (!viewed) return;
          // Closing the details dialog first: both dialogs render at z-[100], so
          // leaving `viewed` set stacked the confirm on top of the panel it was
          // launched from - two overlays, two competing scrims.
          setSubmissionDelete(viewed.id);
          setViewed(null);
        }}
      >

        {viewed && (
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-stone-500">Name</dt>
              <dd className="text-stone-800">{viewed.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-stone-500">Email</dt>
              <dd className="text-stone-800">{viewed.email}</dd>
            </div>
            {viewed.phone && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-stone-500">Phone</dt>
                <dd className="text-stone-800">{viewed.phone}</dd>
              </div>
            )}
            {viewed.interest && (
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 text-stone-500">Interest</dt>
                <dd className="text-stone-800">{viewed.interest}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-stone-500">Date</dt>
              <dd className="text-stone-800">
                {new Date(viewed.createdAt).toLocaleString('en-IN')}
              </dd>
            </div>
            <div className="pt-2">
              <dt className="text-stone-500">Message</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded bg-stone-50 p-2 text-stone-800">
                {viewed.message}
              </dd>
            </div>
          </dl>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={submissionDelete !== null}
        title="Delete this submission?"
        description="This permanently removes the message from the store."
        confirmLabel={deleting ? 'Deletingâ€¦' : 'Delete'}
        onCancel={() => setSubmissionDelete(null)}
        onConfirm={deleteSubmission}
      />
    </div>
  );
}
