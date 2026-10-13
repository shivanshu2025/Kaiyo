import { z } from 'zod';
import { PASSWORD_MAX_BYTES, validatePasswordStrength } from './password';

/**
 * Server-side request validation.
 *
 * Everything that crosses the network boundary is parsed here before it reaches a
 * model or the CMS store. The schemas intentionally describe the *shape* the admin
 * UI already sends rather than inventing a new contract.
 */

/* ------------------------------ primitives ------------------------------ */

const trimmed = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => trimmed(max).optional().default('');

/** Accepts only http(s) URLs and site-relative paths - blocks `javascript:` and `data:`. */
const safeUrl = trimmed(2048).refine(
  (value) => {
    if (!value) return true;
    if (value.startsWith('/') && !value.startsWith('//')) return true;
    try {
      const { protocol } = new URL(value);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Must be an http(s) URL or a site-relative path.' },
);

/** Optional media URL - empty string when no image was supplied. */
const optionalUrl = safeUrl.optional().default('');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Enter a valid email address.');

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

/**
 * The admin PIN.
 *
 * Two different questions are asked about a PIN, and they used to share one
 * digits-only regex - which is why the Change Admin PIN screen rejected every PIN
 * its own hint recommended.
 *
 *  - **Signing in** must accept whatever is already stored. A PIN set before the
 *    current policy existed is still valid, so sign-in validates *shape* only.
 *  - **Choosing a new PIN** applies the strength policy in `lib/password.ts`
 *    (`validatePasswordStrength`): at least 10 characters with an uppercase letter,
 *    a lowercase letter and a number. That helper is the single source of truth, so
 *    the server and the wording on the form cannot drift apart.
 *
 * Sign-in compares the candidate against every active administrator with
 * `bcrypt.compare`, so the work done does not depend on which account matched, and
 * the per-source rate limit and lockout bound guessing. The upper bound below is
 * bcrypt's own: it silently ignores input past 72 **bytes**, so a longer value is
 * rejected rather than truncated (measured in bytes, so multi-byte characters
 * cannot slip through).
 */
const pinWithinBcryptLimit = (value: string) =>
  Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES;

const tooLongMessage = `The PIN must be at most ${PASSWORD_MAX_BYTES} bytes when encoded.`;

/** Sign-in: any non-empty, hashable PIN. No strength rule - it is an existing credential. */
const existingPin = z
  .string()
  .trim()
  .min(1, 'Enter your PIN.')
  .refine(pinWithinBcryptLimit, { message: tooLongMessage });

/** Authorising a change: the current PIN, again shape-only, verified by bcrypt downstream. */
const currentPin = z
  .string()
  .trim()
  .min(1, 'Enter your current PIN.')
  .refine(pinWithinBcryptLimit, { message: tooLongMessage });

/** Choosing a new PIN: the advertised strength policy, enforced in one place. */
const newPin = z
  .string()
  .trim()
  .min(1, 'Enter a new PIN.')
  .superRefine((value, ctx) => {
    const problem = validatePasswordStrength(value);
    if (problem) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem, path: [] });
    }
  });

/* -------------------------------- auth ---------------------------------- */

/** Body of `POST /api/admin/login` - a PIN and nothing else. */
export const pinLoginSchema = z.object({
  pin: existingPin,
});

/** Body of `POST /api/admin/pin`. */
export const changePinSchema = z
  .object({
    currentPin,
    newPin,
    // Its own message on mismatch, so the form can point at the field that is wrong
    // rather than reporting the same problem twice.
    confirmPin: z.string().trim().min(1, 'Confirm the new PIN.').refine(pinWithinBcryptLimit, {
      message: tooLongMessage,
    }),
  })
  .refine((value) => value.newPin === value.confirmPin, {
    message: 'New PIN and confirmation do not match.',
    path: ['confirmPin'],
  })
  .refine((value) => value.newPin !== value.currentPin, {
    message: 'New PIN must be different from the current PIN.',
    path: ['newPin'],
  });

