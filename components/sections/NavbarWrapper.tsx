'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/sections/Navbar';

const hiddenNavbarRoutes = ['/how-it-works', '/calculator', '/partner-signup', '/dashboard', '/adminpanel'];

export default function NavbarWrapper() {
  const pathname = usePathname();
  const shouldShowNavbar = !hiddenNavbarRoutes.some(route => pathname?.startsWith(route));

  if (!shouldShowNavbar) return null;
  
  return <Navbar />;
}
