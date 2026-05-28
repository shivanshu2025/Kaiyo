'use client';

import { motion } from 'framer-motion';

export default function HeroSection({
  badge = { text: "⚡ PARTNER REVENUE V2.0" },
  title = { main: "Predict your ", highlight: "success" },
  description = "Use our interactive simulator to explore earnings across different partnership tiers."
}) {
  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <section className="w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] bg-[#F0F0F0] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative overflow-hidden">

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-[1050px] w-full flex flex-col items-center text-center z-10"
      >

        {/* BADGE */}
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center px-3 sm:px-4 py-1.5 mb-4 sm:mb-5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] sm:text-[12px] font-bold uppercase tracking-widest text-emerald-900"
        >
          {badge.text}
        </motion.div>

        {/* TITLE */}
        <motion.h1
          variants={fadeInUp}
          className="font-[cursive] text-[#32483e] leading-[0.95] font-bold text-[clamp(32px,7vw,96px)] mb-3 sm:mb-4"
        >
          {title.main}
          <span className="relative inline-block">
            {title.highlight}

            {/* animated underline */}
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "110%" }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeInOut" }}
              className="absolute left-[-5%] bottom-[10%] h-[4px] sm:h-[6px] bg-emerald-500/70 rounded-full -z-10"
            />
          </span>
        </motion.h1>

        {/* DESCRIPTION */}
        <motion.p
          variants={fadeInUp}
          className="text-slate-500 text-sm sm:text-base md:text-lg leading-relaxed max-w-[650px] m-0"
        >
          {description}
        </motion.p>

      </motion.div>
    </section>
  );
}