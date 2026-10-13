import { NextRequest } from 'next/server';
import { db } from '@/backend/lib/db';
import { Admin } from '@/backend/models/Admin';
import { listSessions } from '@/backend/lib/admin-auth';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import { fieldErrors, securitySettingsSchema } from '@/backend/lib/validation';
import { fail, handleRouteError, ok, readJson } from '@/backend/lib/api-response';
import { getSecuritySettings, setSecuritySettings } from '@/backend/lib/security-settings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security
 *
 * Admin only. Returns the *effective* limits, the account's current lockout
 * state, when the password was last changed, and the live session list.
 *
 * POST /api/admin/security
 *
 * Admin only + CSRF. Updates `maxFailedAttempts`, `lockoutMinutes` and
 * `autoLogoutMinutes` on the account. These are read on the next request, so the
 * controls shown in Admin Settings are enforced by the backend rather than being
 * cosmetic.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdmin(_request, { touch: true });
  if (!guard.ok) return guard.response;

  try {
    await db();

    const admin = await Admin.findById(guard.auth.admin.id)
      .select('failedAttempts lockedUntil passwordUpdatedAt lastLoginAt')
      .lean<{
        failedAttempts: number;
        lockedUntil: Date | null;
        passwordUpdatedAt: Date;
        lastLoginAt: Date | null;
      }>();

    if (!admin) return fail('Account not found.', 404);

    const sessions = await listSessions(guard.auth.admin.id, guard.auth.sessionId);
    const settings = await getSecuritySettings(guard.auth.admin.id);

    const lockedUntil =
      admin.lockedUntil && new Date(admin.lockedUntil).getTime() > Date.now()
        ? admin.lockedUntil.toISOString()
        : null;

    return ok({
      ...settings,
      failedAttempts: admin.failedAttempts ?? 0,
      lockedUntil,
      passwordUpdatedAt: admin.passwordUpdatedAt?.toISOString() ?? null,
      lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
      currentSessionId: guard.auth.sessionId,
      sessions,
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/security');
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = securitySettingsSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Some settings are invalid.', 422, fieldErrors(parsed.error));
    }

    const settings = await setSecuritySettings(guard.auth.admin.id, parsed.data);

    return ok(settings, { message: 'Security settings saved.' });
  } catch (error) {
    return handleRouteError(error, 'PUT /api/admin/security');
  }
}

export async function POST(request: NextRequest) {
  // The existing Admin Settings screen PUTs; POST is accepted as an alias so a
  // form-encoded fallback keeps working.
  return PUT(request);
}