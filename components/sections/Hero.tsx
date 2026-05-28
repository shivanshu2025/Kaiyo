'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function FashionHero() {
  return (
    <section className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-[#E5E5E5] px-3 sm:px-4 md:px-6 py-16 sm:py-20 md:py-24 lg:py-28 font-serif text-[#2D3627]">
      <div className="absolute left-4 top-4 z-30 sm:left-10 sm:top-10">
        <div className="flex flex-col items-center bg-black p-2 text-[10px] leading-none tracking-widest text-white">
          <span className="mb-1 font-mono text-lg tracking-[-1px]">
            |||| || | |||| || ||| | ||
          </span>
          <span className="font-mono uppercase opacity-70">
            Project Kaiy{"\u014d"} Access: 898 12 7
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center px-4">
        <h1 className="text-center text-[8vw] sm:text-[9vw] md:text-[10vw] font-black uppercase leading-[0.85] tracking-tighter opacity-10">
          The future of startup building {"\u2014"}Kaiy{"\u014d"}
        </h1>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        <div className="z-20 w-full md:col-span-4 space-y-6 sm:space-y-8">
          <div className="w-full max-w-[280px] sm:max-w-[320px] -rotate-1 sm:-rotate-1 border-r-4 border-[#2f4f3f] bg-black p-3 text-white shadow-2xl">
            <h2 className="mb-2 text-base sm:text-xl font-bold tracking-tight">
              Venture Capital Reimagined.
            </h2>
            <p className="text-xs sm:text-sm font-medium uppercase leading-relaxed tracking-tight opacity-80">
              Building a startup is chaotic. Kaiy{"\u014d"} provides the
              structure, style, and scale to turn vision into market dominance.
            </p>
          </div>

          <div className="group relative aspect-[4/5] w-36 sm:w-44 rotate-2 overflow-hidden rounded-2xl border-4 border-white shadow-2xl">
            <Image
              src="/images/kk.png"
              alt="Yellow Jacket"
              fill
              sizes="(min-width: 640px) 176px, 144px"
              className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
            <div className="absolute bottom-4 sm:bottom-6 -left-4 bg-[#2D3627] px-3 sm:px-4 py-1 text-[9px] sm:text-[10px] font-bold uppercase text-white -rotate-12">
              I create websites and sell them.{"\u201d"}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex w-full justify-center pt-8 sm:pt-12 md:col-span-5 md:pt-16">
          <div className="group relative">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2f4f3f] opacity-20 blur-[100px] mix-blend-multiply" />

            <Image
              src="/images/Kaiyologo.png"
              alt="Kaiyo Logo"
              width={550}
              height={550}
              sizes="(min-width: 1024px) 550px, (min-width: 768px) 420px, (min-width: 640px) 320px, 240px"
              priority
              className="relative z-10 h-auto w-[240px] object-contain grayscale contrast-125 drop-shadow-[0_35px_35px_rgba(0,0,0,0.25)] sm:w-[320px] md:w-[420px] lg:w-[550px]"
            />
          </div>

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
            className="absolute right-2 top-4 z-30 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-white/30 shadow-xl transition-transform hover:scale-110 sm:right-2 sm:top-6 sm:h-20 sm:w-20 md:right-0 md:h-24 md:w-24 lg:h-28 lg:w-28"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full p-2">
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  fill="transparent"
                />
                <text className="fill-white text-[8px] sm:text-[9px] font-bold uppercase tracking-[3px]">
                  <textPath xlinkHref="#circlePath">
                    {"\u201c"}I build websites for clients and sell them.{"\u201d"}
                  </textPath>
                </text>
              </svg>
            </div>
            <span className="font-sans text-2xl sm:text-3xl text-white">{"\u2192"}</span>
          </motion.div>
        </div>

        <div className="z-20 flex w-full flex-row items-center justify-center gap-6 pb-6 md:col-span-3 md:flex-col md:items-end md:justify-start md:gap-0 md:space-y-10 md:self-stretch md:pb-0">
          <div className="group cursor-default text-center md:text-right">
            <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tighter transition-colors group-hover:text-[#2f4f3f]">
              FAST
            </h3>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              Delivery
            </p>
          </div>
          <div className="group cursor-default text-center md:text-right">
            <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tighter transition-colors group-hover:text-[#2f4f3f]">
              MODERN
            </h3>
            <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] opacity-60">
              Design
            </p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
    </section>
  );
}
