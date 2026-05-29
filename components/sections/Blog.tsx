'use client';

import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function InvestmentSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[#E9E9E7] font-sans">

      {/* Background Animated Text */}
      <div className="pointer-events-none absolute left-0 top-10 w-full overflow-hidden select-none opacity-[0.03]">
        <motion.h1
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap text-[clamp(7rem,28vw,20rem)] font-bold"
        >
          INVESTMENT RETURNS INVESTMENT RETURNS
        </motion.h1>
      </div>

      {/* FULL WIDTH CARD */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative flex w-full min-h-[280px] overflow-hidden bg-[#1a1612] shadow-2xl sm:min-h-[350px] md:min-h-[450px]"
      >

        {/* LEFT SIDE (FULL WIDTH FLEX) */}
        <div className="relative flex-1 flex flex-col justify-between p-5 sm:p-8 md:p-16">

          <div className="flex flex-col justify-between gap-6 sm:gap-8 md:flex-row">

            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tighter text-stone-100">
              INVESTMENT RETURNS
            </h2>

            <p className="max-w-sm text-sm leading-relaxed text-stone-400">
              Despite the challenges of an increasingly complex global economy,
              private equity continues to deliver strong returns.
              <span className="text-[#004643]/80">
                {" "}Over the past five years, the average annual return has outperformed traditional asset classes.
              </span>
              Operational improvements and strategic exits sustain attractive returns.
            </p>
          </div>

          {/* DATA CARDS */}
          <div className="relative mt-10 h-48 sm:mt-16 sm:h-64 md:mt-20">

            {/* WHITE CARD */}
            <motion.div
              initial={{ rotate: 0, y: 20 }}
              whileInView={{ rotate: -3, y: 0 }}
              className="absolute bottom-0 left-0 z-20 flex h-44 w-[min(14rem,100%)] flex-col justify-center rounded-3xl bg-[#fdfcf7] p-5 text-black shadow-2xl sm:h-60 sm:w-72 sm:p-8"
            >
              <div className="mb-3 sm:mb-4 flex justify-end space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 sm:h-5 w-1.5 bg-[#004643]" />
                ))}
              </div>

              <div className="flex items-baseline">
                <span className="text-6xl sm:text-8xl font-black italic">60</span>
                <span className="text-2xl sm:text-3xl font-bold">%</span>
                <span className="ml-2 sm:ml-3 text-[9px] sm:text-[10px] uppercase text-stone-500">
                  of investors
                </span>
              </div>

              <div className="mt-3 sm:mt-4 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-black italic">15</span>
                <span className="text-xl sm:text-2xl font-bold">.8%</span>
                <span className="ml-2 sm:ml-3 text-[9px] sm:text-[10px] uppercase text-stone-500">
                  Avg Returns
                </span>
              </div>
            </motion.div>

            {/* TEAL CARD - hidden on very small screens */}
            <motion.div
              initial={{ rotate: 0, y: 20 }}
              whileInView={{ rotate: 2, y: 0 }}
              className="hidden sm:flex absolute bottom-[-20px] left-16 sm:left-48 md:left-64 lg:left-80 z-10 h-36 sm:h-40 w-52 sm:w-64 flex-col justify-center rounded-3xl bg-[#004643] p-5 sm:p-8 text-white shadow-xl"
            >
              <div className="mb-3 sm:mb-4 flex space-x-1 opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-1.5 w-4 sm:w-5 bg-white" />
                ))}
              </div>

              <div className="flex items-end">
                <span className="mb-2 text-xs font-black">USD</span>
                <span className="mx-1 text-6xl sm:text-7xl font-black">4</span>
                <span className="text-xl sm:text-2xl font-bold">b</span>
              </div>

              <span className="mt-2 text-[10px] uppercase text-white/60">
                Amount Invested
              </span>
            </motion.div>

          </div>
        </div>

        {/* RIGHT SIDE FULL HEIGHT PANEL */}
        <div className="hidden md:block w-24 lg:w-40 bg-[#004643]" />

      </motion.div>

      {/* TEXTURE */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
        }}
      />
    </section>
  );
}
