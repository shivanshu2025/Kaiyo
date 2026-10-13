import type { Metadata } from 'next';
import { viralThumbnailsData } from '@/components/solutions/data/viralThumbnails';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Viral Thumbnails | Kaiyō',
    description:
      'Thumbnails engineered to earn the click - bold, readable and designed for the platforms your audience actually scrolls.',
    alternates: { canonical: '/solutions/viral-thumbnails' },
  };
}

export default function ViralThumbnailsPage() {
  return <SolutionPage slug="viral-thumbnails" fallback={viralThumbnailsData} />;
}