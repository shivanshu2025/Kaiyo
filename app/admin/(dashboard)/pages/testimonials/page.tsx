'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsData, Testimonial } from '@/lib/cms-types';

function newTestimonial(): Testimonial {
  return {
    id: `testimonial-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    content: '',
    image: '',
    avatar: '',
    designation: '',
    company: '',
    rating: 5,
    createdAt: new Date().toISOString(),
  };
}

export default function AdminTestimonialsPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const testimonials = draft.testimonials;
  const items = testimonials.items ?? [];

  const setItems = (next: Testimonial[]) => {
    setDraft({ ...draft, testimonials: { ...testimonials, items: next } });
  };

  const update = (id: string, patch: Partial<Testimonial>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Testimonials</h1>
        <p className="mt-1 text-sm text-stone-500">
          Testimonials submitted from the website appear here automatically.
        </p>
      </div>

      <Card title="Page heading">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={testimonials.hero.heading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  testimonials: {
                    ...testimonials,
                    hero: { ...testimonials.hero, heading: event.target.value },
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <input
              value={testimonials.hero.description}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  testimonials: {
                    ...testimonials,
                    hero: { ...testimonials.hero, description: event.target.value },
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card title="Testimonials">
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No testimonials yet.
          </p>
        </Card>
      ) : (
        items.map((item, index) => (
          <Card
            key={item.id}
            title={`Testimonial ${index + 1}`}
            actions={
              <>
                <Button
                  onClick={() => {
                    const to = index - 1;
                    if (to < 0) return;
                    const next = [...items];
                    const [entry] = next.splice(index, 1);
                    next.splice(to, 0, entry);
                    setItems(next);
                  }}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </Button>
                <Button
                  onClick={() => {
                    const to = index + 1;
                    if (to >= items.length) return;
                    const next = [...items];
                    const [entry] = next.splice(index, 1);
                    next.splice(to, 0, entry);
                    setItems(next);
                  }}
                  disabled={index === items.length - 1}
                  title="Move down"
                >
                  ↓
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(item.id)}>
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
                  onChange={(event) => update(item.id, { avatar: event.target.value, image: event.target.value })}
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
                      fill={star <= item.rating ? '#FACC15' : 'transparent'}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-stone-500">{item.rating}/5</span>
              {item.createdAt && (
                <span className="ml-auto text-xs text-stone-400">
                  Added {new Date(item.createdAt).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </Card>
        ))
      )}

      <Card title="Add testimonial">
        <Button variant="primary" onClick={() => setItems([...items, newTestimonial()])}>
          + Add testimonial
        </Button>
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ testimonials: draft.testimonials })}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this testimonial?"
        description="It is removed from the public testimonials page."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            setItems(items.filter((item) => item.id !== confirmDelete));
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}