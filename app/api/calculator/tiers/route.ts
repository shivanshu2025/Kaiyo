import { readCalculatorContent } from '@/backend/lib/cms-store';
import { handleRouteError, ok } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/calculator/tiers  (PUBLIC)
 *
 * The enabled commission tiers the public calculator renders, plus the value
 * bounds. Read-only - exposing these does not let a visitor recompute a higher
 * figure, because every quote goes through `/api/calculator/quote`, which
 * re-derives the percentage server-side.
 */
export async function GET() {
  try {
    const cms = await readCalculatorContent();

    const tiers = [...cms.tiers]
      .filter((tier) => tier.isEnabled !== false)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((tier) => ({
        title: tier.title,
        percentage: tier.percentage,
        description: tier.description,
        icon: tier.icon,
        accentColor: tier.accentColor,
      }));

    return ok({
      tiers,
      projectValue: cms.projectValue,
      currency: cms.projectValue?.currency ?? 'INR',
      maxEarning: cms.calculatorLogic?.maxEarning ?? null,
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/calculator/tiers');
  }
}