'use client';

import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import SolutionInquiryForm, { openInquiryForm } from './SolutionInquiryForm';

/**
 * The solution detail view.
 *
 * The server component (`app/solution/[slug]/page.tsx`) resolves the slug against
 * the CMS document and passes the result in, so this component never has to guess
 * what the page is about or which routes exist.
 *
 * The inquiry form posts to `POST /api/leads`, which persists a `leads` document.
 * The form is only cleared and the success toast is only shown once the server has
 * confirmed the write - a failed submission leaves the visitor's text intact.
 */

export type SolutionDetailData = {
  slug: string;
  label: string;
  title: string;
  description: string;
  images: string[];
  stats: Array<{ value: string; label: string }>;
};

export type RelatedSolution = {
  slug: string;
  title: string;
  description: string;
};

export default function SolutionDetail({
  detail,
  related,
}: {
  detail: SolutionDetailData;
  related: RelatedSolution[];
}) {
  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/solutions" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] mb-6">
          <ArrowLeft size={16} /> Back to solutions
        </Link>

        <div className="grid gap-8">
          <div>
            {detail.images.length > 0 && (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 mb-8">
                {detail.images.slice(0, 6).map((img, i) => (
                  <div key={i} className="aspect-video rounded-xl overflow-hidden bg-[#e6e8ee]">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#64748b]">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h1 className="text-3xl font-bold text-[#0f172a] mb-3">{detail.title}</h1>
            {detail.description && (
              <p className="text-lg text-[#64748b] mb-4">{detail.description}</p>
            )}

            {detail.stats.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {detail.stats.map((stat, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-[#e6e8ee] text-xs text-[#64748b]">
                    {stat.value} {stat.label}
                  </span>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-[#0f172a] mb-4">Related Solutions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/solution/${r.slug}`} className="block p-4 rounded-xl border border-[#e6e8ee] bg-white hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-[#0f172a]">{r.title}</h3>
                      {r.description && <p className="mt-1 text-sm text-[#64748b] line-clamp-2">{r.description}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/*
              The inline "Interested in this service?" card stays removed - no heading,
              no description, no inline fields. This is only the manual trigger for the
              existing popup, styled with the exact classes that button already used.
            */}
            <button
              type="button"
              onClick={() => openInquiryForm()}
              aria-haspopup="dialog"
              className="mt-8 w-full bg-[#171923] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#242735] transition-colors"
            >
              Send Inquiry
            </button>
          </div>
        </div>
      </div>

      {/*
        The sticky inquiry card that used to fill the sidebar column is gone. The form
        renders nothing until it is opened as a popup, so the column and its grid
        track were removed with it rather than leaving 400px of blank space.
      */}
      <SolutionInquiryForm slug={detail.slug} />
    </div>
  );
}