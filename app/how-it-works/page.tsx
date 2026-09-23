'use client';

import { useState } from 'react';
import { Caveat } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiArrowRight,
  FiCheckCircle,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiShield,
  FiZap,
  FiBriefcase,
  FiTarget,
  FiShare2,
  FiMessageCircle,
  FiChevronDown
} from 'react-icons/fi';

type TierData = { name: string; percentage: string; description: string; features: string[]; color: string };
type WorkflowStepData = { number: string; title: string; description: string };
type WhyChooseUsData = { icon: string; title: string; description: string };
type PartnerFAQData = { question: string; answer: string };
type PartnerProgramData = {
  heroTitle: string; heroDescription: string; heroImage: string;
  tiers: TierData[]; workflowSteps: WorkflowStepData[]; yourRole: string[]; ourRole: string[];
  whyChooseUs: WhyChooseUsData[]; faqs: PartnerFAQData[];
  calculator: { heading: string; description: string; defaultProjectValue: number; defaultRole: string; defaultPercentage: number; defaultEarnings: number; buttonText: string; buttonLink: string };
  ctaTitle: string; ctaDescription: string; ctaWhatsApp: string; ctaPrimaryText: string; ctaSecondaryText: string; ctaSecondaryLink: string; ctaBackgroundImage: string;
};

const caveat = Caveat({ subsets: ['latin'], weight: ['600'] });

const defaultData: PartnerProgramData = {
  heroTitle: 'How It Works',
  heroDescription: 'Join our partner network and earn up to 65% commission on every project. Simple, transparent, and profitable.',
  heroImage: 'https://engineersealstamps.com/cdn/shop/products/in-use-great-job-stamp-4773-photo-1_a600c697-e7ec-4ee7-89e3-f7288a7894e4.jpg?v=1683890415&width=1500',
  tiers: [
    { name: 'Referral Partner', percentage: '30%', description: 'Simply refer clients to us', features: ['Share client leads', 'No technical work required', 'Passive income stream', 'Unlimited referrals'], color: 'bg-blue-500' },
    { name: 'Closing Expert', percentage: '50%', description: 'Help negotiate and close deals', features: ['Manage client communication', 'Negotiate contracts', 'Higher earning potential', 'Direct client interaction'], color: 'bg-purple-500' },
    { name: 'Full Handling', percentage: '65%', description: 'End-to-end project management', features: ['Complete project ownership', 'Maximum earnings', 'Priority project allocation', 'Dedicated support'], color: 'bg-emerald-500' },
  ],
  workflowSteps: [
    { number: '01', title: 'Connect', description: 'Share client leads or help close deals' },
    { number: '02', title: 'We Build', description: 'Our team delivers exceptional results' },
    { number: '03', title: 'Get Paid', description: 'Receive your earnings within 7 days' },
  ],
  yourRole: ['Identify and connect with potential clients', 'Share project requirements with our team', 'Facilitate initial discussions (optional)', 'Maintain client relationships', 'Track project progress and earnings'],
  ourRole: ['Handle all technical development', 'Manage project timelines and delivery', 'Provide regular progress updates', 'Ensure quality assurance and testing', 'Process your earnings promptly'],
  whyChooseUs: [
    { icon: 'FiDollarSign', title: 'High Commissions', description: 'Earn up to 65% on every project you bring' },
    { icon: 'FiShield', title: 'Secure Payments', description: 'Transparent and timely payouts guaranteed' },
    { icon: 'FiTarget', title: 'Quality Delivery', description: 'We ensure exceptional results for your clients' },
    { icon: 'FiUsers', title: 'Dedicated Support', description: '24/7 assistance for partners and clients' },
    { icon: 'FiTrendingUp', title: 'Growth Potential', description: 'Scale your earnings with more projects' },
    { icon: 'FiZap', title: 'Fast Turnaround', description: 'Quick project completion and delivery' },
  ],
  faqs: [
    { question: 'How do I become a partner?', answer: 'Simply click "Get Started" and fill out the partner application form. Our team will review your profile and get back to you within 24 hours.' },
    { question: 'When do I get paid?', answer: 'Payments are processed within 7 days of project completion and client payment.' },
    { question: 'Do I need technical skills?', answer: 'Not necessarily! As a referral partner, you just need to connect us with potential clients.' },
    { question: 'Is there a minimum project value?', answer: 'We work with projects starting from ₹10,000.' },
    { question: 'Can I work on multiple projects?', answer: 'Absolutely! There is no limit to how many clients you can refer.' },
  ],
  calculator: {
    heading: 'Calculate Your Potential',
    description: 'See how much you can earn based on project value and your role',
    defaultProjectValue: 50000,
    defaultRole: 'Referral',
    defaultPercentage: 30,
    defaultEarnings: 15000,
    buttonText: 'Try Interactive Calculator',
    buttonLink: '/calculator',
  },
  ctaTitle: 'Ready to Start Earning?',
  ctaDescription: 'Join hundreds of partners who are already earning with us. Start your journey today.',
  ctaWhatsApp: 'https://wa.me/919876543210',
  ctaPrimaryText: 'Contact on WhatsApp',
  ctaSecondaryText: 'Get Started Now',
  ctaSecondaryLink: '/partner-signup',
  ctaBackgroundImage: '',
};

