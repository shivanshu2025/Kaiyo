import mongoose, { Schema, type Model } from 'mongoose';

/**
 * Fixed-window counters used by `lib/rate-limit.ts`.
 *
 * Persisting counters means limits hold across serverless invocations and across
 * deployments, which an in-process Map cannot guarantee.
 */
const RateLimitSchema = new Schema(
  {
    // `${bucket}:${identifier}`, e.g. `login:203.0.113.7` or `login:admin@example.com`.
    key: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { timestamps: true },
);

/** MongoDB reaps each window once it expires. */
RateLimitSchema.index({ key: 1 }, { unique: true });
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDoc = mongoose.Document & {
  key: string;
  count: number;
  resetAt: Date;
};

export const RateLimit: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc>) ||
  mongoose.model<RateLimitDoc>('RateLimit', RateLimitSchema);