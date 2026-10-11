import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { from?: string; reason?: string };
}) {
  const notice =
    searchParams?.reason === 'idle'
      ? 'You were signed out after a period of inactivity.'
      : searchParams?.reason === 'session'
        ? 'That session has been signed out.'
        : undefined;

  return <AdminLoginForm from={searchParams?.from} notice={notice} />;
}