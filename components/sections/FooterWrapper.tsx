'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const hiddenFooterRoutes = ['/dashboard', '/adminpanel'];

export default function FooterWrapper() {
  const pathname = usePathname();
  const shouldShowFooter = !hiddenFooterRoutes.some((route) => pathname?.startsWith(route));

  if (!shouldShowFooter) return null;

  return <Footer />;
}
