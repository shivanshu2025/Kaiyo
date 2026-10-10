'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  LayoutGrid,
  IndianRupee,
  MessageSquareQuote,
  Handshake,
  Calculator,
  Layers,
  Mail,
  Settings,
} from 'lucide-react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import { ErrorBlock, LoadingBlock } from '@/components/admin/ui';

type Stat = { label: string; value: number; icon: LucideIcon; href: string; hint: string };

function countSolutionCards(solutions: any[] | undefined) {
  if (!Array.isArray(solutions)) return 0;
  return solutions.reduce((total, solution) => {
    const sections = solution?.data?.sections;
    if (!Array.isArray(sections)) return total;
    return (
      total +
      sections.reduce(
        (sectionTotal, section) =>
          sectionTotal + (Array.isArray(section?.cards) ? section.cards.length : 0),
        0
      )
    );
  }, 0);
}

export default function AdminOverviewPage() {
  const { data, loading, loadError, reload } = useCmsAdmin();

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Overview</h1>
          <p className="mt-1 text-sm text-stone-500">Live content counts from the CMS.</p>
        </div>
        <LoadingBlock />
      </div>
    );
  }

  if (loadError || !data) {
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={reload} />;
  }

  const solutions = data.solutions ?? [];
  const categoryCount = new Set(
    solutions.map((solution) => solution.category).filter(Boolean)
  ).size;

  const managedPages = [
    { key: 'home', label: 'Home' },
    { key: 'solutions', label: 'Solutions' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'howItWorks', label: 'How It Works' },
    { key: 'calculator', label: 'Calculator' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'contact', label: 'Contact' },
  ].filter((page) => Boolean((data as Record<string, unknown>)[page.key]));

  const stats: Stat[] = [
    {
      label: 'Total Pages',
      value: managedPages.length,
      icon: FileText,
      href: '/admin',
      hint: 'Page sections with editable content',
    },
    {
      label: 'Solution Categories',
      value: categoryCount,
      icon: LayoutGrid,
      href: '/admin/pages/solutions',
      hint: solutions.map((s) => s.category).filter(Boolean).join(', ') || 'No categories',
    },
    {
      label: 'Solution Cards',
      value: countSolutionCards(solutions),
      icon: Layers,
      href: '/admin/pages/solutions',
      hint: 'Cards across every solution row',
    },
    {
      label: 'Pricing Plans',
      value: data.pricing?.plans?.length ?? 0,
      icon: IndianRupee,
      href: '/admin/pages/pricing',
      hint: 'Plans shown on the pricing page',
    },
    {
      label: 'Testimonials',
      value: data.testimonials?.items?.length ?? 0,
      icon: MessageSquareQuote,
      href: '/admin/pages/testimonials',
      hint: 'Published client testimonials',
    },
    {
      label: 'Partner Tiers',
      value: data.howItWorks?.tiers?.length ?? 0,
      icon: Handshake,
      href: '/admin/pages/how-it-works',
      hint: 'Commission tiers on How It Works',
    },
    {
      label: 'Calculator Tiers',
      value: data.calculator?.tiers?.length ?? 0,
      icon: Calculator,
      href: '/admin/pages/calculator',
      hint: 'Roles used by the revenue calculator',
    },
  ];

  const submissions = data.contact?.submissions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Overview</h1>
        <p className="mt-1 text-sm text-stone-500">
          Live counts read directly from the content store. Last saved{' '}
          {new Date(data.updatedAt).toLocaleString('en-IN')}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-[var(--admin-brand)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {stat.label}
                </span>
                <Icon size={16} className="text-stone-400" />
              </div>
              <p className="mt-2 text-3xl font-black text-stone-900">{stat.value}</p>
              <p className="mt-1 truncate text-xs text-stone-400">{stat.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/pages/contact"
          className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-[var(--admin-brand)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Contact Submissions
            </span>
            <Mail size={16} className="text-stone-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-stone-900">{submissions.length}</p>
          <p className="mt-1 text-xs text-stone-400">Messages received from the contact form</p>
        </Link>

        <Link
          href="/admin/settings"
          className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-[var(--admin-brand)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Site Settings
            </span>
            <Settings size={16} className="text-stone-400" />
          </div>
          <p className="mt-2 truncate text-base font-bold text-stone-900">{data.siteSettings?.logo}</p>
          <p className="mt-1 text-xs text-stone-400">
            {data.siteSettings?.socialLinks?.length ?? 0} social links · WhatsApp{' '}
            {data.siteSettings?.whatsappNumber || '—'}
          </p>
        </Link>
      </div>
    </div>
  );
}