export const securitySettingsSchema = z
  .object({
    maxFailedAttempts: z.number().int().min(1).max(50).optional(),
    lockoutMinutes: z.number().int().min(1).max(1440).optional(),
    autoLogoutMinutes: z.number().int().min(5).max(720).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'No settings supplied.');

export const revokeSessionSchema = z
  .object({
    id: objectId.optional(),
    others: z.boolean().optional(),
    all: z.boolean().optional(),
  })
  .refine((value) => !value.id || (!value.others && !value.all), {
    message: 'Provide either a session id, `others`, or `all`.',
  });

/* ------------------------------ contact form ---------------------------- */

export const contactSubmissionSchema = z.object({
  name: requiredText(120),
  email,
  // Optional honeypot: real users never see it, bots usually fill it in.
  website: optionalText(200),
  message: requiredText(5000),
  interest: optionalText(160),
  phone: trimmed(32)
    .refine((value) => value === '' || /^[+()\-.\s\d]{6,32}$/.test(value), {
      message: 'Enter a valid phone number.',
    })
    .optional()
    .default(''),
  // Submitted timestamp + nonce used by the client to reject duplicate submits.
  submittedAt: z.number().int().positive().optional(),
});

/* ------------------------------ testimonials --------------------------- */

const testimonialFieldsSchema = z.object({
  name: requiredText(120),
  content: requiredText(4000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  designation: optionalText(160),
  company: optionalText(160),
  avatar: optionalUrl,
  image: optionalUrl,
  // Honeypot, same reasoning as the contact form.
  website: optionalText(200),
});

export const testimonialSubmissionSchema = testimonialFieldsSchema;

const testimonialUpdateFieldsSchema = testimonialFieldsSchema
  .omit({ website: true })
  .partial()
  .extend({
    status: z.enum(['published', 'pending']).optional(),
    displayOrder: z.number().int().min(0).max(10_000).optional(),
  });

export const testimonialUpdateSchema = testimonialUpdateFieldsSchema.refine(
  (value) => Object.keys(value).length > 0,
  'No fields supplied.',
);

/* --------------------------------- CMS ---------------------------------- */

const cardSchema = z.object({
  src: trimmed(2048),
  title: optionalText(200),
  description: optionalText(2000),
});

const solutionSectionSchema = z.object({
  title: requiredText(200),
  cards: z.array(cardSchema).max(200),
});

/**
 * `solutions[].data` is validated with this rather than `solutionSectionSchema`:
 * each solution type has its own internal layout (hero/rows/cards and more), so
 * the payload is checked for shape-safety and size instead of a single fixed
 * structure. Keeping the reference here documents the expected shape.
 */
void solutionSectionSchema;

const pricingPlanSchema = z.object({
  id: trimmed(64),
  title: requiredText(200),
  description: trimmed(2000),
  price: requiredText(64),
  color: optionalText(64),
  features: z.array(requiredText(500)).max(80),
});

const partnerTierSchema = z.object({
  name: requiredText(120),
  percentage: trimmed(32),
  description: trimmed(2000),
  features: z.array(requiredText(500)).max(80),
  color: optionalText(64),
});

const calculatorTierSchema = z.object({
  title: requiredText(120),
  // Commission percentages are re-validated server-side before any calculation.
  percentage: z.number().min(0).max(100),
  description: trimmed(2000),
  icon: optionalText(64),
  accentColor: optionalText(64),
  displayOrder: z.number().int().min(0).max(10_000),
  isEnabled: z.boolean(),
});

const faqSchema = z.object({ question: requiredText(500), answer: requiredText(4000) });

const socialLinkSchema = z.object({ label: requiredText(80), url: safeUrl });

const siteSettingsSchema = z.object({
  logo: safeUrl,
  whatsappNumber: trimmed(20).regex(/^\d{6,20}$/, 'Enter digits only (including country code).'),
  phoneNumber: trimmed(20).regex(/^\d{6,20}$/, 'Enter digits only.'),
  socialLinks: z.array(socialLinkSchema).max(20),
});

const homeSchema = z.object({
  hero: z.object({
    title: requiredText(300),
    subtitle: requiredText(300),
    description: requiredText(2000),
    image: trimmed(2048),
    logoImage: trimmed(2048),
    ctaText: requiredText(200),
    ctaLink: safeUrl,
  }),
  collection: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    items: z
      .array(z.object({ title: requiredText(200), text: requiredText(2000) }))
      .max(40),
  }),
  projectShowcase: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    projects: z
      .array(
        z.object({
          title: requiredText(200),
          description: requiredText(2000),
          image: trimmed(2048),
        }),
      )
      .max(60),
  }),
  process: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    steps: z
      .array(
        z.object({
          number: requiredText(20),
          title: requiredText(200),
          description: requiredText(2000),
        }),
      )
      .max(40),
  }),
  finalCta: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    buttonText: requiredText(200),
    buttonLink: safeUrl,
    listItems: z
      .array(z.object({ title: requiredText(200), desc: requiredText(1000) }))
      .max(40),
  }),
});

