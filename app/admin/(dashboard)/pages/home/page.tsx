'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass, textareaClass } from '@/components/admin/ui';
import type { CmsData, HomeCollectionItem, HomeFinalCta, HomeProcessStep, HomeProject } from '@/lib/cms-types';

type PendingDelete =
  | { kind: 'collection'; index: number }
  | { kind: 'project'; index: number }
  | { kind: 'step'; index: number }
  | { kind: 'ctaItem'; index: number }
  | null;

export default function AdminHomePage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);
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

  const home = draft.home;

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const next = structuredCloneish(home);

    if (pendingDelete.kind === 'collection') {
      next.collection.items = next.collection.items.filter((_, i) => i !== pendingDelete.index);
    } else if (pendingDelete.kind === 'project') {
      next.projectShowcase.projects = next.projectShowcase.projects.filter(
        (_, i) => i !== pendingDelete.index
      );
    } else if (pendingDelete.kind === 'step') {
      next.process.steps = next.process.steps.filter((_, i) => i !== pendingDelete.index);
    } else {
      next.finalCta.listItems = next.finalCta.listItems.filter(
        (_, i) => i !== pendingDelete.index
      );
    }

    setDraft({ ...draft, home: next });
    setPendingDelete(null);
  };

  const deleteLabel =
    pendingDelete?.kind === 'collection'
      ? 'Remove this collection item?'
      : pendingDelete?.kind === 'project'
        ? 'Remove this project?'
        : pendingDelete?.kind === 'step'
          ? 'Remove this process step?'
          : 'Remove this CTA item?';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Home</h1>
        <p className="mt-1 text-sm text-stone-500">Manage the existing homepage content.</p>
      </div>

      {/* Hero */}
      <Card title="Hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Heading" className="sm:col-span-2">
            <input
              value={home.hero.title}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, title: event.target.value } }))}
              className={inputClass}
            />
          </Field>
          <Field label="Sub-heading">
            <input
              value={home.hero.subtitle}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, subtitle: event.target.value } }))}
              className={inputClass}
            />
          </Field>
          <Field label="Button text">
            <input
              value={home.hero.ctaText}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, ctaText: event.target.value } }))}
              className={inputClass}
            />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={home.hero.description}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, description: event.target.value } }))}
              className={textareaClass}
            />
          </Field>
          <Field label="Button link">
            <input
              value={home.hero.ctaLink}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, ctaLink: event.target.value } }))}
              className={inputClass}
            />
          </Field>
          <Field label="Side image path">
            <input
              value={home.hero.image}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, image: event.target.value } }))}
              className={inputClass}
            />
          </Field>
          <Field label="Centre logo path">
            <input
              value={home.hero.logoImage}
              onChange={(event) => setDraft(updateHome(draft, { hero: { ...home.hero, logoImage: event.target.value } }))}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {/* Collection */}
      <Card
        title="Main Content / Collection"
        actions={
          <Button
            onClick={() =>
              setDraft(
                updateHome(draft, {
                  collection: {
                    ...home.collection,
                    items: [...home.collection.items, { title: '', text: '' }],
                  },
                })
              )
            }
          >
            + Add item
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading">
              <input
                value={home.collection.heading}
                onChange={(event) => setDraft(updateHome(draft, { collection: { ...home.collection, heading: event.target.value } }))}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <input
                value={home.collection.description}
                onChange={(event) => setDraft(updateHome(draft, { collection: { ...home.collection, description: event.target.value } }))}
                className={inputClass}
              />
            </Field>
          </div>

          {home.collection.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
              No collection items yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {home.collection.items.map((item: HomeCollectionItem, index) => (
                <li key={index} className="rounded-lg border border-stone-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
                    <input
                      value={item.title}
                      placeholder="Title"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            collection: {
                              ...home.collection,
                              items: home.collection.items.map((entry, i) =>
                                i === index ? { ...entry, title: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={inputClass}
                    />
                    <textarea
                      value={item.text}
                      placeholder="Description"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            collection: {
                              ...home.collection,
                              items: home.collection.items.map((entry, i) =>
                                i === index ? { ...entry, text: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={textareaClass}
                    />
                    <Button variant="danger" onClick={() => setPendingDelete({ kind: 'collection', index })}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Project Showcase */}
      <Card
        title="Project Showcase"
        actions={
          <Button
            onClick={() =>
              setDraft(
                updateHome(draft, {
                  projectShowcase: {
                    ...home.projectShowcase,
                    projects: [...home.projectShowcase.projects, { title: '', description: '', image: '' }],
                  },
                })
              )
            }
          >
            + Add project
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading">
              <input
                value={home.projectShowcase.heading}
                onChange={(event) => setDraft(updateHome(draft, { projectShowcase: { ...home.projectShowcase, heading: event.target.value } }))}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={home.projectShowcase.description}
                onChange={(event) => setDraft(updateHome(draft, { projectShowcase: { ...home.projectShowcase, description: event.target.value } }))}
                className={textareaClass}
              />
            </Field>
          </div>

          {home.projectShowcase.projects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
              No projects yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {home.projectShowcase.projects.map((project: HomeProject, index) => (
                <li key={index} className="rounded-lg border border-stone-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                    <input
                      value={project.title}
                      placeholder="Title"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            projectShowcase: {
                              ...home.projectShowcase,
                              projects: home.projectShowcase.projects.map((entry, i) =>
                                i === index ? { ...entry, title: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={inputClass}
                    />
                    <textarea
                      value={project.description}
                      placeholder="Description"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            projectShowcase: {
                              ...home.projectShowcase,
                              projects: home.projectShowcase.projects.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={textareaClass}
                    />
                    <Button variant="danger" onClick={() => setPendingDelete({ kind: 'project', index })}>
                      Delete
                    </Button>
                  </div>
                  <input
                    value={project.image}
                    placeholder="Image / video URL"
                    onChange={(event) =>
                      setDraft(
                        updateHome(draft, {
                          projectShowcase: {
                            ...home.projectShowcase,
                            projects: home.projectShowcase.projects.map((entry, i) =>
                              i === index ? { ...entry, image: event.target.value } : entry
                            ),
                          },
                        })
                      )
                    }
                    className={`${inputClass} mt-2`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Process */}
      <Card
        title="Process"
        actions={
          <Button
            onClick={() =>
              setDraft(
                updateHome(draft, {
                  process: {
                    ...home.process,
                    steps: [
                      ...home.process.steps,
                      { number: String(home.process.steps.length + 1).padStart(2, '0'), title: '', description: '' },
                    ],
                  },
                })
              )
            }
          >
            + Add step
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading">
              <input
                value={home.process.heading}
                onChange={(event) => setDraft(updateHome(draft, { process: { ...home.process, heading: event.target.value } }))}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <input
                value={home.process.description}
                onChange={(event) => setDraft(updateHome(draft, { process: { ...home.process, description: event.target.value } }))}
                className={inputClass}
              />
            </Field>
          </div>

          {home.process.steps.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
              No process steps yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {home.process.steps.map((step: HomeProcessStep, index) => (
                <li key={index} className="rounded-lg border border-stone-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-[90px_200px_1fr_auto]">
                    <input
                      value={step.number}
                      placeholder="01"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            process: {
                              ...home.process,
                              steps: home.process.steps.map((entry, i) =>
                                i === index ? { ...entry, number: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      value={step.title}
                      placeholder="Title"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            process: {
                              ...home.process,
                              steps: home.process.steps.map((entry, i) =>
                                i === index ? { ...entry, title: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={inputClass}
                    />
                    <input
                      value={step.description}
                      placeholder="Description"
                      onChange={(event) =>
                        setDraft(
                          updateHome(draft, {
                            process: {
                              ...home.process,
                              steps: home.process.steps.map((entry, i) =>
                                i === index ? { ...entry, description: event.target.value } : entry
                              ),
                            },
                          })
                        )
                      }
                      className={inputClass}
                    />
                    <Button variant="danger" onClick={() => setPendingDelete({ kind: 'step', index })}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Final CTA */}
      <Card
        title="Final CTA"
        actions={
          <Button
            onClick={() =>
              setDraft(
                updateHome(draft, {
                  finalCta: {
                    ...home.finalCta,
                    listItems: [...home.finalCta.listItems, { title: '', desc: '' }],
                  },
                })
              )
            }
          >
            + Add list item
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading">
              <input
                value={home.finalCta.heading}
                onChange={(event) => setDraft(updateHome(draft, { finalCta: { ...home.finalCta, heading: event.target.value } }))}
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={home.finalCta.description}
                onChange={(event) => setDraft(updateHome(draft, { finalCta: { ...home.finalCta, description: event.target.value } }))}
                className={textareaClass}
              />
            </Field>
            <Field label="Button text">
              <input
                value={home.finalCta.buttonText}
                onChange={(event) => setDraft(updateHome(draft, { finalCta: { ...home.finalCta, buttonText: event.target.value } }))}
                className={inputClass}
              />
            </Field>
            <Field
              label="Button link"
              hint="Shown as the trailing word after the button text. Leave blank to keep the default word."
            >
              <input
                value={home.finalCta.buttonLink}
                onChange={(event) => setDraft(updateHome(draft, { finalCta: { ...home.finalCta, buttonLink: event.target.value } }))}
                className={inputClass}
              />
            </Field>
          </div>

          {home.finalCta.listItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
              No list items yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {home.finalCta.listItems.map((item: HomeFinalCta['listItems'][number], index) => (
                <li key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[220px_1fr_auto]">
                  <input
                    value={item.title}
                    placeholder="Title"
                    onChange={(event) =>
                      setDraft(
                        updateHome(draft, {
                          finalCta: {
                            ...home.finalCta,
                            listItems: home.finalCta.listItems.map((entry, i) =>
                              i === index ? { ...entry, title: event.target.value } : entry
                            ),
                          },
                        })
                      )
                    }
                    className={inputClass}
                  />
                  <input
                    value={item.desc}
                    placeholder="Description"
                    onChange={(event) =>
                      setDraft(
                        updateHome(draft, {
                          finalCta: {
                            ...home.finalCta,
                            listItems: home.finalCta.listItems.map((entry, i) =>
                              i === index ? { ...entry, desc: event.target.value } : entry
                            ),
                          },
                        })
                      )
                    }
                    className={inputClass}
                  />
                  <Button variant="danger" onClick={() => setPendingDelete({ kind: 'ctaItem', index })}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <SaveBar saving={saving} dirty={dirty} onSave={() => save({ home: draft.home })} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={deleteLabel}
        description="This removes the item from the homepage."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function updateHome(draft: CmsData, home: Partial<CmsData['home']>): CmsData {
  return { ...draft, home: { ...draft.home, ...home } as CmsData['home'] };
}

function structuredCloneish<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}