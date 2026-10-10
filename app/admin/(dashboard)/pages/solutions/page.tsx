'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsCard, CmsData, CmsSolutionSection } from '@/lib/cms-types';

type PendingDelete = { sectionIndex: number; cardIndex: number } | null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normaliseSections(data: any): CmsSolutionSection[] {
  const sections = data?.sections;
  if (!Array.isArray(sections)) return [];
  return sections.map((section: any) => ({
    title: typeof section?.title === 'string' ? section.title : '',
    cards: Array.isArray(section?.cards) ? section.cards : [],
  }));
}

export default function AdminSolutionsPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

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

  const solutions = draft.solutions ?? [];
  const activeSolution = solutions.find((solution) => solution.slug === selectedSlug) ?? solutions[0];

  const categories = Array.from(new Set(solutions.map((solution) => solution.category).filter(Boolean)));

  const updateSolution = (slug: string, nextData: any) => {
    setDraft({
      ...draft,
      solutions: draft.solutions.map((solution) =>
        solution.slug === slug ? { ...solution, data: nextData } : solution
      ),
    });
  };

  const toggleExpanded = (slug: string) => {
    setExpanded((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    );
  };

  if (!activeSolution) {
    return <ErrorBlock message="No solutions found in the content store." />;
  }

  const activeData = activeSolution.data ?? {};
  const sections = normaliseSections(activeData);

  const writeSections = (nextSections: CmsSolutionSection[]) => {
    updateSolution(activeSolution.slug, { ...activeData, sections: nextSections });
  };

  const openCount = (slug: string) => {
    const solution = solutions.find((entry) => entry.slug === slug);
    return normaliseSections(solution?.data).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Solutions</h1>
        <p className="mt-1 text-sm text-stone-500">
          {solutions.length} solutions across {categories.length} categories. Cards, rows and their
          order are kept per solution.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Solution picker */}
        <Card title="Solutions">
          {categories.map((category) => (
            <div key={category} className="mb-4 last:mb-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
                {category}
              </p>
              <ul className="space-y-1">
                {solutions
                  .filter((solution) => solution.category === category)
                  .map((solution) => {
                    const active = solution.slug === activeSolution.slug;
                    return (
                      <li key={solution.slug}>
                        <button
                          type="button"
                          onClick={() => setSelectedSlug(solution.slug)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                            active
                              ? 'bg-[var(--admin-brand)] font-semibold text-white'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {solution.label}
                          <span
                            className={`ml-1 text-[11px] ${active ? 'text-white/70' : 'text-stone-400'}`}
                          >
                            · {openCount(solution.slug)} rows
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </Card>

        {/* Rows and cards */}
        <div className="space-y-4">
          <Card
            title={`${activeSolution.label} — cards`}
            description={`Public page: /solutions/${activeSolution.slug}`}
            actions={
              <>
                <Button
                  onClick={() =>
                    writeSections([
                      ...sections,
                      { title: `Row ${sections.length + 1}`, cards: [] },
                    ])
                  }
                >
                  + Add New Row
                </Button>
                <Button
                  variant="primary"
                  onClick={() => toggleExpanded(activeSolution.slug)}
                >
                  {expanded.includes(activeSolution.slug) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  {expanded.includes(activeSolution.slug) ? 'Collapse' : 'Expand'}
                </Button>
              </>
            }
          >
            {sections.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
                This solution has no rows yet. Use “+ Add New Row” to create one.
              </p>
            ) : (
              <ol className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <li key={sectionIndex} className="rounded-lg border border-stone-200">
                    <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2">
                      <span className="text-xs font-bold text-stone-500">Row {sectionIndex + 1}</span>
                      <input
                        value={section.title}
                        placeholder="Row title"
                        onChange={(event) =>
                          writeSections(
                            sections.map((entry, i) =>
                              i === sectionIndex ? { ...entry, title: event.target.value } : entry
                            )
                          )
                        }
                        className={`${inputClass} max-w-xs`}
                      />
                      <span className="ml-auto text-xs text-stone-400">
                        {section.cards.length} card{section.cards.length === 1 ? '' : 's'}
                      </span>
                      <Button
                        onClick={() => {
                          const from = sectionIndex;
                          const to = from - 1;
                          if (to < 0) return;
                          const next = [...sections];
                          const [item] = next.splice(from, 1);
                          next.splice(to, 0, item);
                          writeSections(next);
                        }}
                        disabled={sectionIndex === 0}
                        title="Move row up"
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => {
                          const from = sectionIndex;
                          const to = from + 1;
                          if (to >= sections.length) return;
                          const next = [...sections];
                          const [item] = next.splice(from, 1);
                          next.splice(to, 0, item);
                          writeSections(next);
                        }}
                        disabled={sectionIndex === sections.length - 1}
                        title="Move row down"
                      >
                        ↓
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          writeSections(sections.filter((_, i) => i !== sectionIndex))
                        }
                      >
                        Delete row
                      </Button>
                    </div>

                    <div className="space-y-3 p-3">
                      {expanded.includes(activeSolution.slug) && (
                        <>
                          {section.cards.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-xs text-stone-500">
                              No cards in this row yet.
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {section.cards.map((card: CmsCard, cardIndex) => (
                                <li
                                  key={cardIndex}
                                  className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[96px_1fr]"
                                >
                                  <div className="space-y-2">
                                    <div className="flex h-20 w-24 items-center justify-center overflow-hidden rounded border border-stone-200 bg-stone-50">
                                      {card.src ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={card.src}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-[10px] text-stone-400">No image</span>
                                      )}
                                    </div>
                                    <Button
                                      onClick={() => {
                                        const next = clone(sections);
                                        const list = next[sectionIndex].cards;
                                        const to = cardIndex - 1;
                                        if (to < 0) return;
                                        const [item] = list.splice(cardIndex, 1);
                                        list.splice(to, 0, item);
                                        writeSections(next);
                                      }}
                                      disabled={cardIndex === 0}
                                      title="Move card left"
                                    >
                      ←
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        const next = clone(sections);
                                        const list = next[sectionIndex].cards;
                                        const to = cardIndex + 1;
                                        if (to >= list.length) return;
                                        const [item] = list.splice(cardIndex, 1);
                                        list.splice(to, 0, item);
                                        writeSections(next);
                                      }}
                                      disabled={cardIndex === section.cards.length - 1}
                                      title="Move card right"
                                    >
                      →
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <input
                                      value={card.src ?? ''}
                                      placeholder="Image URL"
                                      onChange={(event) =>
                                        writeSections(
                                          sections.map((entry, i) =>
                                            i === sectionIndex
                                              ? {
                                                  ...entry,
                                                  cards: entry.cards.map((item, j) =>
                                                    j === cardIndex
                                                      ? { ...item, src: event.target.value }
                                                      : item
                                                  ),
                                                }
                                              : entry
                                          )
                                        )
                                      }
                                      className={inputClass}
                                    />
                                    <input
                                      value={card.title ?? ''}
                                      placeholder="Title (optional)"
                                      onChange={(event) =>
                                        writeSections(
                                          sections.map((entry, i) =>
                                            i === sectionIndex
                                              ? {
                                                  ...entry,
                                                  cards: entry.cards.map((item, j) =>
                                                    j === cardIndex
                                                      ? { ...item, title: event.target.value }
                                                      : item
                                                  ),
                                                }
                                              : entry
                                          )
                                        )
                                      }
                                      className={inputClass}
                                    />
                                    <textarea
                                      value={card.description ?? ''}
                                      placeholder="Description (optional)"
                                      onChange={(event) =>
                                        writeSections(
                                          sections.map((entry, i) =>
                                            i === sectionIndex
                                              ? {
                                                  ...entry,
                                                  cards: entry.cards.map((item, j) =>
                                                    j === cardIndex
                                                      ? { ...item, description: event.target.value }
                                                      : item
                                                  ),
                                                }
                                              : entry
                                          )
                                        )
                                      }
                                      className={textareaClass}
                                    />
                                    <Button
                                      variant="danger"
                                      onClick={() =>
                                        setPendingDelete({ sectionIndex, cardIndex })
                                      }
                                    >
                                      Delete card
                                    </Button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          <Button
                            onClick={() =>
                              writeSections(
                                sections.map((entry, i) =>
                                  i === sectionIndex
                                    ? { ...entry, cards: [...entry.cards, { src: '' }] }
                                    : entry
                                )
                              )
                            }
                          >
                            <Plus size={14} /> Add Card
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Hero / banner copy" description="Optional overrides for this solution page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hero heading">
                <input
                  value={activeData?.hero?.title?.main ?? ''}
                  onChange={(event) =>
                    updateSolution(activeSolution.slug, {
                      ...activeData,
                      hero: {
                        ...activeData?.hero,
                        title: { ...activeData?.hero?.title, main: event.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Hero highlight">
                <input
                  value={activeData?.hero?.title?.highlight ?? ''}
                  onChange={(event) =>
                    updateSolution(activeSolution.slug, {
                      ...activeData,
                      hero: {
                        ...activeData?.hero,
                        title: { ...activeData?.hero?.title, highlight: event.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Hero description" className="sm:col-span-2">
                <textarea
                  value={activeData?.hero?.description ?? ''}
                  onChange={(event) =>
                    updateSolution(activeSolution.slug, {
                      ...activeData,
                      hero: { ...activeData?.hero, description: event.target.value },
                    })
                  }
                  className={textareaClass}
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save({ solutions: draft.solutions })}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this card?"
        description="Only this card is removed from this solution row."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const { sectionIndex, cardIndex } = pendingDelete;
          writeSections(
            sections.map((entry, i) =>
              i === sectionIndex
                ? { ...entry, cards: entry.cards.filter((_, j) => j !== cardIndex) }
                : entry
            )
          );
          setPendingDelete(null);
        }}
      />
    </div>
  );
}