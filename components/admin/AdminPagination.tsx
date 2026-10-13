'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Page navigation for the paginated admin lists.
 *
 * The Leads and Contact screens both read a bounded page from the server rather
 * than the whole collection, so both need the same footer. It is deliberately
 * presentation only: it never fetches anything, it just reports the window the
 * caller is looking at and asks for a different one.
 *
 * `pages` is normalised to at least 1 so an empty collection still renders a
 * single (disabled) page instead of "Page 1 of 0".
 */
export default function AdminPagination({
  page,
  pages,
  total,
  limit,
  busy,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  busy?: boolean;
  onPage: (page: number) => void;
}) {
  const lastPage = Math.max(1, pages);
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(total, page * limit);

  const canPrev = page > 1 && !busy;
  const canNext = page < lastPage && !busy;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
      <p className="text-xs text-stone-500">
        {total === 0 ? (
          'No records'
        ) : (
          <>
            Showing <span className="font-semibold text-stone-700">{first}</span>–
            <span className="font-semibold text-stone-700">{last}</span> of{' '}
            <span className="font-semibold text-stone-700">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={13} /> Prev
        </button>

        <span className="text-xs text-stone-500">
          Page {page} of {lastPage}
        </span>

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={!canNext}
          aria-label="Next page"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
