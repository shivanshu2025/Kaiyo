import mongoose, { Schema, type Model, type Types } from 'mongoose';

export const MAX_SESSION_MS = 1000 * 60 * 60 * 12;

/**
 * A server-side admin session.
 *
 * The browser receives an opaque 256-bit random token; only its SHA-256 digest is
 * stored, so a database disclosure does not hand out usable cookies. Because the
 * session record is authoritative, logout and "revoke other devices" are immediate
 * and irreversible - there is nothing left to forge.
 */
const AdminSessionSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },

    tokenHash: { type: String, required: true, unique: true, index: true },

    createdAtIp: { type: String, default: null, maxlength: 64 },
    userAgent: { type: String, default: 'Unknown device', maxlength: 200 },

    lastSeenAt: { type: Date, required: true, default: () => new Date() },
    expiresAt: { type: Date, required: true },

    /**
     * Last time we saw evidence of user activity. Sessions expire on inactivity
     * (sliding window), not merely on age.
     */
    lastActivityAt: { type: Date, required: true, default: () => new Date() },

    revokedAt: { type: Date, default: null },
    revokedByIp: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true },
);

/** TTL index: expired sessions are reaped by MongoDB itself. */
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AdminSessionSchema.index({ adminId: 1, revokedAt: 1 });
/** Rate-limit + "most recent sessions" lookups. */
AdminSessionSchema.index({ adminId: 1, lastActivityAt: -1 });

export type AdminSessionDoc = mongoose.Document & {
  adminId: Types.ObjectId;
  tokenHash: string;
  createdAtIp: string | null;
  userAgent: string;
  lastSeenAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedByIp: string | null;
};

export const AdminSession: Model<AdminSessionDoc> =
  (mongoose.models.AdminSession as Model<AdminSessionDoc>) ||
  mongoose.model<AdminSessionDoc>('AdminSession', AdminSessionSchema);