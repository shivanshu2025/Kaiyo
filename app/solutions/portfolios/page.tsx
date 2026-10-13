import { permanentRedirect } from 'next/navigation';

/**
 * Legacy alias route.
 *
 * The canonical URL for this service is `/solutions/personal-portfolios` - that is
 * the slug stored in the CMS and the one the navigation menu links to
 * (`components/sections/solutions-menu.config.ts`). This path is kept only so that an
 * old inbound link does not 404, but it previously re-exported the canonical page and
 * therefore served a second, byte-identical, indexable URL with no canonical tag.
 *
 * A permanent redirect collapses the pair onto one URL, which is what the duplicate
 * content was missing.
 */
export default function PortfoliosAlias() {
  permanentRedirect('/solutions/personal-portfolios');
}