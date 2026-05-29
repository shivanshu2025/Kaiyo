"use client";

import { motion, type Variants, type Transition } from "framer-motion";

interface HeroSectionProps {
  badge?: {
    text: string;
  };
  title?: {
    main: string;
    highlight: string;
  };
  description?: string;
}

export default function HeroSection({
  badge = { text: "⚡ PARTNER REVENUE V2.0" },
  title = {
    main: "Predict your ",
    highlight: "success",
  },
  description = "Use our interactive simulator to explore earnings across different partnership tiers.",
}: HeroSectionProps) {
  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: i * 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      },
    }),
  };

  const drawLine: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        delay: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      } as Transition,
    },
  };

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-[#E9E9E7] px-5 py-8 sm:px-10 sm:py-10 md:min-h-[calc(100dvh-4rem)] md:px-16 lg:px-24">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1400px] flex-col justify-between md:min-h-[calc(100dvh-4rem)]">

        {/* HERO CONTENT */}
        <div className="flex flex-1 flex-col justify-center py-8 sm:py-10">

          {/* BADGE */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-6 inline-flex w-fit max-w-full items-center rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-900 sm:mb-8"
          >
            {badge.text}
          </motion.div>

          {/* TITLE */}
          <div className="space-y-2">

            {/* FIRST LINE */}
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="text-[clamp(2.75rem,12vw,7.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#111]"
              >
                {title.main}
              </motion.h1>

              <motion.svg
                initial="hidden"
                animate="visible"
                width="120"
                height="50"
                viewBox="0 0 120 50"
                fill="none"
                className="mt-2 h-[30px] w-[80px] md:h-[50px] md:w-[120px]"
              >
                <motion.path
                  variants={drawLine}
                  d="M5 40 L20 10 L35 40 L50 10 L65 40 L80 10 L95 40 L110 10"
                  stroke="#222"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.svg>
            </div>

            {/* SECOND LINE */}
            <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <motion.h1
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="relative inline-block text-[clamp(2.75rem,12vw,7.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#111]"
              >
                {title.highlight}

                {/* UNDERLINE */}
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "110%" }}
                  transition={{
                    delay: 0.8,
                    duration: 0.8,
                    ease: "easeInOut",
                  }}
                  className="absolute left-[-5%] bottom-[10%] -z-10 h-[6px] rounded-full bg-emerald-500/70"
                />
              </motion.h1>

              <motion.a
                href="/contact"
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1f2937] sm:px-7 sm:py-4 sm:text-base"
              >
                Let's Talk
                <span>→</span>
              </motion.a>
            </div>

            {/* DESCRIPTION */}
            <motion.p
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mt-8 max-w-[500px] text-sm leading-relaxed text-zinc-600 sm:text-base md:text-lg"
            >
              {description}
            </motion.p>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex items-end justify-center pb-4 sm:justify-between"
        >

          {/* CENTER SIDE (FIXED CENTER ALIGNMENT) */}
          <div className="flex flex-1 justify-center">
            <div className="flex flex-col items-center gap-3 text-center">

              <span className="text-[11px] font-medium leading-tight tracking-wide text-zinc-500">
                Scroll to
                <br />
                explore
              </span>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg width="44" height="68" viewBox="0 0 44 68" fill="none">
                  <rect
                    x="1.5"
                    y="1.5"
                    width="41"
                    height="65"
                    rx="20.5"
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeWidth="1"
                  />

                  <ellipse
                    cx="22"
                    cy="26"
                    rx="16"
                    ry="11"
                    stroke="currentColor"
                    strokeOpacity="0.9"
                    strokeWidth="1.25"
                    fill="none"
                  />

                  <ellipse
                    cx="22"
                    cy="38"
                    rx="16"
                    ry="11"
                    stroke="currentColor"
                    strokeOpacity="0.9"
                    strokeWidth="1.25"
                    fill="none"
                  />

                  <path
                    d="M22 52 L22 62 M18 58 L22 62 L26 58"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>

            </div>
          </div>

          {/* RIGHT SIDE (SPACER / BALANCE) */}
          <div className="hidden flex-col items-end gap-4 sm:flex">
            <div className="w-[120px]" />
          </div>

        </motion.div>
      </div>
    </section>
  );
}
