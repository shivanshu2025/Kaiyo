import type { Metadata } from 'next';
import { digitalInvitesData } from '@/components/solutions/data/digitalInvites';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Digital Shaadi Invites | Kaiyō',
    description:
      'Elegant digital invitations for shaadi, events and celebrations - animated, shareable and made for every guest.',
    alternates: { canonical: '/solutions/digital-shaadi-invites' },
  };
}

export default function DigitalShaadiInvitesPage() {
  return (
    <SolutionPage slug="digital-shaadi-invites" fallback={digitalInvitesData} cardBgColor="#F0F0F0" />
  );
}