const howItWorksSchema = z.object({
  heroTitle: requiredText(300),
  heroDescription: requiredText(2000),
  heroImage: trimmed(2048),
  tiers: z.array(partnerTierSchema).max(40),
  workflowSteps: z
    .array(
      z.object({
        number: requiredText(20),
        title: requiredText(200),
        description: requiredText(2000),
      }),
    )
    .max(40),
  yourRole: z.array(requiredText(1000)).max(40),
  ourRole: z.array(requiredText(1000)).max(40),
  whyChooseUs: z
    .array(
      z.object({
        icon: optionalText(64),
        title: requiredText(200),
        description: requiredText(2000),
      }),
    )
    .max(40),
  faqs: z.array(faqSchema).max(60),
  calculator: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    defaultProjectValue: z.number().min(0).max(100_000_000),
    defaultRole: requiredText(120),
    defaultPercentage: z.number().min(0).max(100),
    defaultEarnings: z.number().min(0).max(100_000_000),
    buttonText: requiredText(200),
    buttonLink: safeUrl,
  }),
  ctaTitle: requiredText(300),
  ctaDescription: requiredText(2000),
  ctaWhatsApp: trimmed(2048),
  ctaPrimaryText: requiredText(200),
  ctaSecondaryText: requiredText(200),
  ctaSecondaryLink: safeUrl,
  ctaBackgroundImage: trimmed(2048),
});

const calculatorSchema = z.object({
  heroSection: z.object({
    badgeText: requiredText(200),
    heading: requiredText(300),
    highlightText: requiredText(300),
    description: requiredText(2000),
  }),
  projectValue: z.object({
    minValue: z.number().min(0).max(100_000_000),
    maxValue: z.number().min(0).max(100_000_000),
    defaultValue: z.number().min(0).max(100_000_000),
    currency: requiredText(20),
    capLabel: requiredText(200),
  }),
  calculatorLogic: z.object({
    maxEarning: z.number().min(0).max(100_000_000),
    rounding: z.number().int().min(0).max(1000),
    displayFormat: requiredText(64),
  }),
  resultCard: z.object({
    heading: requiredText(300),
    label: requiredText(200),
    emptyStateMessage: requiredText(1000),
    currency: requiredText(20),
    resultFormatting: requiredText(64),
  }),
  ctaCard: z.object({
    heading: requiredText(300),
    description: requiredText(2000),
    primaryButton: requiredText(200),
    secondaryButton: requiredText(200),
    whatsappLink: trimmed(2048),
    joinButtonLink: safeUrl,
    backgroundImage: trimmed(2048),
  }),
  globalSettings: z.object({
    currencySymbol: requiredText(20),
    buttonLabels: z.object({ calculate: requiredText(100), processing: requiredText(100) }),
    animationToggle: z.boolean(),
    calculationDelay: z.number().int().min(0).max(10_000),
  }),
  tiers: z.array(calculatorTierSchema).max(40),
});

/**
 * A solution's `data` payload is page-builder content whose internal shape varies
 * per solution type, so it is accepted as an arbitrary JSON object - but bounded,
 * to stop a client storing a multi-megabyte blob in the CMS document.
 */
const solutionPayload = z.record(z.unknown()).refine(
  (value) => JSON.stringify(value).length <= 512_000,
  { message: 'Solution content is too large.' },
);

