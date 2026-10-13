import { Metadata } from 'next';
import Link from 'next/link';
import { readPublicCmsData } from '@/backend/lib/cms-store';
import { solutionCategories } from '@/components/sections/solutions-menu.config';

export const dynamic = 'force-dynamic';

/**
 * The solutions index.
 *
 * This route did not exist, but it is linked from two places that are already live -
 * `app/not-found.tsx` ("Browse solutions") and the "Back to solutions" link on the
 * solution detail page - so both were returning 404.
 *
 * The listing is derived from `solutionCategories` in
 * `components/sections/solutions-menu.config.ts`, the single source the navigation
 * menu already uses, so the index can never drift out of step with the menu and the
 * legacy aliases are never advertised as canonical URLs.
 *
 * Copy is pulled from the CMS solution entries when one exists, so an admin can edit
 * a title/description from the existing Solutions screen without touching this file.
 * Colours and spacing follow the existing solution detail panel (#0f172a / #64748b
 * on white) rather than introducing a new palette.
 */

type CmsSolutionEntry = {
  slug: string;
  title?: string;
  description?: string;
  data?: { hero?: { title?: { main?: string; highlight?: string }; description?: string } };
};

function describe(solution: CmsSolutionEntry | undefined, label: string) {
  if (!solution) return { title: label, description: '' };

  const heroTitle = solution.data?.hero?.title;
  const composed = [heroTitle?.main, heroTitle?.highlight]
    .filter(Boolean)
    .join('')
    .trim();

  return {
    title: composed || solution.title || label,
    description: solution.data?.hero?.description || solution.description || '',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Solutions | Kaiyō',
    description:
      'Browse every service Kaiyō offers - brand logos, viral thumbnails, digital invites, social banners, portfolios, landing pages and web apps.',
    alternates: { canonical: '/solutions' },
  };
}

export default async function SolutionsIndexPage() {
  const cms = await readPublicCmsData();
  const bySlug = new Map<string, CmsSolutionEntry>(
    (cms.solutions ?? []).map((solution) => [solution.slug, solution as CmsSolutionEntry])
  );

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-[#0f172a] sm:text-4xl">Our Solutions</h1>
        <p className="mt-3 max-w-2xl text-[#64748b]">
          Pick a service to see what we build and send us your requirements directly.
        </p>

        {solutionCategories.map((category) => (
          <section key={category.title} className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#64748b]">
              {category.title}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => {
                const { title, description } = describe(bySlug.get(item.href.split('/').pop() ?? ''), item.label);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-2xl border border-[#e6e8ee] bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-semibold text-[#0f172a]">{title}</h3>
                    {description && (
                      <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{description}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}