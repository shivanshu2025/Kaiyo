import type { Metadata } from 'next';
import { portfoliosData } from '@/components/solutions/data/portfolios';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Personal Portfolios | Kaiyō',
    description:
      'Portfolio website design for developers, designers, photographers and creatives who want their work to speak for itself.',
    alternates: { canonical: '/solutions/personal-portfolios' },
  };
}

export default function PersonalPortfolios() {
  return <SolutionPage slug="personal-portfolios" fallback={portfoliosData} />;
}