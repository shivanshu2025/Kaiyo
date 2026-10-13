import { NextRequest } from 'next/server';
import { db, dbErrorStatus } from '@/backend/lib/db';
import { Lead } from '@/backend/models/Lead';
import { readContentDocument, mergeCmsData } from '@/backend/lib/cms-store';
import { clientIp, consumeRateLimit, hashIp, RATE_LIMITS } from '@/backend/lib/rate-limit';
import { fieldErrors, leadSubmissionSchema } from '@/backend/lib/validation';
import { created, fail, handleRouteError, readJson, tooManyRequests } from '@/backend/lib/api-response';
import { env } from '@/backend/lib/env';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads  (PUBLIC)
 *
 * Body: `{ solutionSlug, name, email, message, phone?, company?, website? }`
 *
 * Persists a solution detail inquiry to the `leads` collection.
 *
 * Spam handling mirrors the contact form:
 *  - `website` is a honeypot; a filled value is accepted silently with a 201 so the
 *    bot gets no signal, but nothing is written.
 *  - Rate limited per IP (3 / 30 min) and per solution slug (20 / 30 min), so one
 *    visitor cannot flood a single product page.
 *  - The submitter's IP is stored only as a salted hash.
 *
 * The solution slug is verified against the CMS document before the lead is
 * stored, so the collection cannot be filled with leads for pages that do not
 * exist.
 *
 * Returns 201 only after MongoDB has acknowledged the insert. The stored record is
 * never echoed back, and no public endpoint can read leads.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);

    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = leadSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Please check the highlighted fields.', 422, fieldErrors(parsed.error));
    }

    const { solutionSlug, name, email, message, phone, company, website } = parsed.data;

    // Honeypot: report success, store nothing.
    if (website && website.length > 0) {
      return created({ received: true }, 'Thanks - your message has been received.');
    }

    const ipLimit = await consumeRateLimit(ip, RATE_LIMITS.lead);
    if (!ipLimit.allowed) {
      return tooManyRequests(
        'You have sent several inquiries recently. Please try again later.',
        ipLimit.retryAfterSeconds,
      );
    }

    const slugLimit = await consumeRateLimit(solutionSlug, RATE_LIMITS.leadPerSolution);
    if (!slugLimit.allowed) {
      return tooManyRequests(
        'Too many inquiries for this service right now. Please try again later.',
        slugLimit.retryAfterSeconds,
      );
    }

    await db();

    // Reject slugs that are not in the CMS, so leads always map to a real page.
    const cms = mergeCmsData(await readContentDocument());
    const known = (cms.solutions ?? []).some((solution) => solution.slug === solutionSlug);
    if (!known) return fail('That service is no longer available.', 404);

    const document = await Lead.create({
      publicId: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      solutionSlug,
      name,
      email,
      phone,
      company,
      message,
      status: 'new',
      ipHash: hashIp(ip, env.sessionSecret ?? env.siteUrl),
      userAgent: (request.headers.get('user-agent') || '').slice(0, 200) || null,
      markedSpam: false,
    });

    // Acknowledge only after the driver confirmed the write.
    return created(
      { id: document.publicId },
      'Thanks - your inquiry has been received. We will contact you soon.',
    );
  } catch (error) {
    const { status, message } = dbErrorStatus(error);
    if (status === 500) return handleRouteError(error, 'POST /api/leads');
    return fail(message, status);
  }
}