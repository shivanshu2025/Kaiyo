'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * The solution inquiry form.
 *
 * Single implementation, shared by the solution detail page and every solution
 * landing page (`components/solutions/SolutionPage.tsx`) so the POST-to-`/api/leads`
 * logic exists in exactly one place.
 *
 * The component renders the modal ONLY - there is no inline card in the page flow.
 * An existing inquiry trigger (the hero "Order Now" button, the banner CTA) asks for
 * it with `openInquiryForm()`, so a solution page carries no visible inquiry markup
 * until the visitor asks for it.
 *
 * Closing persists the dismissal to localStorage, so a refresh, a route change or a
 * remount never brings the popup back on its own - only an explicit click does.
 *
 * The form is only cleared, and the success toast is only shown, once the server has
 * confirmed the write - a failed submission leaves the visitor's text intact. The
 * styling matches the existing solution-detail panel (`#171923` / `#e6e8ee`) so
 * reusing it on a landing page introduces no new visual language.
 */

/** Fired by the existing inquiry triggers; the mounted form listens for it. */
const OPEN_EVENT = 'kaiyo:open-inquiry';

/** Prefix shared by every key this module writes. */
const DISMISSED_PREFIX = 'kaiyo:inquiry-dismissed:';

/** Per-solution dismissal marker, written when the visitor closes the popup. */
const dismissedKey = (slug: string) => `${DISMISSED_PREFIX}${slug}`;

function readDismissed(slug: string): boolean {
  try {
    return window.localStorage.getItem(dismissedKey(slug)) !== null;
  } catch {
    return false;
  }
}

function persistDismissed(slug: string): void {
  try {
    window.localStorage.setItem(dismissedKey(slug), String(Date.now()));
  } catch {
    // A blocked or full storage must never stop the popup from closing.
  }
}

/**
 * Clears ONLY this module's dismissal keys - every other value in localStorage is
 * left untouched. Exported for manual testing: visiting any page with
 * `?resetInquiry=1` (development only) runs it, so a stale dismissal can never be
 * mistaken for a broken popup.
 */
export function resetInquiryDismissals(): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(DISMISSED_PREFIX)) stale.push(key);
    }
    for (const key of stale) window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

/**
 * Opens the inquiry popup from an existing trigger button. Exported so the public
 * solution triggers reuse the one mounted form instead of rendering a second copy.
 */
export function openInquiryForm(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export default function SolutionInquiryForm({
  slug,
  heading = 'Interested in this service?',
  description = "Fill in your details and we'll get back to you.",
}: {
  slug: string;
  heading?: string;
  description?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    setShowForm(false);
    persistDismissed(slug);
  };

  useEffect(() => {
    const open = () => setShowForm(true);
    window.addEventListener(OPEN_EVENT, open);

    // Testing escape hatch, development only: `?resetInquiry=1` drops this module's
    // own dismissal keys (nothing else in storage) before anything else runs.
    if (process.env.NODE_ENV !== 'production') {
      if (new URLSearchParams(window.location.search).has('resetInquiry')) {
        resetInquiryDismissals();
      }
    }

    // A previous dismissal is remembered on purpose: the popup only ever opens from
    // an explicit click, never automatically on mount, refresh or navigation.
    if (readDismissed(slug)) setShowForm(false);

    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [slug]);

  useEffect(() => {
    if (!showForm) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm]);

  const handleSubmit = async () => {
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, phone and message.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solutionSlug: slug,
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: form.message,
          // Honeypot: hidden from real visitors, filled in by bots.
          website: honeypot,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const message =
          payload?.error || 'We could not send your inquiry. Please try again in a moment.';
        setError(message);
        toast.error(message);
        return;
      }

      // Only now is it safe to report success and clear the form.
      toast.success(payload.message || 'Inquiry submitted! We will contact you soon.');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
      setShowForm(false);
    } catch {
      const message = 'We could not reach the server. Please check your connection and try again.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Nothing is rendered while the popup is closed: no card, no trigger, no blank space.
  if (!showForm) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onClick={closeModal}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 sm:items-center"
    >
      <div
        onClick={event => event.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-[#e6e8ee] bg-white p-6 shadow-xl"
      >
        <button
          onClick={closeModal}
          aria-label="Close inquiry form"
          className="absolute top-4 right-4 text-[#64748b] hover:text-[#0f172a] transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-lg font-semibold text-[#0f172a] pr-8">{heading}</h3>
        <p className="text-sm text-[#64748b] mb-6">{description}</p>

        <div className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]"
            placeholder="Your name *"
            aria-label="Your name"
          />
          <input
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]"
            placeholder="Your email *"
            aria-label="Your email"
            type="email"
          />
          <input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]"
            placeholder="Your phone *"
            aria-label="Your phone"
            type="tel"
          />
          <input
            value={form.company}
            onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
            className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]"
            placeholder="Company (optional)"
            aria-label="Company (optional)"
          />
          <textarea
            value={form.message}
            onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            rows={3}
            className="w-full border border-[#e6e8ee] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#171923]"
            placeholder="Your message *"
            aria-label="Your message"
          />

          {/* Honeypot - visually hidden, ignored by real visitors. */}
          <div aria-hidden="true" className="hidden">
            <label htmlFor={`lead-website-${slug}`}>Website</label>
            <input
              id={`lead-website-${slug}`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-600 leading-relaxed">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#171923] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#242735] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Sending...' : 'Submit Inquiry'}
          </button>
        </div>
      </div>
    </div>
  );
}