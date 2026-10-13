import { defaultCmsData } from './cms-defaults';
import type {
  CalculatorContent,
  CmsData,
  ContactSubmission,
  SiteSettings,
  Testimonial,
} from '@/lib/cms-types';
import { db } from './db';
import { CmsContent } from '@/backend/models/CmsContent';
import { Testimonial as TestimonialModel } from '@/backend/models/Testimonial';
import { ContactSubmission as ContactSubmissionModel } from '@/backend/models/ContactSubmission';
import { MediaAsset } from '@/backend/models/MediaAsset';

/**
 * The authoritative content store, now backed by MongoDB.
 *
 * Layout:
 *  - `CmsContent` holds the editable page content as a single document, which
 *    matches how the admin dashboard saves (one section patch at a time) and how
 *    the public pages read it.
 *  - `Testimonial` and `ContactSubmission` are separate collections because they
 *    grow without bound, need pagination, and must be filterable independently.
 *    They are composed back into the returned `CmsData` so every existing admin
 *    component and public page keeps its current shape.
 *
 * The previous `data/cms.json` file is no longer read or written at runtime: a
 * serverless filesystem is ephemeral, so every deploy would have silently
 * discarded all admin edits.
 */

const SINGLETON_ID = 'singleton';

/**
 * Upper bound on how many child records the composed CMS document will carry.
 *
 * Two reasons this must exist:
 *  - `cmsPatchSchema` caps `testimonials.items` at the same number, so a larger
 *    store could not be saved through the API anyway; and
 *  - `syncTestimonials` deletes any record absent from the submitted list, so an
 *    unbounded read would silently truncate the collection on the next save.
 *
 * Paged admin lists are served by `GET /api/testimonials`, which is unbounded.
 */
export const MAX_COMPOSED_CHILDREN = 500;

export function mergeCmsData(stored: Partial<CmsData> | undefined | null): CmsData {
  const base = defaultCmsData;
  const source = stored ?? {};
  return {
    ...base,
    ...source,
    siteSettings: { ...base.siteSettings, ...(source.siteSettings ?? {}) },
    home: { ...base.home, ...(source.home ?? {}) },
    solutions:
      Array.isArray(source.solutions) && source.solutions.length ? source.solutions : base.solutions,
    pricing: { ...base.pricing, ...(source.pricing ?? {}) },
    howItWorks: { ...base.howItWorks, ...(source.howItWorks ?? {}) },
    calculator: { ...base.calculator, ...(source.calculator ?? {}) },
    testimonials: { ...base.testimonials, ...(source.testimonials ?? {}) },
    contact: { ...base.contact, ...(source.contact ?? {}) },
    media: { ...base.media, ...(source.media ?? {}) },
    updatedAt: source.updatedAt || base.updatedAt,
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Shallow copy without one key - used to split a composed document apart. */
function omitKey<T extends Record<string, unknown>>(source: T, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([name]) => name !== key));
}

/* ------------------------------ mapping -------------------------------- */

type LeanTestimonial = {
  publicId: string;
  name: string;
  content: string;
  avatar: string;
  image: string;
  designation: string;
  company: string;
  rating: number;
  status: 'published' | 'pending';
  displayOrder: number;
  createdAt: Date;
};

function toTestimonial(doc: LeanTestimonial): Testimonial {
  return {
    id: doc.publicId,
    name: doc.name,
    content: doc.content,
    avatar: doc.avatar || undefined,
    image: doc.image || undefined,
    designation: doc.designation || undefined,
    company: doc.company || undefined,
    rating: doc.rating,
    status: doc.status,
    displayOrder: doc.displayOrder,
    createdAt: doc.createdAt.toISOString(),
  };
}

type LeanSubmission = {
  publicId: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  status: string;
  markedSpam: boolean;
  createdAt: Date;
};

function toSubmission(doc: LeanSubmission): ContactSubmission {
  return {
    id: doc.publicId,
    name: doc.name,
    email: doc.email,
    phone: doc.phone || undefined,
    interest: doc.interest || undefined,
    message: doc.message,
    status: doc.status as ContactSubmission['status'],
    markedSpam: doc.markedSpam,
    createdAt: doc.createdAt.toISOString(),
  };
}

