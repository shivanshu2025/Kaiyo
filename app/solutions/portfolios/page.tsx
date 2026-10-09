import { portfoliosData } from '@/components/solutions/data/portfolios';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function PersonalPortfolios() {
  return <SolutionPage slug="personal-portfolios" fallback={portfoliosData} />;
}