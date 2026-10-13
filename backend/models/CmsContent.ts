import mongoose, { Schema, type Model } from 'mongoose';

/**
 * The editable CMS document.
 *
 * The shape mirrors `CmsData` so every existing admin form and public component
 * keeps working, but the two growing collections (contact submissions and
 * testimonials) live in their own documents - see `ContactSubmission` and
 * `Testimonial` - and are composed back in by `lib/cms-store.ts`.
 *
 * `strict: false` is intentional: the payload is validated by the zod schemas in
 * `lib/validation.ts` before it ever reaches here, and forcing every nested CMS
 * shape into a Mongoose sub-schema would duplicate that definition.
 */
const CmsContentSchema = new Schema(
  {
    _id: { type: String, default: 'singleton' },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true, minimize: false },
);

CmsContentSchema.index({ _id: 1 }, { unique: true });

export type CmsContentDoc = mongoose.Document & {
  data: Record<string, unknown>;
  updatedBy: mongoose.Types.ObjectId | null;
};

export const CmsContent: Model<CmsContentDoc> =
  (mongoose.models.CmsContent as Model<CmsContentDoc>) ||
  mongoose.model<CmsContentDoc>('CmsContent', CmsContentSchema);