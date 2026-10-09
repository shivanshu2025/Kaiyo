import { brandLogosData } from '@/components/solutions/data/brandLogos';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function BrandLogosPage() {
  return <SolutionPage slug="brand-logos" fallback={brandLogosData} />;
}