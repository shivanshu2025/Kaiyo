'use client';

import { motion } from 'framer-motion';

export default function FutureEquitySection() {
  return (
    <section className="bg-[#E9E9E7] px-4 sm:px-6 md:px-12 lg:px-24  text-[#1a1612] relative overflow-hidden">

      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:gap-10">
        <h1 className="max-w-4xl text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black uppercase leading-[1.0] tracking-tighter">
          Future of Private Equity{" "}
          <span className="text-[#004643]">by the numbers.</span>
        </h1>

        <div className="flex max-w-xs items-start gap-3 md:flex-shrink-0">
          <span className="text-xl sm:text-2xl font-light text-[#004643]">+</span>
          <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
            Private equity is rapidly evolving, and understanding the key figures behind this growth is essential.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-10 sm:mt-16 md:mt-20 grid grid-cols-1 gap-10 md:grid-cols-2 relative">

        {/* Left Content */}
        <div className="relative pl-8 sm:pl-10 md:pl-16 lg:pl-20 z-10">
          <div className="absolute left-0 top-2 text-[#004643]">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="currentColor" className="sm:w-[50px] sm:h-[50px]">
              <path d="M50 0C50 40 10 50 0 50C10 50 50 60 50 100C50 60 90 50 100 50C90 50 50 40 50 0Z" />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.2]">
            Streamlining Investments with Cutting-Edge Technology
          </h2>

          <p className="mt-4 sm:mt-6 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
            In the evolving world of private equity, technology is key to speeding up investment processes.
          </p>
        </div>

        {/* Right Image */}
        <div className="relative flex items-center justify-center md:justify-end w-full py-8 md:py-0">
          <img
            src="https://www.ventivegroup.com/wp-content/uploads/2025/02/business-development-startup.png"
            alt="Equity Illustration"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-contain"
          />
        </div>

      </div>
    </section>
  );
}