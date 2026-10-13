import { requireAdminPage } from '@/backend/lib/admin-auth';
import { getSecuritySettings } from '@/backend/lib/security-settings';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminIdleGuard from '@/components/admin/AdminIdleGuard';
import { AdminThemeToggle } from '@/components/admin/ThemeToggle';

export const dynamic = 'force-dynamic';

/**
 * Authoritative admin gate.
 *
 * `requireAdminPage` resolves the session against the `AdminSession` collection -
 * the token must be unexpired, unrevoked, within its inactivity window, and
 * belong to an active account holding the `admin` role. Anything else redirects
 * to the existing login page, so no dashboard route renders for an
 * unauthenticated or non-admin caller.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminPage();
  const settings = await getSecuritySettings(auth.admin.id);

  return (
    /* The row wrapper grows with the page, so tall pages scroll the document
       while the sidebar stays pinned. `min-w-0` lets the main column shrink
       below its content width instead of pushing the sidebar off-screen. */
    <div className="flex min-h-screen min-w-0 flex-col lg:flex-row">
      <AdminIdleGuard minutes={settings.autoLogoutMinutes} />
      <AdminSidebar />
      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
        {/* Shared toolbar: renders on every dashboard route, so the toggle and
            the selected theme stay in sync across the whole admin area. */}
        <div className="mb-5 flex shrink-0 items-center justify-end gap-3 sm:mb-6">
          <span className="hidden text-xs font-medium uppercase tracking-wide text-stone-500 sm:inline">
            Theme
          </span>
          <AdminThemeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}

/** Node runtime: session resolution reads the database. */
export const runtime = 'nodejs';