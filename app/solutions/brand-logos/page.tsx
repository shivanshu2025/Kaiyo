import type { Metadata } from 'next';
import { brandLogosData } from '@/components/solutions/data/brandLogos';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Brand Logos | Kaiyō',
    description:
      'Premium logo design, branding and creative visuals crafted for startups and modern businesses.',
    alternates: { canonical: '/solutions/brand-logos' },
  };
}

export default function BrandLogosPage() {
  return <SolutionPage slug="brand-logos" fallback={brandLogosData} />;
}