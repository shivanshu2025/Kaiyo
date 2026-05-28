'use client';

import { motion, useScroll, useTransform } from 'framer-motion';

export default function OurStorySection() {
  const { scrollYProgress } = useScroll();
  const backgroundX = useTransform(scrollYProgress, [0, 1], [0, -150]);

  return (
    <section className="relative flex w-full flex-col items-center justify-start overflow-hidden bg-[#E9E9E7] px-4 py-16 sm:py-20 md:py-28 font-serif text-[#2D3627] sm:px-6 md:px-8">
      <motion.div
        style={{ x: backgroundX }}
        className="pointer-events-none absolute right-0 top-0 z-0 whitespace-nowrap p-4 opacity-5 select-none md:p-10"
      >
        <span className="text-[25vw] font-black uppercase leading-none tracking-tighter md:text-[20vw]">
          Kaiy{"\u014d"}
        </span>
      </motion.div>

      <div className="relative z-20 mb-10 sm:mb-12 flex w-full max-w-7xl flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end md:gap-8">
        <div className="hidden select-none gap-2 opacity-40 sm:flex md:gap-4 md:opacity-60">
          {[1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rotate-180 [writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-[0.2em] md:text-[12px]"
            >
              Who We Are
            </motion.span>
          ))}
        </div>

        <div className="relative w-full max-w-4xl flex-1">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-left text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase leading-[0.85] tracking-tighter"
          >
            Built for The Bold.
          </motion.h2>

          <motion.div
            initial={{ rotate: -5, scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{
              rotate: 0,
              scale: 1.1,
              boxShadow: '0px 20px 40px rgba(0,0,0,0.3)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="absolute -bottom-4 right-2 z-30 flex cursor-pointer flex-col items-center rounded-sm bg-black p-2 text-white shadow-2xl md:right-10 md:p-3"
          >
            <span className="font-mono text-lg leading-none tracking-[-1px] md:text-2xl">
              |||| || | |||| || ||| | ||
            </span>
            <span className="mt-1 font-mono text-[7px] uppercase tracking-widest opacity-70 md:text-[10px]">
              Project Kaiy{"\u014d"} Access
            </span>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-6xl px-2 sm:px-0"
      >
        <motion.div
          whileHover={{ scale: 0.98 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="group relative aspect-[4/3] w-full cursor-none overflow-hidden rounded-[30px] border-4 border-white/10 shadow-2xl sm:aspect-[16/9] sm:rounded-[40px] md:aspect-[21/9] md:rounded-[80px] md:border-8"
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover brightness-90 grayscale-[20%] transition-all duration-1000 group-hover:scale-110 group-hover:brightness-100 group-hover:grayscale-0"
          >
            <source src="/video/Vide.mp4" type="video/mp4" />
          </video>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>

        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            y: [0, -10, 0],
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
            y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.2, rotate: 15 }}
          className="absolute -bottom-6 -left-3 z-30 h-16 w-16 sm:-bottom-8 sm:-left-6 sm:h-24 sm:w-24 md:-bottom-14 md:-left-12 md:h-36 md:w-36 lg:h-44 lg:w-44"
        >
          <div className="group relative flex h-full w-full cursor-pointer items-center justify-center rounded-full border-2 sm:border-2 md:border-4 border-white/20 p-1 shadow-2xl">
            <div className="absolute bottom-2 left-2 h-8 w-8 rounded-full bg-white/20 blur-md transition-colors group-hover:bg-white/40 md:h-14 md:w-14" />

            <svg viewBox="0 0 100 100" className="h-full w-full animate-[spin_15s_linear_infinite]">
              <path
                id="stickerPath"
                d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                fill="transparent"
              />
              <text className="fill-white text-[10px] font-bold uppercase tracking-[2px] md:text-[9px]">
                <textPath xlinkHref="#stickerPath">
                  Explore Now {"\u2022"} Get Started {"\u2022"}
                </textPath>
              </text>
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
