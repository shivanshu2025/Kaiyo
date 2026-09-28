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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
};

// --- Sub-Component: Moving Marquee ---
function ScrollingText() {
  return (
    <div className="absolute left-0 top-1/2 z-0 w-full -translate-y-1/2 overflow-hidden whitespace-nowrap pointer-events-none opacity-[0.03]">
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: "-50%" }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
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
  description: string;
  image: string;
  link: string;
  order: number;
};

interface Props {
  dynamicCollections?: CollectionData[];
}

export default function PortfolioPage({ dynamicCollections }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(1);
  const collections = dynamicCollections && dynamicCollections.length > 0 ? dynamicCollections : [];

  const defaultItems = [
    { title: "Design", text: "Creating thoughtful, modern, and user-focused designs that give your brand a strong visual identity and professional digital presence." },
    { title: "Development", text: "Creating clean, modern, and responsive websites that give your business a professional presence online." },
    { title: "Responsive", text: "Building responsive websites that adapt smoothly across mobile, tablet, and desktop screens for a consistent and comfortable user experience." },
  ];

  const items = collections.length > 0 ? collections : defaultItems;

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="relative bg-[#E9E9E7] text-[#1F2A1F] font-sans selection:bg-[#004643] selection:text-white overflow-hidden">

      <ScrollingText />

      <section className="relative z-10 flex items-center justify-center px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:p-16 lg:py-32">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 sm:space-y-12"
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

<div className="space-y-4 max-w-md">
              {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={i} className="space-y-0">
                    <div
                      className="flex items-center justify-between py-4 sm:py-6 border-t border-[#1F2A1F]/10 cursor-pointer group transition-colors duration-200 hover:bg-[rgba(0,70,67,0.05)]"
                      onClick={() => toggleItem(i)}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-[#004643] font-bold transition-transform duration-300 ${
                            isOpen ? 'rotate-45' : 'rotate-0'
                          }`}
                        >
                          +
                        </span>
                        <span className="text-lg sm:text-xl font-bold uppercase tracking-widest transition-colors duration-200 group-hover:text-[#004643]">
                          {item.title}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      className="overflow-hidden"
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div
                          className={`my-4 rounded-3xl bg-[#1F2A1F] p-5 text-[#E9E9E7] shadow-2xl sm:p-8 ${
                            isOpen ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{ transition: 'opacity 0.25s ease' }}
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <Minus className="w-5 h-5 text-[#004643] flex-shrink-0" />
                            <span className="text-lg sm:text-xl font-bold uppercase tracking-widest">{item.title}</span>
                          </div>
                          <p className="ml-0 text-sm leading-relaxed text-gray-400 sm:ml-9">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="relative w-full flex justify-center md:justify-end">
            <motion.div
              initial={{ opacity: 0, rotate: 10, y: 100 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, rotate: -1 }}
              className="relative flex w-full max-w-[420px] sm:max-w-[440px] md:max-w-none aspect-square flex-col justify-between overflow-hidden rounded-[2rem] bg-[#004643] p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_50px_100px_-20px_rgba(0,70,67,0.3)] sm:rounded-[2.5rem] lg:rounded-[3.5rem]"
            >
<h3 className="relative z-20 font-black uppercase leading-[0.85] tracking-tighter text-[#E9E9E7] text-[clamp(1.75rem,8vw,2.25rem)] sm:text-[2.1rem] md:text-[2.5rem] lg:text-5xl xl:text-6xl">
DESIGN. BUILD. DELIVER.
                  <br />
                  WE BUILD YOUR WEBSITE.
               </h3>

<div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-3xl sm:p-4 md:p-5">
<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E9E9E7] sm:text-[11px] sm:tracking-[0.3em] md:text-xs">OUR APPROACH</span>
                    <span className="rounded-full bg-[#E9E9E7] px-3 py-1.5 text-[10px] font-black italic text-[#004643] sm:px-4 sm:py-2 sm:text-xs md:px-5">CLEAN &amp; SIMPLE</span>
                </div>
              </div>
              <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
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
