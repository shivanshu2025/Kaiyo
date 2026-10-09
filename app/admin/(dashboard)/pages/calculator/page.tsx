'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CalculatorTier, CmsData } from '@/lib/cms-types';

const ICON_OPTIONS = ['FiShare2', 'FiTarget', 'FiAward', 'FiDollarSign', 'FiZap', 'FiMessageCircle', 'FiInfo'];

export default function AdminCalculatorPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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

  const calculator = draft.calculator;
  const setCalculator = (patch: Partial<typeof calculator>) => {
    setDraft({ ...draft, calculator: { ...calculator, ...patch } });
  };

  const setTiers = (tiers: CalculatorTier[]) => setCalculator({ tiers });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Calculator</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage the calculator content and labels. The calculation logic is unchanged.
        </p>
      </div>

      <Card title="Hero content">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Badge text">
            <input
              value={calculator.heroSection.badgeText}
              onChange={(event) =>
                setCalculator({
                  heroSection: { ...calculator.heroSection, badgeText: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Heading">
            <input
              value={calculator.heroSection.heading}
              onChange={(event) =>
                setCalculator({
                  heroSection: { ...calculator.heroSection, heading: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Highlight text">
            <input
              value={calculator.heroSection.highlightText}
              onChange={(event) =>
                setCalculator({
                  heroSection: { ...calculator.heroSection, highlightText: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={calculator.heroSection.description}
              onChange={(event) =>
                setCalculator({
                  heroSection: { ...calculator.heroSection, description: event.target.value },
                })
              }
              className={textareaClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Commission tiers"
        description="Names, percentages and visibility of the calculator roles."
        actions={
          <Button
            onClick={() =>
              setTiers([
                ...calculator.tiers,
                {
                  title: '',
                  percentage: 20,
                  description: '',
                  icon: 'FiShare2',
                  accentColor: '#32483e',
                  displayOrder: calculator.tiers.length,
                  isEnabled: true,
                },
              ])
            }
          >
            + Add tier
          </Button>
        }
      >
        {calculator.tiers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No tiers yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {calculator.tiers.map((tier, index) => (
              <li key={index} className="rounded-lg border border-stone-200 p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_160px_160px_auto]">
                  <Field label="Tier name">
                    <input
                      value={tier.title}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index ? { ...entry, title: event.target.value } : entry
                          )
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Percentage">
                    <input
                      type="number"
                      value={tier.percentage}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index
                              ? { ...entry, percentage: Number(event.target.value) || 0 }
                              : entry
                          )
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Order">
                    <input
                      type="number"
                      value={tier.displayOrder}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index
                              ? { ...entry, displayOrder: Number(event.target.value) || 0 }
                              : entry
                          )
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Icon">
                    <select
                      value={tier.icon}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index ? { ...entry, icon: event.target.value } : entry
                          )
                        )
                      }
                      className={inputClass}
                    >
                      {ICON_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => {
                        const next = [...calculator.tiers];
                        const [item] = next.splice(index, 1);
                        next.splice(index - 1, 0, item);
                        setTiers(next);
                      }}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => {
                        const next = [...calculator.tiers];
                        const [item] = next.splice(index, 1);
                        next.splice(index + 1, 0, item);
                        setTiers(next);
                      }}
                      disabled={index === calculator.tiers.length - 1}
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button variant="danger" onClick={() => setConfirmDelete(index)}>
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_140px]">
                  <Field label="Description">
                    <textarea
                      value={tier.description}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index ? { ...entry, description: event.target.value } : entry
                          )
                        )
                      }
                      className={textareaClass}
                    />
                  </Field>
                  <Field label="Accent colour">
                    <input
                      value={tier.accentColor}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index ? { ...entry, accentColor: event.target.value } : entry
                          )
                        )
                      }
                      className={inputClass}
                    />
                  </Field>
                  <label className="flex items-end gap-2 pb-2 text-xs text-stone-600">
                    <input
                      type="checkbox"
                      checked={tier.isEnabled}
                      onChange={(event) =>
                        setTiers(
                          calculator.tiers.map((entry, i) =>
                            i === index ? { ...entry, isEnabled: event.target.checked } : entry
                          )
                        )
                      }
                    />
                    Enabled
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Project value settings">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum value">
            <input
              type="number"
              value={calculator.projectValue.minValue}
              onChange={(event) =>
                setCalculator({
                  projectValue: {
                    ...calculator.projectValue,
                    minValue: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Maximum value">
            <input
              type="number"
              value={calculator.projectValue.maxValue}
              onChange={(event) =>
                setCalculator({
                  projectValue: {
                    ...calculator.projectValue,
                    maxValue: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Default value">
            <input
              type="number"
              value={calculator.projectValue.defaultValue}
              onChange={(event) =>
                setCalculator({
                  projectValue: {
                    ...calculator.projectValue,
                    defaultValue: Number(event.target.value) || 0,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <input
              value={calculator.projectValue.currency}
              onChange={(event) =>
                setCalculator({
                  projectValue: { ...calculator.projectValue, currency: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Cap label" className="sm:col-span-2">
            <input
              value={calculator.projectValue.capLabel}
              onChange={(event) =>
                setCalculator({
                  projectValue: { ...calculator.projectValue, capLabel: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card title="Result labels">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={calculator.resultCard.heading}
              onChange={(event) =>
                setCalculator({
                  resultCard: { ...calculator.resultCard, heading: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Label">
            <input
              value={calculator.resultCard.label}
              onChange={(event) =>
                setCalculator({
                  resultCard: { ...calculator.resultCard, label: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Empty state message" className="sm:col-span-2">
            <input
              value={calculator.resultCard.emptyStateMessage}
              onChange={(event) =>
                setCalculator({
                  resultCard: { ...calculator.resultCard, emptyStateMessage: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Currency symbol">
            <input
              value={calculator.globalSettings.currencySymbol}
              onChange={(event) =>
                setCalculator({
                  globalSettings: {
                    ...calculator.globalSettings,
                    currencySymbol: event.target.value,
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Number format locale">
            <input
              value={calculator.resultCard.resultFormatting}
              onChange={(event) =>
                setCalculator({
                  resultCard: { ...calculator.resultCard, resultFormatting: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Calculate button label">
            <input
              value={calculator.globalSettings.buttonLabels.calculate}
              onChange={(event) =>
                setCalculator({
                  globalSettings: {
                    ...calculator.globalSettings,
                    buttonLabels: {
                      ...calculator.globalSettings.buttonLabels,
                      calculate: event.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Processing button label">
            <input
              value={calculator.globalSettings.buttonLabels.processing}
              onChange={(event) =>
                setCalculator({
                  globalSettings: {
                    ...calculator.globalSettings,
                    buttonLabels: {
                      ...calculator.globalSettings.buttonLabels,
                      processing: event.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card title="CTA">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading">
            <input
              value={calculator.ctaCard.heading}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, heading: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Primary button label">
            <input
              value={calculator.ctaCard.primaryButton}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, primaryButton: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={calculator.ctaCard.description}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, description: event.target.value },
                })
              }
              className={textareaClass}
            />
          </Field>
          <Field label="Secondary button label">
            <input
              value={calculator.ctaCard.secondaryButton}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, secondaryButton: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp link">
            <input
              value={calculator.ctaCard.whatsappLink}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, whatsappLink: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Join button link">
            <input
              value={calculator.ctaCard.joinButtonLink}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, joinButtonLink: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Background image URL">
            <input
              value={calculator.ctaCard.backgroundImage}
              onChange={(event) =>
                setCalculator({
                  ctaCard: { ...calculator.ctaCard, backgroundImage: event.target.value },
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ calculator: draft.calculator })}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this tier?"
        description="The role is removed from the calculator."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete !== null) {
            setTiers(calculator.tiers.filter((_, i) => i !== confirmDelete));
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}