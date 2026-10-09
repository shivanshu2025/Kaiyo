import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/admin-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

/**
 * Authoritative admin gate: the signed token cookie is verified with the same
 * HMAC scheme used to issue it. Anything invalid/expired is sent to the login
 * page, so no admin route (and no write endpoint) is reachable unauthenticated.
 */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('kaiyo-admin-token')?.value;

  if (!verifyAdminToken(token)) {
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-5 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}