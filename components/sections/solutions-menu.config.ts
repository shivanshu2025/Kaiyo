export interface SolutionMenuItem {
  label: string;
  href: string;
  aliases?: string[];
}

export interface SolutionMenuCategory {
  title: string;
  items: SolutionMenuItem[];
}

const solutionCategoryBlueprint = [
  {
    title: 'Creative Studio',
    items: [
      'Brand Logos',
      'Viral Thumbnails',
      'Digital Shaadi Invites',
      'Social Media Banners',
    ],
  },
  {
    title: 'Web Apps',
    items: ['Personal Portfolios', 'Landing Pages', 'Next-Gen Web Apps'],
  },
] as const;

const legacySolutionRouteAliases: Record<string, string[]> = {
  'Digital Shaadi Invites': ['/solutions/digital-invites'],
  'Social Media Banners': ['/solutions/social-banners'],
  'Personal Portfolios': ['/solutions/portfolios'],
  'Next-Gen Web Apps': ['/solutions/web-apps'],
};

export function slugifySolutionLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSolutionHref(label: string) {
  return `/solutions/${slugifySolutionLabel(label)}`;
}

export const solutionCategories: SolutionMenuCategory[] =
  solutionCategoryBlueprint.map((category) => ({
    title: category.title,
    items: category.items.map((label) => ({
      label,
      href: getSolutionHref(label),
      aliases: legacySolutionRouteAliases[label],
    })),
  }));

export function isSolutionItemActive(
  item: SolutionMenuItem,
  pathname: string | null
) {
  if (!pathname) {
    return false;
  }

  return [item.href, ...(item.aliases ?? [])].some((route) => route === pathname);
}

export function getActiveSolutionCategoryTitle(pathname: string | null) {
  return (
    solutionCategories.find((category) =>
      category.items.some((item) => isSolutionItemActive(item, pathname))
    )?.title ?? 'Solutions'
  );
}