const iconMap: Record<string, React.ReactNode> = {
  FiDollarSign: <FiDollarSign size={24} />,
  FiShield: <FiShield size={24} />,
  FiTarget: <FiTarget size={24} />,
  FiUsers: <FiUsers size={24} />,
  FiTrendingUp: <FiTrendingUp size={24} />,
  FiZap: <FiZap size={24} />,
  FiShare2: <FiShare2 size={24} />,
  FiBriefcase: <FiBriefcase size={24} />,
  FiCheckCircle: <FiCheckCircle size={24} />,
};

export default function HowItWorksPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const data = defaultData;

  const tiers: TierData[] = data.tiers || [];
  const workflowSteps: WorkflowStepData[] = data.workflowSteps || [];
  const whyChooseUs: WhyChooseUsData[] = data.whyChooseUs || [];
  const faqs: PartnerFAQData[] = data.faqs || [];

  return (
    <main className="min-h-screen bg-[#E9E9E7] text-[#32483e]">
      <section className="relative overflow-hidden bg-[#E9E9E7] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight mb-4 sm:mb-6 ${caveat.className}`}>
                {data.heroTitle?.split(' ')[0]}{' '}
                <span className="relative inline-block">
                  {data.heroTitle?.split(' ').slice(1).join(' ') || 'Works'}
                  <span className="absolute left-0 bottom-1 sm:bottom-2 w-full h-2 sm:h-3 bg-[#32483e]/20 -z-0 rotate-[-2deg] rounded-md"></span>
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-lg">{data.heroDescription}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.a href="/calculator" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 bg-[#32483e] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-[#2a3d34] transition-colors text-sm sm:text-base">
                  Calculate Earnings <FiArrowRight size={18} />
                </motion.a>
              </div>
            </motion.div>
            <div className="w-full">
              <img src={data.heroImage || defaultData.heroImage} alt="How it works" className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-cover shadow-lg rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 ${caveat.className}`}>Transparent Earning Tiers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">Choose your involvement level and earn accordingly. More responsibility, higher rewards.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {tiers.map((tier, index) => (
              <motion.div key={tier.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} className="group relative bg-[#E9E9E7] rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2.5 sm:w-3 h-20 sm:h-24 rounded-r-full ${tier.color}`} />
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-4xl sm:text-5xl font-black text-[#32483e] mb-2">{tier.percentage}</div>
                  <p className="text-xs sm:text-sm text-gray-600">{tier.description}</p>
                </div>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                      <FiCheckCircle className="text-[#32483e] mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a href="/partner-signup" className="block w-full text-center bg-[#32483e]/10 text-[#32483e] py-2.5 sm:py-3 rounded-xl font-semibold hover:bg-[#32483e] hover:text-white transition-colors text-sm">Get Started</a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#E9E9E7]">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 ${caveat.className}`}>Clear Division of Responsibility</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-10">
            <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[#E9E9E7] rounded-2xl p-5 sm:p-8 border border-white/60 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3"><FiUsers className="text-[#32483e] flex-shrink-0" /> Your Role</h3>
              <ul className="space-y-3 sm:space-y-4">
                {(data.yourRole || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#32483e] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</div>
                    <span className="text-gray-700 text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-[#E9E9E7] rounded-2xl p-5 sm:p-8 border border-white/60 shadow-sm">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3"><FiBriefcase className="text-[#32483e] flex-shrink-0" /> Our Role</h3>
              <ul className="space-y-3 sm:space-y-4">
                {(data.ourRole || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#32483e] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">{i + 1}</div>
                    <span className="text-gray-700 text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 ${caveat.className}`}>Simple 3-Step Process</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {workflowSteps.map((step, index) => (
              <motion.div key={step.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} className="relative bg-white/40 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="text-5xl sm:text-6xl font-black text-[#32483e]/10 absolute top-3 sm:top-4 right-4">{step.number}</div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#32483e] text-white flex items-center justify-center mb-3 sm:mb-4">{iconMap[step.title] || <FiShare2 size={28} />}</div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#E9E9E7]">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 ${caveat.className}`}>{data.calculator?.heading || 'Calculate Your Potential'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">{data.calculator?.description || 'See how much you can earn based on project value and your role'}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-[#32483e] to-[#2a3d34] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 text-white">
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="text-xs sm:text-sm mb-2 opacity-80">Project Value</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">₹{(data.calculator?.defaultProjectValue || 50000).toLocaleString('en-IN')}</div>
                <div className="text-xs opacity-60">Example project</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="text-xs sm:text-sm mb-2 opacity-80">Your Role</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">{data.calculator?.defaultRole || 'Referral'}</div>
                <div className="text-xs opacity-60">{data.calculator?.defaultPercentage || 30}% commission</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <div className="text-xs sm:text-sm mb-2 opacity-80">Your Earnings</div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">₹{(data.calculator?.defaultEarnings || 15000).toLocaleString('en-IN')}</div>
                <div className="text-xs opacity-60">Per project</div>
              </div>
            </div>
            <div className="text-center">
              <a href={data.calculator?.buttonLink || '/calculator'} className="inline-flex items-center gap-2 bg-[#E9E9E7] text-[#32483e] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm sm:text-base">
                {data.calculator?.buttonText || 'Try Interactive Calculator'} <FiArrowRight size={18} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 ${caveat.className}`}>Why Choose Us</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {whyChooseUs.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.02 }} className="bg-white/40 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#32483e]/10 text-[#32483e] flex items-center justify-center mb-3 sm:mb-4">{iconMap[feature.icon] || <FiDollarSign size={24} />}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-[#E9E9E7]">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-sm text-gray-600 mb-2">FAQ</p>
              <h2 className={`text-3xl sm:text-4xl md:text-5xl ${caveat.className} mb-4 sm:mb-6`}>Frequently Asked Questions</h2>
              <p className="text-gray-600 text-sm sm:text-base">Everything you need to know about our partner program.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-3">
              {faqs.map((item, i) => (
                <div key={i} className="border border-[#32483e]/10 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex justify-between items-start gap-4 px-4 sm:px-5 py-3 sm:py-4 text-left font-semibold text-sm sm:text-base">
                    <span>{item.question}</span>
                    <motion.span className="flex-shrink-0 mt-0.5" animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.2 }}><FiChevronDown size={18} /></motion.span>
                  </button>
                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-gray-700">{item.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-[#32483e] to-[#2a3d34] rounded-2xl sm:rounded-[2.5rem] p-7 sm:p-10 md:p-16 text-center text-white relative overflow-hidden" style={data.ctaBackgroundImage ? { backgroundImage: `url(${data.ctaBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
            {data.ctaBackgroundImage && <div className="absolute inset-0 bg-gradient-to-br from-[#32483e]/90 to-[#2a3d34]/90" />}
            <div className="relative z-10">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 ${caveat.className}`}>{data.ctaTitle || 'Ready to Start Earning?'}</h2>
              <p className="text-base sm:text-lg text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto">{data.ctaDescription || 'Join hundreds of partners who are already earning with us.'}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <motion.a href={data.ctaWhatsApp || 'https://wa.me/919876543210'} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 bg-[#E9E9E7] text-[#32483e] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm sm:text-base">
                  <FiMessageCircle size={18} /> {data.ctaPrimaryText || 'Contact on WhatsApp'}
                </motion.a>
                <motion.a href={data.ctaSecondaryLink || '/partner-signup'} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm sm:text-base">
                  {data.ctaSecondaryText || 'Get Started Now'} <FiArrowRight size={16} />
                </motion.a>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </motion.div>
        </div>
      </section>
    </main>
  );
}
