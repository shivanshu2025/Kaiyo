import { NextRequest } from 'next/server';
import { db, dbErrorStatus } from '@/backend/lib/db';
import { ContactSubmission, SUBMISSION_STATUSES } from '@/backend/models/ContactSubmission';
import { createId } from '@/backend/lib/cms-store';
import {
  clientIp,
  consumeRateLimit,
  hashIp,
  RATE_LIMITS,
} from '@/backend/lib/rate-limit';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import { contactSubmissionSchema, fieldErrors } from '@/backend/lib/validation';
import {
  created,
  fail,
  handleRouteError,
  notFound,
  ok,
  pagination,
  readJson,
  tooManyRequests,
} from '@/backend/lib/api-response';
import { env } from '@/backend/lib/env';

export const dynamic = 'force-dynamic';

/** Duplicate-submit window: a form re-posted within 15s is treated as a retry. */
const DUPLICATE_WINDOW_MS = 15_000;

/**
 * POST /api/contact-submissions  (PUBLIC)
 *
 * Body: `{ name, email, message, phone?, interest?, website? }`
 *
 * Spam handling:
 *  - `website` is a honeypot field hidden from real users; a filled value is
 *    accepted silently with a 201 so the bot gets no signal, but nothing is
 *    stored.
 *  - Rate limited per IP (5 / 10 min).
 *  - Identical submissions from the same IP inside a 15s window are rejected.
 *  - The submitter's IP is stored only as a salted hash, never in the clear.
 *
 * Returns 201 with the created record. The stored data is never echoed back by
 * any public endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    const limit = await consumeRateLimit(ip, RATE_LIMITS.contact);
    if (!limit.allowed) {
      return tooManyRequests(
        'You have sent several messages recently. Please try again later.',
        limit.retryAfterSeconds,
      );
    }

    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = contactSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Please check the highlighted fields.', 422, fieldErrors(parsed.error));
    }

    const { name, email, message, phone, interest, website } = parsed.data;

    // Honeypot: report success, store nothing.
    if (website && website.length > 0) {
      return created({ received: true }, 'Thanks - your message has been received.');
    }

    await db();

    const ipHash = hashIp(ip, env.sessionSecret ?? env.siteUrl);

    // Duplicate submitter: same fingerprint + same message, seconds apart.
    const recentDuplicate = await ContactSubmission.findOne({
      ipHash,
      message,
      createdAt: { $gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    })
      .select('_id')
      .lean();

    if (recentDuplicate) {
      return fail('This message was already received.', 409);
    }

    const document = await ContactSubmission.create({
      publicId: createId('contact'),
      name,
      email,
      phone,
      interest,
      message,
      status: 'new',
      ipHash,
      userAgent: (request.headers.get('user-agent') || '').slice(0, 200) || null,
      markedSpam: false,
    });

    const createdAt = (document as unknown as { createdAt: Date }).createdAt;

    return created(
      {
        id: document.publicId,
        name: document.name,
        email: document.email,
        createdAt: createdAt.toISOString(),
      },
      'Thanks - your message has been received.',
    );
  } catch (error) {
    const { status, message } = dbErrorStatus(error);
    if (status === 500) return handleRouteError(error, 'POST /api/contact-submissions');
    return fail(message, status);
  }
}

/**
 * GET /api/contact-submissions  (ADMIN ONLY)
 *
 * Paginated, newest first. Returns contact submissions - personal data - so this
 * route requires an authenticated `admin` session and returns 401/403 otherwise.
 * It is never linked from a public page.
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

    const filter: Record<string, unknown> = {};
    if (status && ['new', 'read', 'archived'].includes(status)) filter.status = status;

    const [items, total] = await Promise.all([
      ContactSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Array<Record<string, unknown>>>(),
      ContactSubmission.countDocuments(filter),
    ]);

    return ok({
      items: items.map((item) => ({
        id: item.publicId,
        name: item.name,
        email: item.email,
        phone: item.phone,
        interest: item.interest,
        message: item.message,
        status: item.status,
        markedSpam: item.markedSpam,
        createdAt: new Date(item.createdAt as string).toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/contact-submissions');
  }
}

/**
 * PUT /api/contact-submissions  (ADMIN ONLY + CSRF)
 *
 * Body: `{ id, status }`. Moves one submission through the read/archived
 * workflow.
 *
 * This route existed to be missing: the `status` enum has always been on the model
 * and `GET` has always been able to filter on it, but nothing could ever write it,
 * so every message stayed `new` forever and the filter was unreachable.
 *
 * Guarded exactly like `PUT /api/admin/leads`: authenticated `admin` role, CSRF
 * header, and the status value is checked against the model enum rather than
 * trusted. The record is matched on `publicId` and only `status` is written - no
 * mass assignment, so a caller cannot rewrite the sender's name, email or message
 * through this endpoint. Returns 404 for an unknown id rather than reporting a
 * success that changed nothing.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) return fail('A submission id is required.', 400);

    const status = typeof body.status === 'string' ? body.status : '';
    if (!(SUBMISSION_STATUSES as readonly string[]).includes(status)) {
      return fail(`Status must be one of: ${SUBMISSION_STATUSES.join(', ')}.`, 422);
    }

    await db();

    const result = await ContactSubmission.findOneAndUpdate(
      { publicId: id },
      { $set: { status } },
      { new: true },
    ).lean<{ publicId: string; status: string } | null>();

    if (!result) return notFound('Submission not found.');

    return ok({ id: result.publicId, status: result.status }, { message: 'Submission updated.' });
  } catch (error) {
    return handleRouteError(error, 'PUT /api/contact-submissions');
  }
}

/**
 * DELETE /api/contact-submissions?id=<publicId>  (ADMIN ONLY + CSRF)
 *
 * Deletes exactly one record. The id must match an existing document, otherwise
 * 404 - no unrelated content is touched.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return fail('Missing submission id.', 400);

    await db();

    const result = await ContactSubmission.deleteOne({ publicId: id });
    if (result.deletedCount === 0) return notFound('Submission not found.');

    return ok({ id }, { message: 'Submission deleted.' });
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/contact-submissions');
  }
}