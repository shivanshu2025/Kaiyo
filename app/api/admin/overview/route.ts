import { NextRequest } from 'next/server';
import { countDocuments, mergeCmsData, readContentDocument } from '@/backend/lib/cms-store';
import { requireAdmin } from '@/backend/lib/guards';
import { handleRouteError, ok } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/overview  (ADMIN ONLY)
 *
 * Real counts computed directly from the database, plus the site-settings summary
 * and the last-saved timestamp the dashboard Overview screen displays. Nothing
 * here is a placeholder - every number is a live aggregation.
 *
 * This is the *only* payload the Overview screen needs. It deliberately does not
 * return the composed CMS document: that would drag up to `MAX_COMPOSED_CHILDREN`
 * contact submissions (personal data) into a page that only shows a count.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    const [counts, content] = await Promise.all([countDocuments(), readContentDocument()]);
    const cms = mergeCmsData(content);

    const managedPages = (
      [
        ['home', 'Home'],
        ['solutions', 'Solutions'],
        ['pricing', 'Pricing'],
        ['howItWorks', 'How It Works'],
        ['calculator', 'Calculator'],
        ['testimonials', 'Testimonials'],
        ['contact', 'Contact'],
      ] as const
    )
      .filter(([key]) => Boolean((cms as Record<string, unknown>)[key]))
      .map(([, label]) => label);

    return ok({
      counts: {
        ...counts,
        totalPages: managedPages.length,
        managedPages,
        // The category *names*, so the screen can label the tile without also
        // loading the whole CMS payload (solutions with their full page-builder
        // content) just to build one hint line.
        solutionCategoryLabels: Array.from(
          new Set((cms.solutions ?? []).map((entry) => entry.category).filter(Boolean)),
        ) as string[],
      },
      siteSettings: {
        logo: cms.siteSettings.logo,
        whatsappNumber: cms.siteSettings.whatsappNumber,
        phoneNumber: cms.siteSettings.phoneNumber,
        socialLinks: cms.siteSettings.socialLinks.length,
      },
      lastSavedAt: cms.updatedAt,
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/overview');
  }
}