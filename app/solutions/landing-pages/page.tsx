import { landingPagesData } from '@/components/solutions/data/landingPages';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function LandingPages() {
  return <SolutionPage slug="landing-pages" fallback={landingPagesData} />;
}