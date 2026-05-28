'use client';

import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SolutionsDropdown from './SolutionsDropdown';

interface NavLink {
  name: string;
  href: string;
}

interface NavbarProps {
  navLinks?: NavLink[];
  ctaText?: string;
  ctaHref?: string;
  showSolutions?: boolean;
}

const defaultNavLinks: NavLink[] = [
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact', href: '/contact' },
];

const linkVariants = {
  closed: { y: 10, opacity: 0 },
  opened: { y: 0, opacity: 1 },
};

export default function Navbar({
  navLinks = defaultNavLinks,
  ctaText = 'Refer & Earn',
  ctaHref = '/how-it-works',
  showSolutions = true,
}: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-100 bg-[#E9E9E7] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link
            href="/"
            className="group z-10 flex min-w-0 items-center gap-3"
          >
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1.5 z-0 scale-0 rounded-full bg-stone-100/60 transition-transform duration-300 group-hover:scale-100" />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 flex items-center gap-2"
              >
                <Image
                  src="/images/Kaiyologo.png"
                  alt="Kaiyo Logo"
                  width={48}
                  height={48}
                  sizes="48px"
                  priority
                  className="h-10 w-auto object-contain sm:h-12"
                />

                <span className="text-xs sm:text-sm md:text-lg font-extralight uppercase tracking-[0.2em] text-stone-900">
                  Kaiy{"\u014d"}
                </span>
              </motion.div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {showSolutions && <SolutionsDropdown />}

            {navLinks.map((link) => (
              <motion.div
                key={link.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Link
                  href={link.href}
                  className={`group relative z-10 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:text-stone-900 ${
                    pathname === link.href
                      ? 'text-stone-900'
                      : 'text-stone-600'
                  }`}
                >
                  <span
                    className={`absolute inset-0 -z-10 rounded-full bg-stone-100/80 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 ${
                      pathname === link.href
                        ? 'scale-100 opacity-100'
                        : 'scale-50 opacity-0'
                    }`}
                  />

                  {link.name}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="z-10 hidden items-center md:flex">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={ctaHref}
                className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-stone-800"
              >
                {ctaText}
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative z-10 p-2.5 text-stone-700 md:hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={menuOpen ? 'close' : 'open'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden"
            >
              <motion.div
                className="flex flex-col gap-2 pb-6 pt-2"
                initial="closed"
                animate="opened"
                transition={{ staggerChildren: 0.08 }}
              >
                {/* Solutions */}
                {showSolutions && <SolutionsDropdown />}

                {/* Nav Links */}
                {navLinks.map((link) => (
                  <motion.div key={link.name} variants={linkVariants}>
                    <Link
                      href={link.href}
                      className={`block rounded-lg px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50 ${
                        pathname === link.href ? 'bg-stone-50' : ''
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile CTA Button */}
                <motion.div variants={linkVariants} className="pt-2">
                  <Link
                    href={ctaHref}
                    className="block rounded-full bg-stone-900 px-4 py-3 text-center text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-stone-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    {ctaText}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}