/* ------------------------------- seeding ------------------------------- */

/**
 * Creates the singleton CMS document and seeds the testimonial collection from
 * the shipped defaults, the first time the store is read.
 *
 * Non-destructive: an existing document is never overwritten, and no collection
 * is dropped or truncated.
 */
async function ensureSeeded(): Promise<void> {
  const existing = await CmsContent.findById(SINGLETON_ID).select('_id').lean();
  if (existing) return;

  const seedTestimonials = defaultCmsData.testimonials.items;

  // Contact submissions and testimonial items live in their own collections, so
  // only the editable sections are written into the CMS document here.
  const { contact, testimonials, ...rest } = defaultCmsData;

  const seedDocument: Record<string, unknown> = {
    ...rest,
    contact: omitKey(contact, 'submissions'),
    testimonials: omitKey(testimonials, 'items'),
  };

  await CmsContent.updateOne(
    { _id: SINGLETON_ID },
    {
      // `updatedAt` is maintained by the schema's `timestamps` option; setting it
      // here as well would make MongoDB reject the update with a path conflict.
      $setOnInsert: { data: seedDocument },
    },
    { upsert: true },
  );

  const count = await TestimonialModel.countDocuments();
  if (count === 0 && seedTestimonials.length > 0) {
    await TestimonialModel.insertMany(
      seedTestimonials.map((item, index) => ({
        publicId: item.id || createId('testimonial'),
        name: item.name,
        content: item.content,
        avatar: item.avatar ?? '',
        image: item.image ?? '',
        designation: item.designation ?? '',
        company: item.company ?? '',
        rating: item.rating,
        status: 'published' as const,
        publishedAt: new Date(item.createdAt),
        displayOrder: index,
      })),
    );
  }
}

/* -------------------------------- reads -------------------------------- */

export async function readContentDocument(): Promise<Partial<CmsData>> {
  await db();
  await ensureSeeded();

  const doc = await CmsContent.findById(SINGLETON_ID).lean<{ data: Partial<CmsData> }>();
  return doc?.data ?? {};
}

/**
 * Full document including contact submissions and every testimonial.
 *
 * ADMIN ONLY - the returned object contains personal data, so callers must be
 * behind an authenticated admin guard. See `readPublicCmsData` for the public
 * projection.
 */
export async function readCmsData(): Promise<CmsData> {
  const content = await readContentDocument();

  const [testimonialDocs, submissionDocs] = await Promise.all([
    TestimonialModel.find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(MAX_COMPOSED_CHILDREN)
      .lean<LeanTestimonial[]>(),
    ContactSubmissionModel.find({})
      .sort({ createdAt: -1 })
      .limit(MAX_COMPOSED_CHILDREN)
      .lean<LeanSubmission[]>(),
  ]);

  const merged = mergeCmsData(content);

  return {
    ...merged,
    testimonials: {
      ...merged.testimonials,
      items: testimonialDocs.map(toTestimonial),
    },
    contact: {
      ...merged.contact,
      submissions: submissionDocs.map(toSubmission),
    },
  };
}

/**
 * Public projection: same content, but contact submissions are stripped and only
 * approved testimonials are included.
 */
export async function readPublicCmsData(): Promise<CmsData> {
  const content = await readContentDocument();

  const testimonialDocs = await TestimonialModel.find({ status: 'published' })
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(MAX_COMPOSED_CHILDREN)
    .lean<LeanTestimonial[]>();

  const merged = mergeCmsData(content);

  return {
    ...merged,
    testimonials: {
      ...merged.testimonials,
      items: testimonialDocs.map(toTestimonial),
    },
    contact: {
      ...merged.contact,
      // Never leak visitor PII to an unauthenticated caller.
      submissions: [],
    },
  };
}

