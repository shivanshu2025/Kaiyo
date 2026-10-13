import mongoose, { Schema, type Model } from 'mongoose';

export const LEAD_STATUSES = ['new', 'contacted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/**
 * An inquiry submitted through a solution detail page.
 *
 * These records contain personal data (name, email, phone) so they are never
 * exposed by a public route - only authenticated admins may read them, via
 * `GET /api/admin/leads`.
 *
 * There is deliberately no public read path and no soft delete: a lead is a
 * business record, so it is only ever removed by an authenticated admin.
 */
const LeadSchema = new Schema(
  {
    /** Stable string id, matching the shape the rest of the API uses. */
    publicId: { type: String, required: true, unique: true },

    /** The solution the visitor was looking at, so leads can be attributed. */
    solutionSlug: { type: String, required: true, trim: true, maxlength: 120, index: true },

    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
    phone: { type: String, trim: true, maxlength: 32, default: '' },
    company: { type: String, trim: true, maxlength: 160, default: '' },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },

    status: { type: String, enum: LEAD_STATUSES, required: true, default: 'new', index: true },

    // Spam signals. Salted hash only - never the raw address, so a database
    // disclosure does not hand over a list of visitor IPs.
    ipHash: { type: String, default: null, index: true },
    userAgent: { type: String, default: null, maxlength: 200 },
    markedSpam: { type: Boolean, required: true, default: false, index: true },
  },
  { timestamps: true },
);

// Admin listing is "newest first, optionally filtered by status".
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ solutionSlug: 1, createdAt: -1 });

export type LeadDoc = mongoose.Document & {
  publicId: string;
  solutionSlug: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  status: LeadStatus;
  ipHash: string | null;
  userAgent: string | null;
  markedSpam: boolean;
};

export const Lead: Model<LeadDoc> =
  (mongoose.models.Lead as Model<LeadDoc>) || mongoose.model<LeadDoc>('Lead', LeadSchema);