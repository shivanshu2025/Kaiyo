import { NextRequest } from 'next/server';
import { calculatorQuoteSchema, fieldErrors } from '@/backend/lib/validation';
import { calculateQuote, findTier } from '@/backend/lib/calculator';
import { readCalculatorContent } from '@/backend/lib/cms-store';
import { clientIp, consumeRateLimit, RATE_LIMITS } from '@/backend/lib/rate-limit';
import {
  fail,
  handleRouteError,
  ok,
  readJson,
  tooManyRequests,
} from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/calculator/quote  (PUBLIC)
 *
 * Body: `{ projectValue, role }`
 *
 * The commission percentage is looked up from the persisted calculator tiers on
 * the server. It is deliberately NOT accepted from the client, so a modified
 * frontend or a hand-crafted request cannot claim a higher payout than the stored
 * tier allows. The project value is clamped to the configured range, the result
 * is rounded per `calculatorLogic.rounding` and capped at
 * `calculatorLogic.maxEarning`.
 *
 * Responses: 200 quote | 400 malformed body | 404 unknown role | 422 invalid input
 *           | 429 rate limit reached
 */
export async function POST(request: NextRequest) {
  try {
    // Anonymous, unauthenticated and unbounded by anything the caller controls, so
    // the request source is metered before any database work happens.
    const limit = await consumeRateLimit(clientIp(request), RATE_LIMITS.calculatorQuote);
    if (!limit.allowed) {
      return tooManyRequests(
        'Too many calculations. Please try again in a little while.',
        limit.retryAfterSeconds,
      );
    }

    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = calculatorQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Some fields are invalid.', 422, fieldErrors(parsed.error));
    }

    const cms = await readCalculatorContent();

    if (!findTier(cms, parsed.data.role)) {
      return fail('Unknown partner role.', 404);
    }

    return ok(calculateQuote(cms, parsed.data));
  } catch (error) {
    return handleRouteError(error, 'POST /api/calculator/quote');
  }
}