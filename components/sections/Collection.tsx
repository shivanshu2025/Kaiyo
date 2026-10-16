'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus } from 'lucide-react';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

// --- Sub-Component: Moving Marquee ---
function ScrollingText() {
  return (
    <div className="absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 overflow-hidden whitespace-nowrap pointer-events-none opacity-[0.03]">
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '-50%' }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="flex text-[clamp(5rem,25vw,20rem)] font-black uppercase italic leading-none"
      >
        <span className="mr-20">VISUAL DESIGN</span>
        <span className="mr-20">VISUAL DESIGN</span>
      </motion.div>
    </div>
  );
}

type CollectionData = {
  title: string;
  description?: string;
  text?: string;
  image?: string;
  link?: string;
  order?: number;
};

interface Props {
  dynamicCollections?: CollectionData[];
  dynamicContent?: {
    heading?: string;
    description?: string;
    items?: CollectionData[];
  };
}

export default function PortfolioPage({
  dynamicCollections,
  dynamicContent,
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  const collections =
    dynamicCollections && dynamicCollections.length > 0
      ? dynamicCollections
      : [];

  const defaultItems: CollectionData[] = [
    {
      title: 'Design',
      text: 'Creating thoughtful, modern, and user-focused designs that give your brand a strong visual identity and professional digital presence.',
    },
    {
      title: 'Development',
      text: 'Creating clean, modern, and responsive websites that give your business a professional presence online.',
    },
    {
      title: 'Responsive',
      text: 'Building responsive websites that adapt smoothly across mobile, tablet, and desktop screens for a consistent and comfortable user experience.',
    },
  ];

  const items = collections.length > 0 ? collections : defaultItems;

  const toggleItem = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="relative overflow-hidden bg-[#E9E9E7] font-sans text-[#1F2A1F] selection:bg-[#004643] selection:text-white">
      <ScrollingText />

      <section className="relative z-10 flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-16 lg:py-32">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 sm:gap-12 md:grid-cols-2 md:gap-16 lg:gap-24 xl:gap-32">

          {/* LEFT SIDE CONTENT */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="min-w-0 space-y-8 sm:space-y-12"
          >
            <motion.h1
              variants={itemVariants}
              className="text-[clamp(2.5rem,11vw,7.5rem)] font-black uppercase leading-[0.8] tracking-tight"
            >
              <span className="whitespace-nowrap">BUILDING</span>{' '}
              <span className="whitespace-nowrap">YOUR</span>{' '}
              <span className="whitespace-nowrap">DIGITAL</span>{' '}
              <span className="whitespace-nowrap">PRESENCE</span>
            </motion.h1>

            {/* ACCORDION ITEMS */}
            <div className="max-w-md space-y-4">
              {items.map((item, i) => {
                const isOpen = openIndex === i;

                return (
                  <div key={i} className="space-y-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      onClick={() => toggleItem(i)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault();
                          toggleItem(i);
                        }
                      }}
                      className="group flex cursor-pointer items-center justify-between border-t border-[#1F2A1F]/10 py-4 transition-colors duration-200 hover:bg-[rgba(0,70,67,0.05)] sm:py-6"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center font-bold text-[#004643] transition-transform duration-300 ${
                            isOpen ? 'rotate-45' : 'rotate-0'
                          }`}
                        >
                          +
                        </span>

                        <span className="text-lg font-bold uppercase tracking-widest transition-colors duration-200 group-hover:text-[#004643] sm:text-xl">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        transition:
                          'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="overflow-hidden"
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div
                          className={`my-4 rounded-3xl bg-[#1F2A1F] p-5 text-[#E9E9E7] shadow-2xl transition-opacity duration-300 sm:p-8 ${
                            isOpen ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <div className="mb-3 flex items-center gap-4">
                            <Minus className="h-5 w-5 flex-shrink-0 text-[#004643]" />

                            <span className="text-lg font-bold uppercase tracking-widest sm:text-xl">
                              {item.title}
                            </span>
                          </div>

                          <p className="ml-0 text-sm leading-relaxed text-gray-400 sm:ml-9">
                            {item.text || item.description || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* RIGHT SIDE DESIGN CARD */}
          <div className="relative flex w-full justify-center md:justify-end">
            <motion.div
              initial={{ opacity: 0, rotate: 10, y: 100 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.02, rotate: -1 }}
              className="relative flex aspect-square w-full max-w-[420px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#004643] p-6 shadow-[0_50px_100px_-20px_rgba(0,70,67,0.3)] sm:max-w-[440px] sm:rounded-[2.5rem] sm:p-8 md:mr-0 md:max-w-none md:translate-x-4 md:p-10 lg:translate-x-8 lg:rounded-[3.5rem] lg:p-12 xl:translate-x-10"
            >
              <h3 className="relative z-20 text-[clamp(1.75rem,8vw,2.25rem)] font-black uppercase leading-[0.85] tracking-tighter text-[#E9E9E7] sm:text-[2.1rem] md:text-[2.5rem] lg:text-5xl xl:text-6xl">
                DESIGN. BUILD. DELIVER.
                <br />
                WE BUILD YOUR WEBSITE.
              </h3>

              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-3xl sm:gap-3 sm:p-4 md:p-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E9E9E7] sm:text-[11px] sm:tracking-[0.3em] md:text-xs">
                    OUR APPROACH
                  </span>

                  <span className="rounded-full bg-[#E9E9E7] px-3 py-1.5 text-[10px] font-black italic text-[#004643] sm:px-4 sm:py-2 sm:text-xs md:px-5">
                    CLEAN &amp; SIMPLE
                  </span>
                </div>
              </div>

              {/* ANIMATED LINE */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 3,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  d="M-50 350 C 100 300, 200 100, 450 50"
                  stroke="white"
                  strokeWidth="1.8"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          </div>

        </div>
      </section>
    </main>
  );
}