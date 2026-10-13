import { notFound } from 'next/navigation';
import { cache } from 'react';
import { readPublicCmsData } from '@/backend/lib/cms-store';
import SolutionDetail, {
  type RelatedSolution,
  type SolutionDetailData,
} from '@/components/solutions/SolutionDetail';
import type { CmsSolution } from '@/lib/cms-types';

/**
 * Rendered per request so an admin edit appears immediately - this is a CMS-backed
 * page, so a cached copy would be wrong.
 *
 * KNOWN FRAMEWORK LIMITATION: on a dynamic route Next.js 13.5 flushes the response
 * headers before the page component runs, so `notFound()` renders the not-found UI
 * but the HTTP status remains `200` rather than `404`. The alternative -
 * `generateStaticParams` - would freeze the slug list at build time and 404 every
 * solution added later, which is worse. The UI is correct and the slug lookup is
 * authoritative; only the status code differs.
 */
export const dynamic = 'force-dynamic';

/** Node runtime: the CMS lookup reads MongoDB. */
export const runtime = 'nodejs';

/**
 * Renders the detail view for one CMS solution.
 *
 * The slug is resolved against the same CMS document that `/solutions/*` pages use
 * (`readPublicCmsData`), so an edit made in the admin dashboard shows up here
 * immediately. A slug that does not exist, or that is not published, returns a real
 * 404 rather than an empty page.
 */

/**
 * Memoised so `generateMetadata` and the page itself share one database read.
 * `notFound()` is raised from `generateMetadata` as well as the page body: metadata
 * is resolved before the response is flushed, which is what makes the HTTP status
 * an actual 404 instead of a 200 that streams the not-found UI.
 */
const getSolutions = cache(async (): Promise<CmsSolution[]> => {
  const cms = await readPublicCmsData();
  return Array.isArray(cms.solutions) ? cms.solutions : [];
});

function findSolution(solutions: CmsSolution[], rawSlug: string): CmsSolution | undefined {
  const slug = (rawSlug ?? '').trim().toLowerCase();
  if (!slug) return undefined;
  return solutions.find((entry) => asString(entry.slug).toLowerCase() === slug);
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const solutions = await getSolutions();
  const solution = findSolution(solutions, params?.slug);

  if (!solution) notFound();

  const hero = ((solution.data ?? {}) as Loose).hero ?? {};
  const description = asString((hero as Loose).description);

  return {
    title: solution.label,
    ...(description ? { description } : {}),
  };
}

type Loose = Record<string, unknown>;

const MAX_IMAGES = 6;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pushImage(target: string[], value: unknown): void {
  if (target.length >= MAX_IMAGES) return;
  const src = asString(value);
  // Only absolute http(s) URLs and site-relative paths reach the page; anything
  // else (a `data:` payload, a `javascript:` URL) is discarded here as well as in
  // the API validator.
  if (!src) return;
  const safe = src.startsWith('/') && !src.startsWith('//') ? src : /^https?:\/\//i.test(src) ? src : null;
  if (safe) target.push(safe);
}

/** Flattens the CMS `data` blob into the fields the detail view renders. */
function toDetail(solution: CmsSolution): SolutionDetailData {
  const data = (solution.data ?? {}) as Loose;
  const hero = (data.hero ?? {}) as Loose;
  const heroTitle = (hero.title ?? {}) as Loose;
  const topSection = (data.topSection ?? {}) as Loose;

  const title = [asString(heroTitle.main), asString(heroTitle.highlight)]
    .filter(Boolean)
    .join('') || solution.label;

  const description =
    asString(hero.description) || asString(topSection.subtitle) || asString(solution.label);

  const images: string[] = [];

  const featured = Array.isArray(topSection.featuredCards) ? topSection.featuredCards : [];
  for (const card of featured) pushImage(images, (card as Loose)?.src);

  const sections = Array.isArray(data.sections) ? data.sections : [];
  for (const section of sections) {
    const cards = Array.isArray((section as Loose)?.cards) ? ((section as Loose).cards as Loose[]) : [];
    for (const card of cards) pushImage(images, card?.src);
  }

  const stats = Array.isArray(hero.stats)
    ? (hero.stats as Loose[])
        .map((stat) => ({
          value: asString(stat?.value),
          label: asString(stat?.label),
        }))
        .filter((stat) => stat.value && stat.label)
        .slice(0, 6)
    : [];

  return { slug: solution.slug, label: solution.label, title, description, images, stats };
}

/** Other solutions in the same category, capped so the section stays short. */
function toRelated(all: CmsSolution[], current: CmsSolution): RelatedSolution[] {
  const sameCategory = all.filter(
    (entry) => entry.slug !== current.slug && entry.category === current.category,
  );
  const others = sameCategory.length > 0
    ? sameCategory
    : all.filter((entry) => entry.slug !== current.slug);

  return others.slice(0, 4).map((entry) => {
    const data = (entry.data ?? {}) as Loose;
    const hero = (data.hero ?? {}) as Loose;
    return {
      slug: entry.slug,
      title: entry.label,
      description: asString(hero.description),
    };
  });
}

export default async function SolutionDetailPage({ params }: { params: { slug: string } }) {
  const solutions = await getSolutions();
  const solution = findSolution(solutions, params?.slug);

  // Unknown slug -> a real 404 instead of a fabricated page.
  if (!solution) notFound();

  return <SolutionDetail detail={toDetail(solution)} related={toRelated(solutions, solution)} />;
}