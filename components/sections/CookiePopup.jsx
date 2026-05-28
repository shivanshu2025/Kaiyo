'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

export default function CookiePopup() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-[640px] max-h-[90vh] overflow-y-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-4 sm:p-6 md:p-8 text-white shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 text-[#8B949E] hover:text-white transition"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#F0F6FC] leading-tight pr-8">
              Kaiy{"\u014d"}
            </h2>

            {/* Description */}
            <p className="mt-4 text-xs sm:text-sm md:text-[15px] leading-6 sm:leading-7 text-[#C9D1D9]">
              Building modern digital products for startups that want to launch
              faster, grow smarter, and stand out online. We craft premium
              websites, branding, and user experiences designed for the next
              generation of businesses.
            </p>

            {/* Required */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-[#F0F6FC]">
                What We Do
              </h3>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-6 sm:leading-7 text-[#8B949E]">
                ⚡ Startup websites that look premium, load fast, and convert
                visitors into customers. From landing pages to complete digital
                experiences — we help your brand make a powerful first
                impression.
              </p>
            </div>

            {/* Analytics */}
            <div className="mt-5 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-[#F0F6FC]">
                Why Choose Us
              </h3>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-6 sm:leading-7 text-[#8B949E]">
                🚀 Clean design, smooth performance, mobile-first development,
                and modern UI/UX tailored for startups that want to scale with
                confidence.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}