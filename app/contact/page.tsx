'use client';

import * as React from 'react';
import { Caveat } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPhone, FiMessageCircle } from 'react-icons/fi';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
});

const FAQS = [
  {
    q: 'Lorem ipsum dolor sit amet?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.',
  },
  {
    q: 'Praesent sapien massa convallis?',
    a: 'Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Donec sollicitudin molestie malesuada.',
  },
  {
    q: 'Proin eget tortor risus?',
    a: 'Proin eget tortor risus. Nulla quis lorem ut libero malesuada feugiat. Pellentesque in ipsum id orci porta dapibus.',
  },
  {
    q: 'Pellentesque in ipsum id orci porta?',
    a: 'Pellentesque in ipsum id orci porta dapibus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.',
  },
  {
    q: 'Lorem eget tortor risus amet sit?',
    a: 'Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Donec rutrum congue leo eget malesuada.',
  },
];

export default function ContactPage() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <main className="min-h-screen bg-[#E5E5E5] text-[#32483e]">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">

        <motion.h1
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight text-center mb-4 ${caveat.className}`}
        >
          Get in touch
        </motion.h1>

        <p className="text-center text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-xl mx-auto">
          Tell us about your idea — we’ll handle the design, development, and everything in between.
        </p>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 border-t border-[#32483e]/10 pt-8 sm:pt-10">

          {/* LEFT FORM */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h3 className="font-semibold mb-2">Send a Message</h3>
              <p className="text-sm text-gray-600">
                Pellentesque in ipsum id orci porta dapibus.
              </p>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <Input label="Name" name="name" />
                <Input label="Email Address" name="email" type="email" />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Input label="Interested In" name="interest" />
                <Input label="Phone Number" name="phone" type="tel" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Message</label>
                <textarea
                  rows={4}
                  className="w-full border-b border-[#32483e]/80 bg-transparent outline-none py-2 resize-none focus:border-[#32483e]"
                  placeholder="Tell us a bit about your project…"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                className="bg-[#32483e] text-white px-6 py-2.5 text-sm rounded-md"
              >
                Submit
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h1>Direct Contacts</h1>

            <InfoBlock
              title="Call Us"
              action="(235) 125-115"
              icon={<FiPhone />}
            />

            <InfoBlock
              title="WhatsApp"
              action="+91 98765 43210"
              icon={<FiMessageCircle />}
            />
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12">
          <div>
            <p className="text-sm text-gray-600 mb-2">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* INPUT */
function Input({ label, name, type = 'text' }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        className="w-full border-b border-[#32483e]/80 bg-transparent py-2 outline-none"
        placeholder={label}
      />
    </div>
  );
}

/* INFO BLOCK */
function InfoBlock({ title, action, icon }: { title: string; action: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#32483e]/10 bg-white/25 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="text-[#32483e] text-lg mt-1">{icon}</div>

        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-2 font-medium">{action}</p>
        </div>
      </div>
    </div>
  );
}

/* FAQ */
function FaqItem({ item, isOpen, onToggle }: { item: { q: string; a: string }; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#32483e]/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-start gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left"
      >
        {item.q}
        <span>{isOpen ? '-' : '+'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
          >
            <div className="px-5 pb-5 text-sm text-gray-700">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}