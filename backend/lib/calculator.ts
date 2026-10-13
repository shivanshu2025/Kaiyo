import { readCalculatorContent } from './cms-store';
import type { CalculatorContent, CalculatorTier } from '@/lib/cms-types';

/**
 * Server-authoritative calculator logic.
 *
 * The commission percentage is always read from the persisted tier table. A
 * client may send only a project value and a role name - it can never send its
 * own percentage or total, so a modified frontend cannot inflate the quoted
 * earnings. The public page calls the same function through
 * `POST /api/calculator/quote`, which means the displayed figure and the quoted
 * figure always agree.
 */

export type QuoteInput = {
  projectValue: number;
  role: string;
};

export type Quote = {
  projectValue: number;
  role: string;
  title: string;
  percentage: number;
  earnings: number;
  currency: string;
  maxEarning: number;
  /** True when `earnings` was capped by `calculatorLogic.maxEarning`. */
  capped: boolean;
};

function enabledTiers(content: CalculatorContent): CalculatorTier[] {
  const tiers = (content.tiers ?? [])
    .filter((tier) => tier && tier.isEnabled !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return tiers.length > 0
    ? tiers
    : // Fall back to every tier when none is explicitly enabled, so the
      // calculator still works on a freshly seeded document.
      [...(content.tiers ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Resolves a submitted role label to a persisted tier. */
export function findTier(content: CalculatorContent, role: string): CalculatorTier | null {
  const wanted = role.trim().toLowerCase();

  // A whitespace-only role would otherwise match every tier in the substring
  // fallback below (`"".includes(x)` is true for all x), returning the sole tier on
  // a single-tier document. An empty label is never a real role.
  if (!wanted) return null;

  const tiers = enabledTiers(content);

  const exact = tiers.find((tier) => tier.title.trim().toLowerCase() === wanted);
  if (exact) return exact;

  // Tolerate a mismatch between the seeded titles and what a client sends by
  // falling back to a unique substring match.
  const partial = tiers.filter((tier) => tier.title.trim().toLowerCase().includes(wanted));
  return partial.length === 1 ? partial[0] : null;
}

/**
 * Clamps a submitted project value into the configured, validated range.
 * Returns the clamped value - the caller's number is never trusted verbatim.
 */
export function clampProjectValue(content: CalculatorContent, value: number): number {
  const { minValue, maxValue, defaultValue } = content.projectValue;
  const safeMin = Number.isFinite(minValue) ? Math.max(0, minValue) : 0;
  const safeMax = Number.isFinite(maxValue) && maxValue > safeMin ? maxValue : safeMaxFallback(content);
  const numeric = Number.isFinite(value) ? value : defaultValue;

  return Math.min(safeMax, Math.max(safeMin, numeric));
}

function safeMaxFallback(content: CalculatorContent): number {
  const configured = Number(content.projectValue?.maxValue);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return 10_000_000;
}

/** Percentages must be within 0-100; anything else falls back to 0. */
export function sanitisePercentage(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, numeric));
}

/**
 * Produces the authoritative quote. Pure and deterministic so the public page,
 * the admin preview and the API always return byte-identical results.
 */
export function calculateQuote(content: CalculatorContent, input: QuoteInput): Quote {
  const tier = findTier(content, input.role);

  const projectValue = clampProjectValue(content, input.projectValue);
  const percentage = sanitisePercentage(tier?.percentage ?? 0);

  let earnings = (projectValue * percentage) / 100;

  // `calculatorLogic.rounding` is the number of decimal places to keep.
  const rounding = Math.min(6, Math.max(0, Math.round(content.calculatorLogic?.rounding ?? 0)));
  earnings = Number(earnings.toFixed(rounding));

  const maxEarning = Number(content.calculatorLogic?.maxEarning ?? 0);
  const capped = Number.isFinite(maxEarning) && maxEarning > 0 && earnings > maxEarning;
  if (capped) earnings = maxEarning;

  return {
    projectValue,
    role: tier?.title ?? input.role,
    title: tier?.title ?? input.role,
    percentage,
    earnings,
    currency: content.projectValue?.currency || 'INR',
    maxEarning: maxEarning || earnings,
    capped,
  };
}

/** Convenience wrapper that loads the current calculator settings first. */
export async function quoteForRequest(input: QuoteInput): Promise<Quote> {
  const cms = await readCalculatorContent();
  return calculateQuote(cms, input);
}

export type { CalculatorContent };