import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AdminThemeProvider, themeBootstrapScript } from '@/components/admin/AdminTheme';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Applies the saved theme before first paint to avoid a flash. */}
      <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      <AdminThemeProvider>
        <div className="kaiyo-admin min-h-screen bg-stone-100 text-stone-900">
          <Toaster position="top-right" />
          {children}
        </div>
      </AdminThemeProvider>
    </>
  );
}