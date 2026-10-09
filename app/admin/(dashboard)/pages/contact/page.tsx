'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsData, ContactSubmission, FaqItem } from '@/lib/cms-types';

type ViewedSubmission = ContactSubmission | null;

export default function AdminContactPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [faqDelete, setFaqDelete] = useState<number | null>(null);
  const [submissionDelete, setSubmissionDelete] = useState<string | null>(null);
  const [viewed, setViewed] = useState<ViewedSubmission>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(data);
  }, [data]);

  const dirty = useMemo(
    () => Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data)),
    [draft, data]
  );

  if (loading) return <LoadingBlock />;
  if (loadError || !data || !draft) {
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={reload} />;
  }

  const contact = draft.contact;
  const submissions = contact.submissions ?? [];

  const setFaqs = (faqs: FaqItem[]) => {
    setDraft({ ...draft, contact: { ...contact, faqs } });
  };

  const deleteSubmission = async () => {
    if (!submissionDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/contact-submissions?id=${encodeURIComponent(submissionDelete)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setDraft(draft);
        return;
      }
      setViewed(null);
      setSubmissionDelete(null);
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
        title="Form submissions"
        description="Messages sent from the public contact form, stored on the server."
      >
        {submissions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No submissions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Message</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-stone-100 align-top">
                    <td className="py-2 pr-3 font-medium text-stone-800">{submission.name}</td>
                    <td className="py-2 pr-3 text-stone-600">{submission.email}</td>
                    <td className="py-2 pr-3 text-stone-600">{submission.phone || '—'}</td>
                    <td className="max-w-[240px] truncate py-2 pr-3 text-stone-600">
                      {submission.message}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3 text-stone-500">
                      {new Date(submission.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap py-2">
                      <span className="inline-flex gap-1">
                        <Button onClick={() => setViewed(submission)}>
                          <Eye size={13} /> View
                        </Button>
                        <Button variant="danger" onClick={() => setSubmissionDelete(submission.id)}>
                          <Trash2 size={13} /> Delete
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ contact: { ...draft.contact, submissions: draft.contact.submissions } })}
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
          if (viewed) setSubmissionDelete(viewed.id);
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
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onCancel={() => setSubmissionDelete(null)}
        onConfirm={deleteSubmission}
      />
    </div>
  );
}