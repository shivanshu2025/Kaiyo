import { readCmsData } from './cms-store';
import type { SiteSettings } from './cms-types';

/**
 * Server-side accessor for the global site settings.
 * Reuses the existing CMS document so admin edits in Site Settings
 * are picked up by every server component that reads them.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const cms = await readCmsData();
  return cms.siteSettings;
}