import mongoose, { Schema, type Model } from 'mongoose';

export const SUBMISSION_STATUSES = ['new', 'read', 'archived'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * A message sent through the public contact form.
 *
 * These records contain personal data (name, email, phone) so they are never
 * exposed by a public route - only `GET /api/admin/contact-submissions`
 * (authenticated, admin role) may read them.
 */
const ContactSubmissionSchema = new Schema(
  {
    /** Stable string id matching the shape the admin dashboard already renders. */
    publicId: { type: String, required: true, unique: true },

    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, index: true },
    phone: { type: String, trim: true, maxlength: 32, default: '' },
    interest: { type: String, trim: true, maxlength: 160, default: '' },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },

    status: { type: String, enum: SUBMISSION_STATUSES, required: true, default: 'new', index: true },

    // Honeypot / spam signals. Never rendered publicly.
    ipHash: { type: String, default: null, index: true },
    userAgent: { type: String, default: null, maxlength: 200 },
    markedSpam: { type: Boolean, required: true, default: false, index: true },
  },
  { timestamps: true },
);

// Admin listing is always "newest first, optionally filtered by status".
ContactSubmissionSchema.index({ createdAt: -1 });
ContactSubmissionSchema.index({ status: 1, createdAt: -1 });

export type ContactSubmissionDoc = mongoose.Document & {
  publicId: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  status: SubmissionStatus;
  ipHash: string | null;
  userAgent: string | null;
  markedSpam: boolean;
};

export const ContactSubmission: Model<ContactSubmissionDoc> =
  (mongoose.models.ContactSubmission as Model<ContactSubmissionDoc>) ||
  mongoose.model<ContactSubmissionDoc>('ContactSubmission', ContactSubmissionSchema);