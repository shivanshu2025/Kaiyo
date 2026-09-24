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

type BlogPostData = { title: string; excerpt: string; image: string; link: string; order: number };

interface Props {
  dynamicPosts?: BlogPostData[];
}

export default function InvestmentSection({ dynamicPosts }: Props) {
  const posts = dynamicPosts && dynamicPosts.length > 0 ? dynamicPosts : [];
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
          <div className="relative mt-8 h-[180px] sm:mt-12 sm:h-[220px] md:mt-16 md:h-64">

            {/* WHITE CARD */}
            <motion.div
              initial={{ rotate: 0, y: 20 }}
              whileInView={{ rotate: -3, y: 0 }}
              className="absolute bottom-0 left-0 z-20 flex h-40 w-auto max-w-[13rem] flex-col justify-center rounded-3xl bg-[#fdfcf7] p-4 text-black shadow-2xl sm:h-52 sm:w-64 sm:max-w-none sm:p-6 md:h-60 md:w-72 md:p-8"
            >
              <div className="mb-3 sm:mb-4 flex justify-end space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 sm:h-5 w-1.5 bg-[#004643]" />
                ))}
              </div>

              <div className="flex items-baseline">
                <span className="text-5xl font-black italic sm:text-6xl md:text-7xl lg:text-8xl">60</span>
                <span className="text-xl font-bold sm:text-2xl md:text-3xl">%</span>
                <span className="ml-2 text-[8px] uppercase text-stone-500 sm:ml-3 sm:text-[9px] md:text-[10px]">
                  of investors
                </span>
              </div>

              <div className="mt-2 flex items-baseline sm:mt-3 md:mt-4">
                <span className="text-3xl font-black italic sm:text-4xl md:text-5xl">15</span>
                <span className="text-lg font-bold sm:text-xl md:text-2xl">.8%</span>
                <span className="ml-2 text-[8px] uppercase text-stone-500 sm:ml-3 sm:text-[9px] md:text-[10px]">
                  Avg Returns
                </span>
              </div>
            </motion.div>

            {/* TEAL CARD - visible on all sizes, scales proportionally */}
            <motion.div
              initial={{ rotate: 0, y: 20 }}
              whileInView={{ rotate: 2, y: 0 }}
              className="absolute bottom-[-8px] left-[46%] z-10 flex h-32 w-[46%] max-w-[200px] flex-col justify-center rounded-2xl bg-[#004643] p-4 text-white shadow-xl sm:bottom-[-16px] sm:left-44 sm:h-36 sm:w-56 sm:max-w-none sm:rounded-3xl sm:p-5 md:left-56 md:h-40 md:w-64 md:p-6 lg:left-72 lg:p-8"
            >
              <div className="mb-2 flex space-x-1 opacity-20 sm:mb-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-1 w-3 bg-white sm:h-1.5 sm:w-4 md:w-5" />
                ))}
              </div>

              <div className="flex items-end">
                <span className="mb-1 text-[10px] font-black sm:mb-2 sm:text-xs">USD</span>
                <span className="mx-1 text-4xl font-black sm:text-5xl md:text-6xl lg:text-7xl">4</span>
                <span className="text-lg font-bold sm:text-xl md:text-2xl">b</span>
              </div>

              <span className="mt-1 text-[9px] uppercase text-white/60 sm:mt-2 sm:text-[10px]">
                Amount Invested
              </span>
            </motion.div>

          </div>
        </div>

        {/* RIGHT SIDE FULL HEIGHT PANEL */}
        <div className="hidden md:block w-24 lg:w-40 bg-[#004643]" />

      </motion.div>

      {posts.length > 0 && (
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {posts
            .sort((a, b) => a.order - b.order)
            .map((post, i) => (
              <motion.a
                key={i}
                href={post.link || '#'}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group block overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold text-[#1a1612]">{post.title}</h3>
                  <p className="text-sm leading-relaxed text-stone-600">{post.excerpt}</p>
                </div>
              </motion.a>
            ))}
        </div>
      )}

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
