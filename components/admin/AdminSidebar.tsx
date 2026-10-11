'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  Home,
  Layers,
  IndianRupee,
  Handshake,
  Calculator,
  MessageSquareQuote,
  Mail,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const adminNav = [
  {
    group: 'General',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Pages',
    items: [
      { href: '/admin/pages/home', label: 'Home', icon: Home },
      { href: '/admin/pages/solutions', label: 'Solutions', icon: Layers },
      { href: '/admin/pages/pricing', label: 'Pricing', icon: IndianRupee },
      { href: '/admin/pages/how-it-works', label: 'How It Works', icon: Handshake },
      { href: '/admin/pages/calculator', label: 'Calculator', icon: Calculator },
      { href: '/admin/pages/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { href: '/admin/pages/contact', label: 'Contact', icon: Mail },
      { href: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
  {
    group: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Site Settings', icon: Settings },
      { href: '/admin/admin-settings', label: 'Admin Settings', icon: ShieldCheck },
    ],
  },
];

/* Shared look of every sidebar label. Kept in one place so the rail tooltips
   and the floating tooltip cannot drift apart. */
const tooltipClass =
  'pointer-events-none z-[9999] whitespace-nowrap rounded-md bg-[var(--admin-ink)] px-3 py-2 text-xs text-white shadow-lg transition-opacity duration-150';

/**
 * Hover/focus label for the icon-only rail.
 *
 * The navigation list scrolls once the viewport is too short to show every
 * icon, and an `overflow-y-auto` box clips absolutely-positioned children —
 * which would swallow the labels. The label is therefore rendered in the
 * viewport's coordinate space (`fixed`), which an `overflow` ancestor does not
 * clip, and keeps its theme tokens because it stays inside `.kaiyo-admin`.
 * It stays mounted while empty so the fade-out still runs.
 */
function RailTooltip({ anchor }: { anchor: HTMLElement | null }) {
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);

  const position = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setBox({ top: rect.top + rect.height / 2, left: rect.right + 12 });
  }, []);

  useEffect(() => {
    if (!anchor) {
      setBox(null);
      return;
    }
    position(anchor);
    // The rail is pinned, but the page can still scroll underneath it; keep the
    // label aligned with the icon until the pointer leaves.
    const keepAligned = () => position(anchor);
    window.addEventListener('scroll', keepAligned, true);
    window.addEventListener('resize', keepAligned);
    return () => {
      window.removeEventListener('scroll', keepAligned, true);
      window.removeEventListener('resize', keepAligned);
    };
  }, [anchor, position]);

  return (
    <span
      aria-hidden
      className={`fixed ${tooltipClass} ${
        box ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      style={{
        top: box?.top ?? 0,
        left: box?.left ?? 0,
        transform: 'translateY(-50%)',
      }}
    >
      {anchor?.getAttribute('data-label') ?? ''}
    </span>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tipAnchor, setTipAnchor] = useState<HTMLElement | null>(null);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    router.push('/admin/login');
    router.refresh();
  };

  /**
   * The rail is a three-part flex column: fixed logo header, scrolling
   * navigation, fixed action footer. `min-h-0` on the middle part is what
   * allows it to shrink below its content height and scroll instead of
   * pushing the footer off the bottom of a short viewport.
   */
  const navContent = (mode: 'rail' | 'overlay') => (
    <nav
      className={`relative flex min-h-0 flex-col items-center gap-4 overflow-visible p-3 ${
        mode === 'rail' ? 'h-full' : 'min-h-full'
      }`}
    >
      {/* Logo */}
      <Link
        href="/admin"
        title="Kaiyō Admin"
        onClick={() => setOpen(false)}
        className="flex shrink-0 flex-col items-center gap-1 text-stone-900"
      >
        <span className="text-lg font-black uppercase tracking-tight">
          Kaiyō
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-500">
          Admin
        </span>
      </Link>

      {/* Navigation icons. The white pill hugs its content while there is room,
          and becomes the scroll port that keeps the logo and the action footer
          pinned when there is not. */}
      <div className="flex min-h-0 shrink flex-col items-center rounded-full bg-white p-1.5">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain">
          {adminNav.map((section) =>
            section.items.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href ||
                    pathname?.startsWith(`${item.href}/`);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  data-label={item.label}
                  onClick={() => setOpen(false)}
                  onMouseEnter={(event) => setTipAnchor(event.currentTarget)}
                  onMouseLeave={() => setTipAnchor(null)}
                  /* `:focus-visible` is checked in JS because React only
                     exposes the plain focus event, which also fires on tap
                     and mouse clicks where the label must stay hidden. */
                  onFocus={(event) => {
                    if (event.currentTarget.matches(':focus-visible')) {
                      setTipAnchor(event.currentTarget);
                    }
                  }}
                  onBlur={() => setTipAnchor(null)}
                  className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                    active
                      ? 'bg-[var(--admin-ink)] text-[var(--admin-accent)]'
                      : 'text-stone-600 hover:bg-[var(--admin-surface)] hover:text-stone-900'
                  }`}
                >
                  <Icon size={19} strokeWidth={1.8} />
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-auto flex shrink-0 flex-col items-center gap-2 rounded-full bg-white p-1.5">
        <Link
          href="/"
          aria-label="View website"
          onClick={() => setOpen(false)}
          className="group relative flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-[var(--admin-surface)] hover:text-stone-900"
        >
          <ExternalLink size={18} strokeWidth={1.8} />

          {/* Custom tooltip is the single source of the visible label.
              A native `title` tooltip here would render the same word a
              second time a moment after hover. */}
          <span
            className={`pointer-events-none invisible absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 opacity-0 shadow-lg group-hover:visible group-hover:opacity-100 ${tooltipClass}`}
          >
            View website
          </span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          className="group relative flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition hover:bg-[var(--admin-surface)] hover:text-red-600"
        >
          <LogOut size={18} strokeWidth={1.8} />

          <span
            className={`pointer-events-none invisible absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 opacity-0 shadow-lg group-hover:visible group-hover:opacity-100 ${tooltipClass}`}
          >
            Log out
          </span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile bar. A definite height lets the overlay below start exactly at
          the bar's edge instead of guessing its stacked height. */}
      <div className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-[var(--admin-surface)] px-4 lg:hidden">
        <Link
          href="/admin"
          className="text-sm font-black uppercase tracking-widest text-stone-900"
        >
          Kaiyō Admin
        </Link>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-white"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto overscroll-contain bg-[var(--admin-surface)] lg:hidden">
          {navContent('overlay')}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-50 hidden h-screen w-[98px] shrink-0 overflow-visible border-r border-stone-200 bg-[var(--admin-surface)] supports-[height:100dvh]:h-[100dvh] lg:block">
        {navContent('rail')}
      </aside>

      <RailTooltip anchor={tipAnchor} />
    </>
  );
}