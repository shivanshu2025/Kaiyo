'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { adminFetch, ApiError } from '@/lib/admin-client';
import { ErrorBlock, LoadingBlock } from '@/components/admin/ui';

type Stat = { label: string; value: number; icon: LucideIcon; href: string; hint: string };

type OverviewPayload = {
  counts: {
    solutions: number;
    solutionCategories: number;
    solutionCategoryLabels: string[];
    solutionCards: number;
    pricingPlans: number;
    testimonials: number;
    publishedTestimonials: number;
    partnerTiers: number;
    calculatorTiers: number;
    submissions: number;
    mediaImages: number;
    mediaVideos: number;
    totalPages: number;
    managedPages: string[];
  };
  siteSettings: {
    logo: string;
    whatsappNumber: string;
    phoneNumber: string;
    socialLinks: number;
  };
  lastSavedAt: string;
};

/**
 * Overview.
 *
 * Every number here comes from `GET /api/admin/overview`, which aggregates the
 * database directly. The screen used to derive them from the composed CMS payload
 * instead: that meant loading the whole content document - plus up to
 * `MAX_COMPOSED_CHILDREN` contact submissions, which are personal data - on every
 * load, purely to draw seven numbers. The endpoint existed and nothing called it.
 *
 * The layout, the tiles and every label are unchanged.
 */
export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await adminFetch<OverviewPayload>('/api/admin/overview');
      setData(response.data);
    } catch (error) {
      setData(null);
      setLoadError(
        error instanceof ApiError ? error.message : 'Unable to load the dashboard summary.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={load} />;
  }

  const counts = data.counts;

  const stats: Stat[] = [
    {
      label: 'Total Pages',
      value: counts.totalPages,
      icon: FileText,
      href: '/admin',
      hint: 'Page sections with editable content',
    },
    {
      label: 'Solution Categories',
      value: counts.solutionCategories,
      icon: LayoutGrid,
      href: '/admin/pages/solutions',
      hint: counts.solutionCategoryLabels.join(', ') || 'No categories',
    },
    {
      label: 'Solution Cards',
      value: counts.solutionCards,
      icon: Layers,
      href: '/admin/pages/solutions',
      hint: 'Cards across every solution row',
    },
    {
      label: 'Pricing Plans',
      value: counts.pricingPlans,
      icon: IndianRupee,
      href: '/admin/pages/pricing',
      hint: 'Plans shown on the pricing page',
    },
    {
      label: 'Testimonials',
      value: counts.publishedTestimonials,
      icon: MessageSquareQuote,
      href: '/admin/pages/testimonials',
      hint: 'Published client testimonials',
    },
    {
      label: 'Partner Tiers',
      value: counts.partnerTiers,
      icon: Handshake,
      href: '/admin/pages/how-it-works',
      hint: 'Commission tiers on How It Works',
    },
    {
      label: 'Calculator Tiers',
      value: counts.calculatorTiers,
      icon: Calculator,
      href: '/admin/pages/calculator',
      hint: 'Roles used by the revenue calculator',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Overview</h1>
        <p className="text-sm text-stone-500">
          Live counts read directly from the content store. Last saved{' '}
          {new Date(data.lastSavedAt).toLocaleString('en-IN')}.
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
          <p className="mt-2 text-3xl font-black text-stone-900">{counts.submissions}</p>
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
          <p className="mt-2 truncate text-base font-bold text-stone-900">
            {data.siteSettings.logo}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            {data.siteSettings.socialLinks} social links · WhatsApp{' '}
            {data.siteSettings.whatsappNumber || '—'}
          </p>
        </Link>
      </div>
    </div>
  );
}
