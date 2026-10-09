'use client';

import * as React from 'react';
import { Caveat } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPhone, FiMessageCircle } from 'react-icons/fi';
import { useCmsData } from '@/lib/use-cms';
import type { FaqItem } from '@/lib/cms-types';

type ContactPageContent = {
  heading: string;
  description: string;
  contactInfoHeading: string;
  contactInfoDescription: string;
  phone: string;
  whatsapp: string;
  faqs: FaqItem[];
};

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
});

const CONTACT_FALLBACK: ContactPageContent = {
  heading: "LET'S BUILD YOUR WEBSITE",
  description: "Tell us about your business or idea. We'll turn it into a clean, modern website.",
  contactInfoHeading: 'GET IN TOUCH',
  contactInfoDescription: "Fill out the form and tell us what you need. We'll get back to you soon.",
  phone: '9760926681',
  whatsapp: '9760926681',
  faqs: [
    { question: 'What services does Kaiyo offer?', answer: 'We offer a wide range of digital services including web design, development, branding, social media graphics, and digital invitations. Each solution is tailored to your specific needs.' },
    { question: 'How long does a typical project take?', answer: 'Project timelines vary based on complexity. A standard website takes 7-10 days, while more complex custom solutions may take 14-18 days or longer depending on requirements.' },
    { question: 'What is the pricing structure?', answer: 'Our pricing starts at $15,000 for starter websites and goes up based on complexity. We offer custom quotes for enterprise solutions and unique project requirements.' },
    { question: 'Do you offer post-launch support?', answer: 'Yes, we provide ongoing support and maintenance packages to ensure your digital presence remains up-to-date and performs optimally.' },
    { question: 'How do I get started?', answer: 'Simply fill out the contact form or reach out via WhatsApp. We will schedule a consultation to understand your vision and provide a tailored proposal.' },
  ],
};

export default function ContactPage() {
  const [formData, setFormData] = React.useState({ name: '', email: '', interest: '', phone: '', message: '' });
  const [success, setSuccess] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const { value: content } = useCmsData<ContactPageContent>(
    (cms) => ({
      heading: cms.contact?.heading ?? CONTACT_FALLBACK.heading,
      description: cms.contact?.description ?? CONTACT_FALLBACK.description,
      contactInfoHeading: cms.contact?.contactInfoHeading ?? CONTACT_FALLBACK.contactInfoHeading,
      contactInfoDescription: cms.contact?.contactInfoDescription ?? CONTACT_FALLBACK.contactInfoDescription,
      phone: cms.contact?.phone ?? CONTACT_FALLBACK.phone,
      whatsapp: cms.contact?.whatsapp ?? CONTACT_FALLBACK.whatsapp,
      faqs: cms.contact?.faqs?.length ? cms.contact.faqs : CONTACT_FALLBACK.faqs,
    }),
    CONTACT_FALLBACK
  );

  const data = { ...CONTACT_FALLBACK, ...(content || {}) };
  const FAQS = data.faqs;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Preselect the earning tier the visitor clicked on the partner page.
  // Read from the URL in an effect (rather than useSearchParams) so this static
  // page stays prerenderable without an extra Suspense boundary.
  React.useEffect(() => {
    const tier = new URLSearchParams(window.location.search).get('tier');
    if (!tier) return;
    setFormData((prev) => (prev.interest ? prev : { ...prev, interest: tier }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (submitting) return;
    setSubmitting(true);

    try {
      const response = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setError(payload?.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', interest: '', phone: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E9E9E7] text-[#32483e]">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <motion.h1
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight text-center mb-4 ${caveat.className}`}
        >
          {data.heading}
        </motion.h1>

        <p className="text-center text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-xl mx-auto">
          {data.description}
        </p>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 border-t border-[#32483e]/10 pt-8 sm:pt-10">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h3 className="font-semibold mb-2">START YOUR PROJECT</h3>
              <p className="text-sm text-gray-600">
                {data.contactInfoDescription}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <Input label="Name" name="name" value={formData.name} onChange={handleChange} />
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Input label="Interested In" name="interest" value={formData.interest} onChange={handleChange} />
                <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              </div>

              <div>
                <label className="text-sm text-gray-600">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border-b border-[#32483e]/80 bg-transparent outline-none py-2 resize-none focus:border-[#32483e]"
                  placeholder="Tell us about your website requirements…"
                />
              </div>

              {error && <p className="text-sm font-semibold text-[#DC2626]">{error}</p>}
              {success && <p className="text-sm font-semibold text-[#16A34A]">{success}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className="bg-[#32483e] text-white px-6 py-2.5 text-sm rounded-md disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h1>{data.contactInfoHeading}</h1>

            <InfoBlock title="Call Us" action={data.phone} icon={<FiPhone />} />
            <InfoBlock title="WhatsApp" action={data.whatsapp} icon={<FiMessageCircle />} />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12">
          <div>
            <p className="text-sm text-gray-600 mb-2">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Frequently asked questions.</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem key={i} item={{ q: item.question, a: item.answer }} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({ label, name, type = 'text', value, onChange }: { label: string; name: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full border-b border-[#32483e]/80 bg-transparent py-2 outline-none"
        placeholder={label}
      />
    </div>
  );
}

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

function FaqItem({ item, isOpen, onToggle }: { item: { q: string; a: string }; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#32483e]/10 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex justify-between items-start gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left">
        {item.q}
        <span>{isOpen ? '-' : '+'}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
            <div className="px-5 pb-5 text-sm text-gray-700">{item.a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
