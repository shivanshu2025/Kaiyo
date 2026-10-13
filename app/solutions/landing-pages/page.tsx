import type { Metadata } from 'next';
import { landingPagesData } from '@/components/solutions/data/landingPages';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Landing Pages | Kaiyō',
    description:
      'Conversion-focused landing pages that explain your offer fast and turn visitors into enquiries.',
    alternates: { canonical: '/solutions/landing-pages' },
  };
}

export default function LandingPages() {
  return <SolutionPage slug="landing-pages" fallback={landingPagesData} />;
}