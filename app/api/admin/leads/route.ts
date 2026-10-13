import { NextRequest } from 'next/server';
import { db } from '@/backend/lib/db';
import { Lead, LEAD_STATUSES } from '@/backend/models/Lead';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import { fail, handleRouteError, notFound, ok, pagination, readJson } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/leads  (ADMIN ONLY)
 *
 * Paginated solution inquiries, newest first. `status` and `solutionSlug` may be
 * used to filter. Leads contain personal data (name, email, phone, message) and are
 * therefore never readable by an unauthenticated caller.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  try {
    await db();

    const { limit, page, skip } = pagination(request.nextUrl.searchParams, {
      limit: 25,
      maxLimit: 100,
    });

    const status = request.nextUrl.searchParams.get('status');
    const solutionSlug = request.nextUrl.searchParams.get('solutionSlug');

    const filter: Record<string, unknown> = {};
    if (status && (LEAD_STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (solutionSlug) filter.solutionSlug = solutionSlug.trim().slice(0, 120);

    const [items, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Array<Record<string, unknown>>>(),
      Lead.countDocuments(filter),
    ]);

    return ok({
      items: items.map((item) => ({
        id: item.publicId,
        solutionSlug: item.solutionSlug,
        name: item.name,
        email: item.email,
        phone: item.phone,
        company: item.company,
        message: item.message,
        status: item.status,
        markedSpam: item.markedSpam,
        createdAt: new Date(item.createdAt as string).toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/admin/leads');
  }
}

/**
 * PUT /api/admin/leads  (ADMIN ONLY + CSRF)
 *
 * Body: `{ id, status }`. Lets an admin mark an inquiry as contacted or closed.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) return fail('A lead id is required.', 400);

    const status = typeof body.status === 'string' ? body.status : '';
    if (!(LEAD_STATUSES as readonly string[]).includes(status)) {
      return fail(`Status must be one of: ${LEAD_STATUSES.join(', ')}.`, 422);
    }

    await db();

    const result = await Lead.findOneAndUpdate(
      { publicId: id },
      { $set: { status } },
      { new: true },
    ).lean<{ publicId: string; status: string } | null>();

    if (!result) return notFound('Lead not found.');

    return ok({ id: result.publicId, status: result.status }, { message: 'Lead updated.' });
  } catch (error) {
    return handleRouteError(error, 'PUT /api/admin/leads');
  }
}

/** DELETE /api/admin/leads?id=<publicId>  (ADMIN ONLY + CSRF) */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return fail('Missing lead id.', 400);

    await db();

    const result = await Lead.deleteOne({ publicId: id });
    if (result.deletedCount === 0) return notFound('Lead not found.');

    return ok({ id }, { message: 'Lead deleted.' });
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/admin/leads');
  }
}