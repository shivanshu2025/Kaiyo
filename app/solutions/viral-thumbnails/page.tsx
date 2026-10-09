import { viralThumbnailsData } from '@/components/solutions/data/viralThumbnails';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function ViralThumbnailsPage() {
  return <SolutionPage slug="viral-thumbnails" fallback={viralThumbnailsData} />;
}