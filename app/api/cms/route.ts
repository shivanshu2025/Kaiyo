import { NextRequest, NextResponse } from 'next/server';
import {
  fail,
  handleRouteError,
  ok,
  readJson,
  tooManyRequests,
} from '@/backend/lib/api-response';
import { applyCmsPatch, readCmsData, readPublicCmsData } from '@/backend/lib/cms-store';
import { consumeRateLimit, RATE_LIMITS } from '@/backend/lib/rate-limit';
import { requireAdminMutation } from '@/backend/lib/guards';
import { cmsPatchSchema, fieldErrors } from '@/backend/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cms
 *
 * Public (no auth): returns the published site content. Contact submissions are
 * always stripped and only `published` testimonials are included, so no private
 * record can be read by an unauthenticated caller.
 *
 * Authenticated admin: additionally receives contact submissions and pending
 * testimonials, which is what the dashboard's overview and management screens
 * need. The admin view is selected by the session cookie, not by a query flag,
 * so a public caller cannot request the privileged projection.
 */
export async function GET(request: NextRequest) {
  try {
    // The privileged projection requires BOTH a valid admin session and an
    // explicit opt-in header from the dashboard. A visitor who happens to carry
    // a stale admin cookie still receives only the public document.
    const wantsAdminScope = request.headers.get('x-kaiyo-admin') === '1';
    const auth = wantsAdminScope ? await resolveAdminSession() : null;

    const data = auth ? await readCmsData() : await readPublicCmsData();
    return NextResponse.json({ success: true, data, scope: auth ? 'admin' : 'public' });
  } catch (error) {
    return handleRouteError(error, 'GET /api/cms');
  }
}

/**
 * PUT /api/cms
 *
 * Admin only (role `admin`) + CSRF token. Validates the patch against
 * `cmsPatchSchema` before it reaches the store.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    // This is the heaviest write in the application - a patch rewrites the CMS
    // document and can sync the whole testimonial collection - so it carries a
    // per-administrator budget. `RATE_LIMITS.cmsWrite` was already defined for
    // exactly this and had never been applied, leaving the endpoint unmetered
    // behind nothing but the CSRF token. Keyed on the account, not the IP: an
    // administrator behind a shared or rotating address must not be locked out of
    // their own dashboard, and the limit is not a defence against a stolen cookie
    // (that is what the session and role checks are for).
    const budget = await consumeRateLimit(guard.auth.admin.id, RATE_LIMITS.cmsWrite);
    if (!budget.allowed) {
      return tooManyRequests(
        'Too many saves in a short period. Please wait a moment and try again.',
        budget.retryAfterSeconds,
      );
    }

    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = cmsPatchSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Some fields are invalid.', 422, fieldErrors(parsed.error));
    }

    const data = await applyCmsPatch(parsed.data as never, guard.auth.admin.id);
    return ok(data, { message: 'Changes saved.' });
  } catch (error) {
    return handleRouteError(error, 'PUT /api/cms');
  }
}

/**
 * Resolves the session without redirecting, and **only** for the `admin` role.
 *
 * The privileged projection exposes contact submissions and pending testimonials -
 * personal data. A signed-in `editor` is not an administrator, so it gets the
 * public document here exactly like any other visitor; every mutating route on this
 * file goes through `requireAdminMutation`, which enforces the same role check.
 */
async function resolveAdminSession() {
  try {
    const { resolveAdminSession } = await import('@/backend/lib/admin-auth');
    return await resolveAdminSession();
  } catch {
    return null;
  }
}

export async function DELETE() {
  return fail('The CMS document cannot be deleted.', 405);
}