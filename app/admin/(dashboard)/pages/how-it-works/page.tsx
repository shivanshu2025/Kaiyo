'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import StringListEditor from '@/components/admin/StringListEditor';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsData, FaqItem, PartnerTier, WhyChooseUsItem, WorkflowStep } from '@/lib/cms-types';

export default function AdminHowItWorksPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'tier'; index: number }
    | { kind: 'step'; index: number }
    | { kind: 'why'; index: number }
    | { kind: 'faq'; index: number }
    | null
  >(null);

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

  const page = draft.howItWorks;
  const setPage = (patch: Partial<typeof page>) => {
    setDraft({ ...draft, howItWorks: { ...page, ...patch } });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'tier') {
      setPage({ tiers: page.tiers.filter((_, i) => i !== deleteTarget.index) });
    } else if (deleteTarget.kind === 'step') {
      setPage({ workflowSteps: page.workflowSteps.filter((_, i) => i !== deleteTarget.index) });
    } else if (deleteTarget.kind === 'why') {
      setPage({ whyChooseUs: page.whyChooseUs.filter((_, i) => i !== deleteTarget.index) });
    } else {
      setPage({ faqs: page.faqs.filter((_, i) => i !== deleteTarget.index) });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">How It Works</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage the partner / commission page content.
        </p>
      </div>

      <Card title="Hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              value={page.heroTitle}
              onChange={(event) => setPage({ heroTitle: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Image URL">
            <input
              value={page.heroImage}
              onChange={(event) => setPage({ heroImage: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={page.heroDescription}
              onChange={(event) => setPage({ heroDescription: event.target.value })}
              className={textareaClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Earning tiers"
        actions={
          <Button
            onClick={() =>
              setPage({
                tiers: [
                  ...page.tiers,
                  {
                    name: '',
                    percentage: '20%',
                    description: '',
                    features: [],
                    color: 'bg-blue-500',
                  },
                ],
              })
            }
          >
            + Add tier
          </Button>
        }
      >
        {page.tiers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No tiers yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {page.tiers.map((tier: PartnerTier, index) => (
              <li key={index} className="rounded-lg border border-stone-200 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_160px_auto]">
                  <Field label="Name">
                    <input
                      value={tier.name}
                      onChange={(event) =>
                        setPage({
                          tiers: page.tiers.map((entry, i) =>
                            i === index ? { ...entry, name: event.target.value } : entry
                          ),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Percentage">
                    <input
                      value={tier.percentage}
                      onChange={(event) =>
                        setPage({
                          tiers: page.tiers.map((entry, i) =>
                            i === index ? { ...entry, percentage: event.target.value } : entry
                          ),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Colour class">
                    <input
                      value={tier.color ?? ''}
                      onChange={(event) =>
                        setPage({
                          tiers: page.tiers.map((entry, i) =>
                            i === index ? { ...entry, color: event.target.value } : entry
                          ),
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button variant="danger" onClick={() => setDeleteTarget({ kind: 'tier', index })}>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <Field label="Description">
                    <textarea
                      value={tier.description}
                      onChange={(event) =>
                        setPage({
                          tiers: page.tiers.map((entry, i) =>
                            i === index ? { ...entry, description: event.target.value } : entry
                          ),
                        })
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <StringListEditor
                    label="Features"
                    items={tier.features ?? []}
                    addLabel="Add feature"
                    onChange={(features) =>
                      setPage({
                        tiers: page.tiers.map((entry, i) =>
                          i === index ? { ...entry, features } : entry
                        ),
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Your Role">
          <StringListEditor
            label=""
            items={page.yourRole}
            addLabel="Add item"
            onChange={(yourRole) => setPage({ yourRole })}
          />
        </Card>
        <Card title="Our Role">
          <StringListEditor
            label=""
            items={page.ourRole}
            addLabel="Add item"
            onChange={(ourRole) => setPage({ ourRole })}
          />
        </Card>
      </div>

      <Card
        title="3-step process"
        actions={
          <Button
            onClick={() =>
              setPage({
                workflowSteps: [
                  ...page.workflowSteps,
                  {
                    number: String(page.workflowSteps.length + 1).padStart(2, '0'),
                    title: '',
                    description: '',
                  },
                ],
              })
            }
          >
            + Add step
          </Button>
        }
      >
        {page.workflowSteps.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No steps yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {page.workflowSteps.map((step: WorkflowStep, index) => (
              <li key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[80px_180px_1fr_auto]">
                <input
                  value={step.number}
                  placeholder="01"
                  onChange={(event) =>
                    setPage({
                      workflowSteps: page.workflowSteps.map((entry, i) =>
                        i === index ? { ...entry, number: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={step.title}
                  placeholder="Title"
                  onChange={(event) =>
                    setPage({
                      workflowSteps: page.workflowSteps.map((entry, i) =>
                        i === index ? { ...entry, title: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={step.description}
                  placeholder="Description"
                  onChange={(event) =>
                    setPage({
                      workflowSteps: page.workflowSteps.map((entry, i) =>
                        i === index ? { ...entry, description: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <Button variant="danger" onClick={() => setDeleteTarget({ kind: 'step', index })}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Calculate Your Potential">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Heading">
            <input
              value={page.calculator.heading}
              onChange={(event) =>
                setPage({
                  calculator: { ...page.calculator, heading: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description">
            <input
              value={page.calculator.description}
              onChange={(event) =>
                setPage({
                  calculator: { ...page.calculator, description: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Button text">
            <input
              value={page.calculator.buttonText}
              onChange={(event) =>
                setPage({
                  calculator: { ...page.calculator, buttonText: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Button link">
            <input
              value={page.calculator.buttonLink}
              onChange={(event) =>
                setPage({
                  calculator: { ...page.calculator, buttonLink: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Example project value">
            <input
              type="number"
              value={page.calculator.defaultProjectValue}
              onChange={(event) =>
                setPage({
                  calculator: {
                    ...page.calculator,
                    defaultProjectValue: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Example role">
            <input
              value={page.calculator.defaultRole}
              onChange={(event) =>
                setPage({
                  calculator: { ...page.calculator, defaultRole: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Example commission %">
            <input
              type="number"
              value={page.calculator.defaultPercentage}
              onChange={(event) =>
                setPage({
                  calculator: {
                    ...page.calculator,
                    defaultPercentage: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Example earnings">
            <input
              type="number"
              value={page.calculator.defaultEarnings}
              onChange={(event) =>
                setPage({
                  calculator: {
                    ...page.calculator,
                    defaultEarnings: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Why choose us"
        actions={
          <Button
            onClick={() =>
              setPage({
                whyChooseUs: [...page.whyChooseUs, { icon: 'FiDollarSign', title: '', description: '' }],
              })
            }
          >
            + Add item
          </Button>
        }
      >
        {page.whyChooseUs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No items yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {page.whyChooseUs.map((item: WhyChooseUsItem, index) => (
              <li key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[140px_200px_1fr_auto]">
                <input
                  value={item.icon}
                  placeholder="Icon key"
                  onChange={(event) =>
                    setPage({
                      whyChooseUs: page.whyChooseUs.map((entry, i) =>
                        i === index ? { ...entry, icon: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={item.title}
                  placeholder="Title"
                  onChange={(event) =>
                    setPage({
                      whyChooseUs: page.whyChooseUs.map((entry, i) =>
                        i === index ? { ...entry, title: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={item.description}
                  placeholder="Description"
                  onChange={(event) =>
                    setPage({
                      whyChooseUs: page.whyChooseUs.map((entry, i) =>
                        i === index ? { ...entry, description: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <Button variant="danger" onClick={() => setDeleteTarget({ kind: 'why', index })}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="FAQs"
        actions={
          <Button
            onClick={() => setPage({ faqs: [...page.faqs, { question: '', answer: '' }] })}
          >
            + Add FAQ
          </Button>
        }
      >
        {page.faqs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No FAQs yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {page.faqs.map((faq: FaqItem, index) => (
              <li key={index} className="rounded-lg border border-stone-200 p-3">
                <input
                  value={faq.question}
                  placeholder="Question"
                  onChange={(event) =>
                    setPage({
                      faqs: page.faqs.map((entry, i) =>
                        i === index ? { ...entry, question: event.target.value } : entry
                      ),
                    })
                  }
                  className={inputClass}
                />
                <textarea
                  value={faq.answer}
                  placeholder="Answer"
                  onChange={(event) =>
                    setPage({
                      faqs: page.faqs.map((entry, i) =>
                        i === index ? { ...entry, answer: event.target.value } : entry
                      ),
                    })
                  }
                  className={`${textareaClass} mt-2`}
                />
                <Button
                  variant="danger"
                  className="mt-2"
                  onClick={() => setDeleteTarget({ kind: 'faq', index })}
                >
                  Delete FAQ
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Final CTA">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={page.ctaTitle}
              onChange={(event) => setPage({ ctaTitle: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp link">
            <input
              value={page.ctaWhatsApp}
              onChange={(event) => setPage({ ctaWhatsApp: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={page.ctaDescription}
              onChange={(event) => setPage({ ctaDescription: event.target.value })}
              className={textareaClass}
            />
          </Field>
          <Field label="Primary button text">
            <input
              value={page.ctaPrimaryText}
              onChange={(event) => setPage({ ctaPrimaryText: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Secondary button text">
            <input
              value={page.ctaSecondaryText}
              onChange={(event) => setPage({ ctaSecondaryText: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Secondary button link">
            <input
              value={page.ctaSecondaryLink}
              onChange={(event) => setPage({ ctaSecondaryLink: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Background image URL">
            <input
              value={page.ctaBackgroundImage}
              onChange={(event) => setPage({ ctaBackgroundImage: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ howItWorks: draft.howItWorks })}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this item?"
        description="It is removed from the public How It Works page."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}