import type { Metadata } from 'next';
import { webAppsData } from '@/components/solutions/data/webApps';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Next-Gen Web Apps | Kaiyō',
    description:
      'Fast, modern web applications built with the latest tooling - dashboards, portals and products your customers actually use.',
    alternates: { canonical: '/solutions/next-gen-web-apps' },
  };
}

export default function NextGenWebAppsPage() {
  return <SolutionPage slug="next-gen-web-apps" fallback={webAppsData} />;
}