/** Server-rendered settings accessor used by server components. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const content = await readContentDocument();
  return mergeCmsData(content).siteSettings;
}

/**
 * Reads only the calculator section.
 *
 * The public calculator endpoints need nothing else. Calling `readCmsData()` for
 * them would additionally pull every testimonial and up to `MAX_COMPOSED_CHILDREN`
 * contact submissions - personal data - only to discard it.
 */
export async function readCalculatorContent(): Promise<CalculatorContent> {
  return mergeCmsData(await readContentDocument()).calculator;
}

/* -------------------------------- writes ------------------------------- */

/**
 * Applies a partial patch to a single top-level section, shallow-merging nested
 * one level deep exactly as the previous file-based implementation did.
 */
export async function applyCmsPatch(
  patch: Partial<CmsData>,
  adminId?: string,
): Promise<CmsData> {
  const current = await readContentDocument();
  const base = mergeCmsData(current);

  const merged = mergeCmsData({
    ...base,
    ...patch,
    siteSettings: { ...base.siteSettings, ...(patch.siteSettings ?? {}) },
    home: { ...base.home, ...(patch.home ?? {}) },
    pricing: { ...base.pricing, ...(patch.pricing ?? {}) },
    howItWorks: { ...base.howItWorks, ...(patch.howItWorks ?? {}) },
    calculator: { ...base.calculator, ...(patch.calculator ?? {}) },
    testimonials: { ...base.testimonials, ...(patch.testimonials ?? {}) },
    contact: { ...base.contact, ...(patch.contact ?? {}) },
    media: { ...base.media, ...(patch.media ?? {}) },
  } as Partial<CmsData>);

  await db();
  await persistSections(merged, adminId);

  // The Admin > Testimonials screen saves the whole item array through this
  // endpoint, so the child collection is synced here too.
  const testimonialItems = patch.testimonials?.items;
  if (Array.isArray(testimonialItems)) {
    await syncTestimonials(testimonialItems as NonNullable<CmsData['testimonials']['items']>);
  }

  return readCmsData();
}

/**
 * The exact set of ids `readCmsData()` composes into the admin draft, in the same
 * order and with the same cap.
 *
 * `syncTestimonials` needs this to tell "the admin removed this row" apart from
 * "this row was never on the admin's screen", which is the whole point of the
 * guard below.
 */
async function composedTestimonialIds(): Promise<string[]> {
  const docs = await TestimonialModel.find({})
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(MAX_COMPOSED_CHILDREN)
    .select('publicId')
    .lean<Array<{ publicId: string }>>();
  return docs.map((doc) => doc.publicId);
}

/**
 * Upserts the supplied testimonials and removes any that the admin deleted from
 * the list.
 *
 * DELETION IS RESTRICTED TO WHAT THE ADMIN COULD ACTUALLY SEE.
 *
 * The previous implementation deleted "every testimonial whose id is absent from
 * the submitted list". That is only correct when the submitted list is the whole
 * collection, and it never is:
 *
 *  - `readCmsData()` composes at most `MAX_COMPOSED_CHILDREN` rows, so past that
 *    limit the remaining records were never rendered in the dashboard; and
 *  - the dashboard is free to load a single page of the collection.
 *
 * In both cases `$nin` silently destroyed records the admin had no opportunity to
 * remove - real customer testimonials, unrecoverably. The delete set is therefore
 * computed as `composed \ submitted`: a row is only deleted if it *was* in the
 * composed view the admin loaded from and is now gone from it. Anything outside
 * that view is left untouched and can only be removed deliberately, through
 * `DELETE /api/testimonials`.
 */