export const cmsPatchSchema = z
  .object({
    siteSettings: siteSettingsSchema.partial().optional(),
    home: homeSchema.partial().optional(),
    solutions: z
      .array(
        z.object({
          slug: z
            .string()
            .trim()
            .min(1)
            .max(120)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, dash-separated slug.'),
          label: requiredText(200),
          category: requiredText(200),
          data: solutionPayload,
        }),
      )
      .max(200)
      .optional(),
    pricing: z
      .object({
        hero: z.object({ heading: requiredText(300), description: requiredText(2000) }).partial(),
        plans: z.array(pricingPlanSchema).max(60).optional(),
      })
      .optional(),
    howItWorks: howItWorksSchema.partial().optional(),
    calculator: calculatorSchema.partial().optional(),
    testimonials: z
      .object({
        // `.optional()` as well as `.partial()`: `partial()` alone still requires
        // the `hero` key to be *present*, which made a patch carrying only
        // `items` - the natural shape for a moderation screen - fail with a
        // confusing "testimonials.hero: Required" instead of being accepted.
        hero: z.object({ heading: requiredText(300), description: requiredText(2000) }).partial().optional(),
        // The existing Admin > Testimonials screen edits the whole array and
        // saves it through PUT /api/cms, so the item list is part of the patch.
        items: z
          .array(
            testimonialUpdateFieldsSchema
              .extend({
                id: trimmed(120),
                status: z.enum(['published', 'pending']).optional(),
                displayOrder: z.number().int().min(0).max(10_000).optional(),
              })
              .partial(),
          )
          .max(500)
          .optional(),
      })
      .optional(),
    contact: z
      .object({
        heading: requiredText(300),
        description: requiredText(2000),
        contactInfoHeading: requiredText(300),
        contactInfoDescription: requiredText(2000),
        phone: trimmed(20),
        whatsapp: trimmed(20),
        faqs: z.array(faqSchema).max(60).optional(),
      })
      .partial()
      .optional(),
    media: z
      .object({
        images: z.array(z.object({ path: trimmed(2048), name: requiredText(200) })).max(500),
        videos: z.array(z.object({ path: trimmed(2048), name: requiredText(200) })).max(200),
      })
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'No content supplied.');

/* ------------------------------ solution leads -------------------------- */

/**
 * A solution detail inquiry.
 *
 * `website` is a honeypot (hidden from real visitors, usually filled in by bots),
 * matching the contact and testimonial forms.
 */
export const leadSubmissionSchema = z.object({
  solutionSlug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, dash-separated slug.'),
  name: requiredText(120),
  email,
  message: requiredText(5000),
  phone: trimmed(32)
    .refine((value) => value === '' || /^[+()\-.\s\d]{6,32}$/.test(value), {
      message: 'Enter a valid phone number.',
    })
    .optional()
    .default(''),
  company: optionalText(160),
  website: optionalText(200),
});

/* ------------------------------- calculator ----------------------------- */

/**
 * The public calculator sends a project value and a role title. The commission
 * percentage is looked up server-side from the persisted tiers - it is never
 * accepted from the client, so a caller cannot inflate their own earnings.
 */
export const calculatorQuoteSchema = z.object({
  projectValue: z
    .number()
    .finite('Enter a valid project value.')
    .min(0, 'Project value cannot be negative.')
    .max(100_000_000, 'Project value is too large.'),
  role: requiredText(120),
});

/* --------------------------------- media -------------------------------- */

export const mediaQuerySchema = z.object({
  kind: z.enum(['image', 'video']).optional(),
});

/* -------------------------------- exports ------------------------------- */

export type PinLoginInput = z.infer<typeof pinLoginSchema>;
export type ChangePinInput = z.infer<typeof changePinSchema>;
export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type TestimonialSubmissionInput = z.infer<typeof testimonialSubmissionSchema>;
export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>;
export type CmsPatchInput = z.infer<typeof cmsPatchSchema>;
export type LeadSubmissionInput = z.infer<typeof leadSubmissionSchema>;
export type CalculatorQuoteInput = z.infer<typeof calculatorQuoteSchema>;

/** Flattens a ZodError into `{ field: message }` for the API `fields` payload. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const output: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!output[key]) output[key] = issue.message;
  }
  return output;
}