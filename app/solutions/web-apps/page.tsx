import { webAppsData } from '@/components/solutions/data/webApps';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function NextGenWebAppsPage() {
  return <SolutionPage slug="next-gen-web-apps" fallback={webAppsData} />;
}