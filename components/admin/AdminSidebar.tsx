'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    router.push('/admin/login');
    router.refresh();
  };

  const navContent = (
    <nav className="relative flex h-full min-h-0 flex-col items-center gap-4 overflow-visible p-3">
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

      {/* Navigation icons */}
      <div className="flex shrink-0 flex-col items-center gap-1 rounded-full bg-white p-1.5">
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
                onClick={() => setOpen(false)}
                className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                  active
                    ? 'bg-[var(--admin-ink)] text-[var(--admin-accent)]'
                    : 'text-stone-600 hover:bg-[var(--admin-surface)] hover:text-stone-900'
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />

                {/* Custom tooltip is the single source of the visible label.
                    A native `title` tooltip here would render the same word a
                    second time a moment after hover. */}
                <span className="pointer-events-none invisible absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--admin-ink)] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })
        )}
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

          <span className="pointer-events-none invisible absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--admin-ink)] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
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

          <span className="pointer-events-none invisible absolute left-full top-1/2 z-[9999] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--admin-ink)] px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100">
            Log out
          </span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-stone-200 bg-[var(--admin-surface)] px-4 py-3 lg:hidden">
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
          className="rounded-lg border border-stone-300 p-2 text-stone-700 transition hover:bg-white"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 overflow-y-auto bg-[var(--admin-surface)] lg:hidden">
          <div className="min-h-full">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 z-50 hidden h-screen w-[98px] shrink-0 overflow-visible border-r border-stone-200 bg-[var(--admin-surface)] lg:block">
        {navContent}
      </aside>
    </>
  );
}