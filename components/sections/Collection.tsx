'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

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
    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full overflow-hidden whitespace-nowrap pointer-events-none z-0 opacity-[0.03]">
      <motion.div 
        initial={{ x: 0 }}
        animate={{ x: "-50%" }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="flex text-[25vw] font-black uppercase italic leading-none"
      >
        <span className="mr-20">VISUAL DESIGN</span>
        <span className="mr-20">VISUAL DESIGN</span>
      </motion.div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <main className="relative bg-[#E9E9E7] text-[#1F2A1F] font-sans selection:bg-[#004643] selection:text-white overflow-hidden">
      
      {/* Background Moving Text (Right to Left) */}
      <ScrollingText />

      {/* Hero Section */}
      <section className="relative p-4 sm:p-8 md:p-12 lg:p-16 py-12 sm:py-16 md:py-20 z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 sm:space-y-12"
          >
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[7.5rem] font-black uppercase leading-[0.8] tracking-tighter"
            >
              Building The <span className="text-[#004643] italic">Future</span> of Web
            </motion.h1>

            {/* Accordion / List Section */}
            <div className="space-y-4 max-w-md">
              {[
                { title: "Strategy", active: false },
                { title: "Visual Innovation", active: true, text: "Blending architectural precision with fluid motion to create digital experiences that breathe." },
                { title: "Performance", active: false }
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants}>
                  {item.active ? (
                    <motion.div layoutId="activeAcc" className="bg-[#1F2A1F] text-[#E9E9E7] p-5 sm:p-8 rounded-3xl shadow-2xl my-4">
                      <div className="flex items-center gap-4 mb-3">
                        <Minus className="w-5 h-5 text-[#004643] flex-shrink-0" />
                        <span className="text-lg sm:text-xl font-bold uppercase tracking-widest">{item.title}</span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed ml-9">{item.text}</p>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-between py-4 sm:py-6 border-t border-[#1F2A1F]/10 cursor-pointer group transition-all">
                      <div className="flex items-center gap-4">
                        <Plus className="w-5 h-5 flex-shrink-0 transition-transform group-hover:rotate-180 group-hover:text-[#004643]" />
                        <span className="text-lg sm:text-xl font-bold uppercase tracking-widest group-hover:text-[#004643] transition-colors">{item.title}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            {/* Featured Interactive Teal Card */}
            <motion.div
              initial={{ opacity: 0, rotate: 10, y: 100 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="relative bg-[#004643] p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] aspect-[4/5] sm:aspect-square overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,70,67,0.3)] flex flex-col justify-between"
            >
              <h3 className="text-[#E9E9E7] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-[0.85] tracking-tighter relative z-20">
                Crafting With Purpose
              </h3>

              <div className="space-y-3 z-10 relative">
                <div className="bg-white/10 backdrop-blur-3xl p-3 sm:p-5 rounded-2xl flex items-center justify-between border border-white/20">
                  <span className="text-[#E9E9E7] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">Excellence Rate</span>
                  <span className="bg-[#E9E9E7] text-[#004643] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black italic">TOP TIER</span>
                </div>
              </div>

              {/* Decorative SVG Animated Path */}
              <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 400 400">
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                  d="M-50 350 C 100 300, 200 100, 450 50" 
                  stroke="white" 
                  strokeWidth="2" 
                  fill="transparent" 
                />
              </svg>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
