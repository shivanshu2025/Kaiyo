import mongoose, { Schema, type Model } from 'mongoose';

/**
 * Client testimonials.
 *
 * Submissions from the public form arrive with `status: 'pending'` and are only
 * returned by the public read path once an admin publishes them, which is what
 * the existing "approved/published" wording in the dashboard requires.
 */
const TestimonialSchema = new Schema(
  {
    /**
     * Stable string id in the shape the existing admin UI already expects
     * (`testimonial-<ts>-<rand>`). Kept alongside the ObjectId so the dashboard
     * components need no changes while the API is free to evolve.
     */
    publicId: { type: String, required: true, unique: true },

    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 4000 },

    avatar: { type: String, trim: true, maxlength: 2048, default: '' },
    image: { type: String, trim: true, maxlength: 2048, default: '' },
    designation: { type: String, trim: true, maxlength: 160, default: '' },
    company: { type: String, trim: true, maxlength: 160, default: '' },

    rating: { type: Number, required: true, min: 1, max: 5 },

    status: {
      type: String,
      enum: ['published', 'pending'] as const,
      required: true,
      default: 'pending',
      index: true,
    },
    publishedAt: { type: Date, default: null },

    // Ordered explicitly so the admin "move up/down" controls keep working.
    displayOrder: { type: Number, required: true, default: 0, index: true },
  },
  { timestamps: true },
);

TestimonialSchema.index({ status: 1, displayOrder: 1, createdAt: -1 });

export type TestimonialDoc = mongoose.Document & {
  publicId: string;
  name: string;
  content: string;
  avatar: string;
  image: string;
  designation: string;
  company: string;
  rating: number;
  status: 'published' | 'pending';
  publishedAt: Date | null;
  displayOrder: number;
};

export const Testimonial: Model<TestimonialDoc> =
  (mongoose.models.Testimonial as Model<TestimonialDoc>) ||
  mongoose.model<TestimonialDoc>('Testimonial', TestimonialSchema);