import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/admin-auth';
import { isSessionActive, readAdminSecurity } from '@/lib/admin-security';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminIdleGuard from '@/components/admin/AdminIdleGuard';
import { AdminThemeToggle } from '@/components/admin/ThemeToggle';

export const dynamic = 'force-dynamic';

/**
 * Authoritative admin gate: the signed token cookie is verified with the same
 * HMAC scheme used to issue it, and the token must also belong to a session that
 * has not been revoked from Admin Settings. Anything invalid/expired/revoked is sent
 * to the login page, so no admin route (and no write endpoint) is reachable
 * unauthenticated.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('kaiyo-admin-token')?.value;

  if (!verifyAdminToken(token) || !(await isSessionActive(token))) {
    redirect('/admin/login');
  }

  const { autoLogoutMinutes } = await readAdminSecurity();

  return (
    /* The row wrapper grows with the page, so tall pages scroll the document
       while the sidebar stays pinned. `min-w-0` lets the main column shrink
       below its content width instead of pushing the sidebar off-screen. */
    <div className="flex min-h-screen min-w-0 flex-col lg:flex-row">
      <AdminIdleGuard minutes={autoLogoutMinutes} />
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