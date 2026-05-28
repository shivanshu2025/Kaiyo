'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './components/health/Sidebar';
import { clearAuthenticated } from './lib/auth';

export default function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't apply layout to login page
  if (pathname === '/adminpanel/login' || pathname === '/login') {
    return <>{children}</>;
  }

  const getActiveItem = (path: string) => {
    if (path.startsWith('/adminpanel/dashboard')) return 'home';
    if (path.startsWith('/adminpanel/notification')) return 'notifications';
    if (path.startsWith('/adminpanel/settings')) return 'settings';
    return 'home';
  };

  const handleNavigation = (item: string) => {
    switch (item) {
      case 'home':
        router.push('/adminpanel/dashboard');
        break;
      case 'notifications':
        router.push('/adminpanel/notification');
        break;
      case 'settings':
        router.push('/adminpanel/settings');
        break;
    }
  };

  const handleLogout = () => {
    clearAuthenticated();
    router.replace('/adminpanel/login');
    router.refresh();
  };

  const activeItem = getActiveItem(pathname);

  return (
    <main className="min-h-dvh bg-gray-800">
      <motion.section
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex flex-col gap-7 overflow-hidden rounded-[34px] bg-[#f7f3ed] p-5 shadow-[0_42px_90px_rgba(69,62,52,0.22)] sm:rounded-[42px] sm:p-7 md:flex-row lg:p-8 [@media(max-height:950px)]:gap-5 [@media(max-height:950px)]:p-5 [@media(max-height:760px)]:p-4"
      >
        <Sidebar
          activeItem={activeItem}
          onItemChange={handleNavigation}
          onLogout={handleLogout}
        />
        <div className="min-w-0 flex-1 space-y-8 [@media(max-height:950px)]:space-y-5 [@media(max-height:760px)]:space-y-4">
          {children}
        </div>
      </motion.section>
    </main>
  );
}
