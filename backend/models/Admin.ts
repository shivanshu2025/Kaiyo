import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const ADMIN_ROLES = ['admin', 'editor'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * An administrator account.
 *
 * There is deliberately no public signup path that can create a document in this
 * collection - accounts are only created by `scripts/create-admin.js` or by an
 * authenticated admin changing their own PIN.
 *
 * `email` is an identity/ownership record, **not** a sign-in identifier: the admin
 * login is PIN-only.
 */
const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // 254 is the RFC 5321 maximum length for an email address.
      maxlength: 254,
    },
    name: { type: String, required: true, trim: true, maxlength: 120, default: 'Administrator' },

    // bcrypt cost 12 (never Argon2id) hashing the admin PIN. The plaintext PIN is
    // never stored. The field is `select: false` so it is never accidentally
    // attached to a response body - every caller must ask for it by name.
    passwordHash: { type: String, required: true, select: false },
    passwordUpdatedAt: { type: Date, required: true, default: () => new Date() },

    role: { type: String, enum: ADMIN_ROLES, required: true, default: 'admin', index: true },
    active: { type: Boolean, required: true, default: true, index: true },

    failedAttempts: { type: Number, required: true, default: 0 },
    lastFailedAt: { type: Date, default: null },
    lockedUntil: { type: Date, default: null },

    /**
     * Per-account security policy, surfaced and enforced by the Admin Settings
     * screen. Clamped again in `lib/security-settings.ts` on every read, so a
     * hand-edited database value can never widen the limits.
     */
    security: {
      maxFailedAttempts: { type: Number, default: 5, min: 1, max: 50 },
      lockoutMinutes: { type: Number, default: 15, min: 1, max: 1440 },
      autoLogoutMinutes: { type: Number, default: 60, min: 5, max: 720 },
    },

    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    passwordChangedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true },
);

/**
 * NOTE: the unique index on `email` is declared once, by `unique: true` on the field
 * above. It used to be *also* declared here, which Mongoose reports as
 * "Duplicate schema index on {email:1}" on every model compile. Both declarations
 * describe the same index, so removing this one changes nothing that is created -
 * in development through `autoIndex`, in production through
 * `backend/scripts/setup-indexes.js`, which carries its own explicit manifest.
 */

export type AdminDoc = mongoose.Document & {
  email: string;
  name: string;
  passwordHash: string;
  passwordUpdatedAt: Date;
  role: AdminRole;
  active: boolean;
  failedAttempts: number;
  lastFailedAt: Date | null;
  lockedUntil: Date | null;
  security: {
    maxFailedAttempts: number;
    lockoutMinutes: number;
    autoLogoutMinutes: number;
  };
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  passwordChangedBy: Types.ObjectId | null;
};

export const Admin: Model<AdminDoc> =
  (mongoose.models.Admin as Model<AdminDoc>) ||
  mongoose.model<AdminDoc>('Admin', AdminSchema);