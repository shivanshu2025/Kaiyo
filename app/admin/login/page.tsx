import AdminLoginForm from '@/components/admin/AdminLoginForm';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  return <AdminLoginForm from={searchParams?.from} />;
}