import { digitalInvitesData } from '@/components/solutions/data/digitalInvites';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function DigitalInvitesPage() {
  return (
    <SolutionPage slug="digital-shaadi-invites" fallback={digitalInvitesData} cardBgColor="#F0F0F0" />
  );
}