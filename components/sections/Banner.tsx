'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Plus } from 'lucide-react';
import { useRef, useState, type MouseEvent } from 'react';

const items = [
  {
    title: 'NETWORKING OPPORTUNITIES',
    desc: 'Connect with industry peers and experts.',
    active: false,
  },
  {
    title: 'WEBINARS AND EVENTS',
    desc: 'Participate in exclusive events and live discussions.',
    active: true,
  },
  {
    title: 'NEWSLETTER',
    desc: 'Subscribe to receive the latest insights and updates directly to your inbox.',
    active: false,
  },
];

export default function OpportunitySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(1);

  const mouseX = useSpring(0, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 150, damping: 20 });

  const handleMouseMove = (event: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const resetMouse = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const textX = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
  const textY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);
  const iconX = useTransform(mouseX, [-0.5, 0.5], [40, -40]);

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const prev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <div className="bg-[#E9E9E7] font-sans text-[#1a1612] overflow-x-hidden">
      
      {/* List Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-6xl border-t border-stone-300">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;

            return (
              <motion.div
                key={idx}
                className={`relative flex items-center border-b border-stone-300 transition-all duration-500 ${
                  isActive
                    ? 'bg-[#1a1612] text-white rounded-2xl sm:rounded-[40px] my-4 sm:my-6 shadow-xl'
                    : 'hover:bg-stone-200/50'
                }`}
              >
                <div className="grid w-full grid-cols-1 items-center gap-4 sm:gap-6 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-3 md:px-10 lg:px-12">
                  <h3 className="text-base sm:text-xl font-black uppercase tracking-tighter md:text-2xl">
                    {item.title}
                  </h3>

                  <p className={`text-sm leading-relaxed ${isActive ? 'text-stone-400' : 'text-stone-600'}`}>
                    {item.desc}
                  </p>

                  <div className="flex justify-start md:justify-end gap-3">

                    {/* LEFT BUTTON */}
                    <button
                      onClick={prev}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-stone-400 text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                      <ArrowRight className="rotate-180" size={16} />
                    </button>

                    {/* RIGHT BUTTON */}
                    <button
                      onClick={next}
                      className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-stone-400 text-stone-600 hover:bg-stone-300 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>

                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetMouse}
        className="relative bg-[#1a1612] px-4 py-16 sm:px-6 sm:py-24 md:px-12 md:py-28 lg:px-24 lg:py-32 text-[#E9E9E7] overflow-hidden"
      >
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 sm:gap-16 md:flex-row md:items-end">

          <motion.div style={{ x: textX, y: textY }} className="overflow-hidden">
            <h2 className="text-[clamp(40px,10vw,140px)] sm:text-[clamp(48px,11vw,140px)] font-black uppercase leading-[0.8] tracking-tighter md:text-[clamp(48px,8vw,140px)] lg:text-[clamp(48px,10vw,140px)]">
              THE TIME IS NOW
              <br />
              <span className="text-stone-500">THE PATH IS</span> FORWARD
            </h2>
          </motion.div>

          <motion.div style={{ x: iconX }} className="text-[#E9E9E7]">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 0C50 40 10 50 0 50C10 50 50 60 50 100C50 60 90 50 100 50C90 50 50 40 50 0Z" />
            </svg>
          </motion.div>

        </div>
      </footer>
    </div>
  );
}