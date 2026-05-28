'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import MegaMenu from './MegaMenu';
import {
  getActiveSolutionCategoryTitle,
  solutionCategories,
} from './solutions-menu.config';

const containerVariants = {
  closed: {
    opacity: 0,
    y: 10,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  opened: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, x: -5 },
  opened: { opacity: 1, x: 0 },
};

export default function SolutionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = pathname?.startsWith('/solutions') ?? false;
  const activeCategory = getActiveSolutionCategoryTitle(pathname);

  return (
    <>
      {/* Desktop Dropdown */}
      <div
        className="relative hidden md:block"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <button
            className={`group relative z-10 flex items-center gap-1 px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:text-stone-900 ${
              isActive ? 'text-stone-900' : 'text-stone-600'
            }`}
          >
            <span
              className={`absolute inset-0 -z-10 rounded-full bg-stone-100/80 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 ${
                isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            />
            {activeCategory}
          </button>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="opened"
              exit="closed"
              variants={containerVariants}
              className="absolute left-0 top-full pt-3"
            >
              <div className="w-[640px] rounded-lg border border-stone-100 bg-white p-6 shadow-lg">
                <MegaMenu
                  categories={solutionCategories}
                  pathname={pathname}
                  className="grid grid-cols-4 gap-6"
                  titleClassName="mb-3 text-xs font-bold uppercase tracking-wider text-stone-900"
                  listClassName="space-y-2"
                  itemClassName="block text-xs"
                  activeItemClassName="font-semibold text-stone-900"
                  inactiveItemClassName="text-stone-600 hover:text-stone-900"
                  itemMotionVariants={itemVariants}
                />

                {/* Bottom Branding */}
                <div className="mt-6 border-t border-stone-200 pt-4 text-center">
                  <span className="block text-xs font-extralight uppercase tracking-[0.2em] text-stone-900">
                    Kaiy{"\u014d"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Accordion */}
      <div className="flex h-full flex-col md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-50 ${
            isActive ? 'bg-stone-50' : ''
          }`}
        >
          <span>{activeCategory}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              mobileOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-2">
                <MegaMenu
                  categories={solutionCategories}
                  pathname={pathname}
                  className="flex flex-col"
                  columnClassName="mb-4 last:mb-0"
                  titleClassName="mb-2 text-xs font-bold uppercase tracking-wider text-stone-900"
                  listClassName="space-y-1"
                  itemClassName="block rounded-md px-3 py-2 text-sm"
                  activeItemClassName="bg-stone-100 font-medium text-stone-900"
                  inactiveItemClassName="text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  onItemClick={() => setMobileOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
