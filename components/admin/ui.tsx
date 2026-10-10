'use client';

import type { ReactNode } from 'react';

export function Card({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white shadow-sm">
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-stone-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-stone-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-[var(--admin-brand)] focus:ring-1 focus:ring-[var(--admin-brand)] disabled:bg-stone-100';

export const textareaClass = `${inputClass} min-h-[90px] resize-y leading-relaxed`;

export function SaveBar({ saving, onSave, dirty, label = 'Save changes' }: {
  saving: boolean;
  onSave: () => void;
  dirty?: boolean;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-4 flex items-center gap-3 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || dirty === false}
        className="rounded-lg bg-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Saving…' : label}
      </button>
      {dirty === false && !saving && (
        <span className="text-xs text-stone-500">No unsaved changes</span>
      )}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading content…' }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
      <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
      <div className="h-24 animate-pulse rounded-xl bg-stone-100" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-700">Something went wrong</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center">
      <p className="text-sm text-stone-500">{message}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  type = 'button',
  disabled,
  title,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const variants: Record<string, string> = {
    default: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
    primary: 'border border-transparent bg-[var(--admin-brand)] text-white hover:bg-[var(--admin-brand-hover)]',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
    ghost: 'border border-transparent bg-transparent text-stone-600 hover:bg-stone-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}