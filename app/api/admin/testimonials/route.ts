import { NextRequest } from 'next/server';
import { db, dbErrorStatus } from '@/backend/lib/db';
import { Testimonial } from '@/backend/models/Testimonial';
import { createId } from '@/backend/lib/cms-store';
import { requireAdminMutation } from '@/backend/lib/guards';
import { fieldErrors, testimonialSubmissionSchema } from '@/backend/lib/validation';
import { created, fail, handleRouteError, readJson } from '@/backend/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/testimonials  (ADMIN ONLY + CSRF)
 *
 * Body: the same shape as the public submission form, minus the honeypot.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Admin > Testimonials screen used to save by sending the *entire*
 * `testimonials.items` array through `PUT /api/cms`, which handed the server a
 * complete replacement list for the collection. That is only safe when the admin
 * has every record on screen, and it never is: `readCmsData()` composes at most
 * `MAX_COMPOSED_CHILDREN` rows, and the dashboard now loads a single page. Any
 * record outside the loaded page would have been destroyed by the sync.
 *
 * So item records are no longer written through the CMS document at all. They are
 * created, edited, moderated and deleted through the per-record endpoints
 * (`POST` here, `PUT`/`DELETE /api/testimonials`), which address exactly one
 * document and therefore cannot touch anything else. This route is the missing
 * create half of that set - `POST /api/testimonials` is the *public* form and
 * deliberately forces `status: 'pending'`, so it is the wrong door for an
 * administrator who is typing a testimonial in on purpose.
 *
 * Guarded exactly like every other admin write: authenticated `admin` role, CSRF
 * header, and the body is parsed by the existing zod schema before it reaches the
 * model. `status` is not accepted from the caller; an admin-created testimonial
 * is published immediately, which is what the dashboard's "add a testimonial"
 * action has always meant.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminMutation(request);
  if (!guard.ok) return guard.response;

  try {
    const body = await readJson(request);
    if (!body) return fail('Expected a JSON object body.', 400);

    const parsed = testimonialSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return fail('Some fields are invalid.', 422, fieldErrors(parsed.error));
    }

    const { name, content, rating, designation, company, avatar, image } = parsed.data;

    await db();

    // Append after the current last row so a new testimonial does not silently
    // reorder the ones the admin arranged by hand.
    const displayOrder = await Testimonial.countDocuments();

    const document = await Testimonial.create({
      publicId: createId('testimonial'),
      name,
      content,
      rating,
      designation,
      company,
      avatar,
      image,
      status: 'published',
      publishedAt: new Date(),
      displayOrder,
    });

    return created(
      {
        id: document.publicId,
        name: document.name,
        status: document.status,
        displayOrder: document.displayOrder,
      },
      'Testimonial created.',
    );
  } catch (error) {
    const { status, message } = dbErrorStatus(error);
    if (status === 500) return handleRouteError(error, 'POST /api/admin/testimonials');
    return fail(message, status);
  }
}
