'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import StringListEditor from '@/components/admin/StringListEditor';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsData, PricingPlan } from '@/lib/cms-types';

function newPlan(index: number): PricingPlan {
  return {
    id: `plan-${Date.now()}-${index}`,
    title: '',
    description: '',
    price: '',
    color: 'bg-orange-500',
    features: [],
  };
}

export default function AdminPricingPage() {
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

  const pricing = draft.pricing;
  const plans = pricing.plans ?? [];

  const setPlans = (next: PricingPlan[]) => {
    setDraft({ ...draft, pricing: { ...pricing, plans: next } });
  };

  const updatePlan = (id: string, patch: Partial<PricingPlan>) => {
    setPlans(plans.map((plan) => (plan.id === id ? { ...plan, ...patch } : plan)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Pricing</h1>
        <p className="mt-1 text-sm text-stone-500">Manage the plans shown on the pricing page.</p>
      </div>

      <Card title="Page heading">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={pricing.hero.heading}
              onChange={(event) =>
                setDraft({ ...draft, pricing: { ...pricing, hero: { ...pricing.hero, heading: event.target.value } } })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <input
              value={pricing.hero.description}
              onChange={(event) =>
                setDraft({ ...draft, pricing: { ...pricing, hero: { ...pricing.hero, description: event.target.value } } })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {plans.length === 0 ? (
        <Card title="Plans">
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No plans yet.
          </p>
        </Card>
      ) : (
        plans.map((plan, index) => (
          <Card
            key={plan.id}
            title={`Plan ${index + 1}`}
            actions={
              <>
                <Button
                  onClick={() => {
                    const to = index - 1;
                    if (to < 0) return;
                    const next = [...plans];
                    const [item] = next.splice(index, 1);
                    next.splice(to, 0, item);
                    setPlans(next);
                  }}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </Button>
                <Button
                  onClick={() => {
                    const to = index + 1;
                    if (to >= plans.length) return;
                    const next = [...plans];
                    const [item] = next.splice(index, 1);
                    next.splice(to, 0, item);
                    setPlans(next);
                  }}
                  disabled={index === plans.length - 1}
                  title="Move down"
                >
                  ↓
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(plan.id)}>
                  Delete plan
                </Button>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  value={plan.title}
                  onChange={(event) => updatePlan(plan.id, { title: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Price">
                <input
                  value={plan.price}
                  onChange={(event) => updatePlan(plan.id, { price: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea
                  value={plan.description}
                  onChange={(event) => updatePlan(plan.id, { description: event.target.value })}
                  className={textareaClass}
                />
              </Field>
              <Field label="Accent colour class" hint="Tailwind class used for the side bar, e.g. bg-orange-500">
                <input
                  value={plan.color ?? ''}
                  onChange={(event) => updatePlan(plan.id, { color: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-4">
              <StringListEditor
                label="Features"
                items={plan.features ?? []}
                addLabel="Add feature"
                placeholder="Feature text"
                onChange={(features) => updatePlan(plan.id, { features })}
              />
            </div>
          </Card>
        ))
      )}

      <Card title="Add a plan">
        <Button variant="primary" onClick={() => setPlans([...plans, newPlan(plans.length)])}>
          + Add new plan
        </Button>
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ pricing: draft.pricing })}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete this plan?"
        description="The plan is removed from the public pricing page."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            setPlans(plans.filter((plan) => plan.id !== confirmDelete));
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}