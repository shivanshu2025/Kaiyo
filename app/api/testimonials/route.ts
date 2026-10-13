import { NextRequest } from 'next/server';
import { db, dbErrorStatus } from '@/backend/lib/db';
import { Testimonial } from '@/backend/models/Testimonial';
import { createId } from '@/backend/lib/cms-store';
import { clientIp, consumeRateLimit, RATE_LIMITS } from '@/backend/lib/rate-limit';
import { requireAdmin, requireAdminMutation } from '@/backend/lib/guards';
import {
  fieldErrors,
  testimonialSubmissionSchema,
  testimonialUpdateSchema,
} from '@/backend/lib/validation';
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

export const dynamic = 'force-dynamic';

/**
 * POST /api/testimonials  (PUBLIC)
 *
 * Body: `{ name, content, rating, avatar?, designation?, company?, website? }`
 *
 * New submissions are always stored with `status: 'pending'`. They are therefore
 * invisible to the public site until an admin publishes them, which is what the
 * dashboard's "only approved testimonials appear publicly" rule requires. A
 * client cannot set the status itself - the field is not part of this schema.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    const limit = await consumeRateLimit(ip, RATE_LIMITS.testimonial);
    if (!limit.allowed) {
      return tooManyRequests(
        'You have submitted several reviews recently. Please try again later.',
        limit.retryAfterSeconds,
      );
    }

    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = testimonialSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Please check the highlighted fields.', 422, fieldErrors(parsed.error));
    }

    const { name, content, rating, designation, company, avatar, image, website } = parsed.data;

    if (website && website.length > 0) {
      // Honeypot: acknowledge, store nothing.
      return created({ received: true }, 'Thanks for your feedback.');
    }

    await db();

    const count = await Testimonial.countDocuments();

    const document = await Testimonial.create({
      publicId: createId('testimonial'),
      name,
      content,
      rating,
      designation,
      company,
      avatar,
      image,
      status: 'pending',
      displayOrder: count,
    });

    // The response intentionally omits the record: a public submitter has no
    // business reading back stored rows, and `status` reveals moderation state.
    return created(
      { id: document.publicId },
      'Thanks - your feedback has been submitted for review.',
    );
  } catch (error) {
    const { status, message } = dbErrorStatus(error);
    if (status === 500) return handleRouteError(error, 'POST /api/testimonials');
    return fail(message, status);
  }
}

/**
 * GET /api/testimonials  (ADMIN ONLY)
 *
 * Paginated list of every testimonial, published or not. Public visitors read
 * published testimonials through `GET /api/cms`, which filters server-side.
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
    if (status === 'published' || status === 'pending') filter.status = status;

    const [items, total] = await Promise.all([
      Testimonial.find(filter)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Array<Record<string, unknown>>>(),
      Testimonial.countDocuments(filter),
    ]);

    return ok({
      items: items.map((item) => ({
        id: item.publicId,
        name: item.name,
        content: item.content,
        rating: item.rating,
        designation: item.designation,
        company: item.company,
        avatar: item.avatar,
        image: item.image,
        status: item.status,
        displayOrder: item.displayOrder,
        createdAt: new Date(item.createdAt as string).toISOString(),
      })),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    return handleRouteError(error, 'GET /api/testimonials');
  }
}

/**
 * PUT /api/testimonials  (ADMIN ONLY + CSRF)
 *
 * Body: `{ id, ...fields }`. Supports edit, publish and unpublish in one call;
 * only the fields present in the body are updated, so this cannot mass-assign.
 */
export async function PUT(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const { id, ...rest } = body as { id?: unknown } & Record<string, unknown>;
    if (typeof id !== 'string' || !id.trim()) {
      return fail('A testimonial id is required.', 400);
    }

    const parsed = testimonialUpdateSchema.safeParse(rest);
    if (!parsed.success) {
      return fail('Some fields are invalid.', 422, fieldErrors(parsed.error));
    }

    await db();

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'published') update.publishedAt = new Date();

    const result = await Testimonial.findOneAndUpdate(
      { publicId: id },
      { $set: update },
      { new: true },
    ).lean<Record<string, unknown> | null>();

    if (!result) return notFound('Testimonial not found.');

    const message =
      parsed.data.status === 'published'
        ? 'Testimonial published.'
        : parsed.data.status === 'pending'
          ? 'Testimonial unpublished.'
          : 'Testimonial updated.';

    return ok({ id: result.publicId, status: result.status }, { message });
  } catch (error) {
    return handleRouteError(error, 'PUT /api/testimonials');
  }
}

/** DELETE /api/testimonials?id=<publicId>  (ADMIN ONLY + CSRF) */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return fail('Missing testimonial id.', 400);

    await db();

    const result = await Testimonial.deleteOne({ publicId: id });
    if (result.deletedCount === 0) return notFound('Testimonial not found.');

    return ok({ id }, { message: 'Testimonial deleted.' });
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/testimonials');
  }
}