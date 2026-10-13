import { permanentRedirect } from 'next/navigation';

/**
 * Legacy alias route - the canonical URL for this service is
 * `/solutions/digital-shaadi-invites`. See the note in
 * `app/solutions/portfolios/page.tsx` for why these alias routes redirect rather than
 * re-export the canonical page.
 */
export default function DigitalInvitesAlias() {
  permanentRedirect('/solutions/digital-shaadi-invites');
}