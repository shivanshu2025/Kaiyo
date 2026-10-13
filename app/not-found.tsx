import Link from 'next/link';

export const metadata = {
  title: 'Page not found',
};

/**
 * Root not-found boundary.
 *
 * Rendered by `notFound()` and by any URL that matches no route. The project did
 * not have one previously, which meant an unknown URL fell back to Next.js's
 * unstyled default.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f3ed] px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">404</p>
      <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">Page not found</h1>
      <p className="max-w-md text-sm text-[#64748b]">
        The page you are looking for does not exist, or the service you selected is no longer
        available.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/solutions"
          className="rounded-xl bg-[#171923] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#242735]"
        >
          Browse solutions
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-[#e6e8ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#171923] transition-colors hover:shadow-md"
        >
          Contact us
        </Link>
      </div>
    </main>
  );
}