async function syncTestimonials(items: NonNullable<CmsData['testimonials']['items']>) {
  const usable = items.filter(
    (item): item is (typeof items)[number] & { id: string } =>
      typeof item?.id === 'string' && item.id.trim().length > 0,
  );

  // `id` is optional in `cmsPatchSchema`, so an item can arrive without one. Its
  // upsert filter would then be `{ publicId: undefined }` - which the driver
  // serialises as `{ publicId: null }`. That matches no real record, so MongoDB
  // *inserts* a junk row with a null `publicId`, and the second one violates the
  // unique index: a malformed patch turned into an E11000 500 and a stray document.
  // Dropping those rows here keeps the write to records that can actually be
  // addressed, which is the same guard `composedTestimonialIds` relies on.
  if (usable.length !== items.length) {
    console.warn(
      `[cms] testimonial sync: ignored ${items.length - usable.length} submitted item(s) with no id.`,
    );
  }

  const keptIds = new Set(usable.map((item) => item.id).filter(Boolean));

  const composedIds = await composedTestimonialIds();
  const removedIds = composedIds.filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    await TestimonialModel.deleteMany({ publicId: { $in: removedIds } });
  }

  const total = await TestimonialModel.countDocuments();
  if (total > MAX_COMPOSED_CHILDREN) {
    console.warn(
      `[cms] testimonial sync: ${total} records exist but only ${MAX_COMPOSED_CHILDREN} can be shown at ` +
        'once. Records outside the loaded list were left untouched - remove them individually ' +
        'through DELETE /api/testimonials.',
    );
  }

  if (usable.length === 0) return;

  await TestimonialModel.bulkWrite(
    usable.map((item, index) => ({
      updateOne: {
        filter: { publicId: item.id },
        update: {
          $set: {
            name: item.name,
            content: item.content,
            avatar: item.avatar ?? '',
            image: item.image ?? '',
            designation: item.designation ?? '',
            company: item.company ?? '',
            rating: item.rating,
            // A new item the admin created in the dashboard defaults to published
            // so it is not silently invisible; form submissions arrive as pending
            // through POST /api/testimonials and are unaffected by this path.
            status: item.status ?? 'published',
            displayOrder: item.displayOrder ?? index,
            ...(item.status === 'published' ? { publishedAt: new Date() } : {}),
          },
        },
        upsert: true,
      },
    })),
  );
}

async function persistSections(data: CmsData, adminId?: string): Promise<void> {
  const { testimonials, contact, ...rest } = data;

  await CmsContent.updateOne(
    { _id: SINGLETON_ID },
    {
      $set: {
        data: {
          ...rest,
          contact: omitKey(contact, 'submissions'),
          testimonials: omitKey(testimonials, 'items'),
        },
        ...(adminId ? { updatedBy: adminId } : {}),
      },
    },
    { upsert: true },
  );
}

/* ------------------------------- helpers ------------------------------- */

export async function countDocuments(): Promise<{
  solutions: number;
  solutionCategories: number;
  solutionCards: number;
  pricingPlans: number;
  testimonials: number;
  publishedTestimonials: number;
  partnerTiers: number;
  calculatorTiers: number;
  submissions: number;
  mediaImages: number;
  mediaVideos: number;
}> {
  await db();

  const data = mergeCmsData(await readContentDocument());

  const solutionCards = (data.solutions ?? []).reduce((total, solution) => {
    const sections = (solution as { data?: { sections?: Array<{ cards?: unknown[] }> } })?.data
      ?.sections;
    if (!Array.isArray(sections)) return total;
    return (
      total +
      sections.reduce(
        (sectionTotal, section) =>
          sectionTotal + (Array.isArray(section?.cards) ? section.cards.length : 0),
        0,
      )
    );
  }, 0);

  const [testimonials, publishedTestimonials, submissions, mediaImages, mediaVideos] =
    await Promise.all([
      TestimonialModel.countDocuments(),
      TestimonialModel.countDocuments({ status: 'published' }),
      ContactSubmissionModel.countDocuments(),
      MediaAsset.countDocuments({ kind: 'image' }),
      MediaAsset.countDocuments({ kind: 'video' }),
    ]);

  return {
    solutions: data.solutions?.length ?? 0,
    solutionCategories: new Set((data.solutions ?? []).map((s) => s.category).filter(Boolean)).size,
    solutionCards,
    pricingPlans: data.pricing?.plans?.length ?? 0,
    testimonials,
    publishedTestimonials,
    partnerTiers: data.howItWorks?.tiers?.length ?? 0,
    calculatorTiers: data.calculator?.tiers?.length ?? 0,
    submissions,
    mediaImages,
    mediaVideos,
  };
}
