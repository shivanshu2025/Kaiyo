'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Caveat } from 'next/font/google';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  FiShare2, FiDollarSign, 
  FiArrowRight, FiMessageCircle, FiZap, 
  FiTarget, FiAward, FiInfo 
} from 'react-icons/fi';

type TierData = { title: string; percentage: number; description: string; icon: string; accentColor: string; displayOrder: number; isEnabled: boolean };
type CalculatorData = {
  heroSection: { badgeText: string; heading: string; highlightText: string; description: string };
  projectValue: { minValue: number; maxValue: number; defaultValue: number; currency: string; capLabel: string };
  calculatorLogic: { maxEarning: number; rounding: number; displayFormat: string };
  resultCard: { heading: string; label: string; emptyStateMessage: string; currency: string; resultFormatting: string };
  ctaCard: { heading: string; description: string; primaryButton: string; secondaryButton: string; whatsappLink: string; joinButtonLink: string; backgroundImage: string };
  globalSettings: { currencySymbol: string; buttonLabels: { calculate: string; processing: string }; animationToggle: boolean; calculationDelay: number };
  tiers: TierData[];
};

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600'],
});

type Role = string;

interface RoleOption {
  id: Role;
  label: string;
  percentage: number;
  icon: React.ReactNode;
  description: string;
}

const iconMap: Record<string, React.ReactNode> = {
  FiShare2: <FiShare2 size={24} />,
  FiDollarSign: <FiDollarSign size={24} />,
  FiTarget: <FiTarget size={24} />,
  FiZap: <FiZap size={24} />,
  FiAward: <FiAward size={24} />,
  FiMessageCircle: <FiMessageCircle size={24} />,
  FiInfo: <FiInfo size={24} />,
};

const defaultConfig: CalculatorData = {
  heroSection: {
    badgeText: 'Partner Revenue v2.0',
    heading: 'Predict your',
    highlightText: 'success',
    description: 'Use our interactive simulator to explore earnings across different partnership tiers.',
  },
  projectValue: {
    minValue: 1,
    maxValue: 2500000,
    defaultValue: 0,
    currency: '₹',
    capLabel: 'Cap: ₹25L',
  },
  calculatorLogic: {
    maxEarning: 9999999,
    rounding: 0,
    displayFormat: 'en-IN',
  },
  resultCard: {
    heading: 'Tier Earnings',
    label: 'Your Share',
    emptyStateMessage: 'Enter amount to see breakdown',
    currency: '₹',
    resultFormatting: 'en-IN',
  },
  ctaCard: {
    heading: 'Ready to convert?',
    description: 'Join our elite network of partners and get access to high-ticket projects.',
    primaryButton: 'WhatsApp',
    secondaryButton: 'Join Now',
    whatsappLink: '#',
    joinButtonLink: '/contact',
    backgroundImage: '',
  },
  globalSettings: {
    currencySymbol: '₹',
    buttonLabels: {
      calculate: 'Calculate My Cut',
      processing: 'Processing...',
    },
    animationToggle: true,
    calculationDelay: 600,
  },
  tiers: [
    { title: 'Referral Partner', percentage: 30, description: 'Connect us with leads. We handle everything else.', icon: 'FiShare2', accentColor: '#32483e', displayOrder: 0, isEnabled: true },
    { title: 'Closing Expert', percentage: 50, description: 'Negotiate and finalize contracts with hot leads.', icon: 'FiTarget', accentColor: '#32483e', displayOrder: 1, isEnabled: true },
  ],
};

export default function CalculatorPage() {
  const [config] = useState<CalculatorData>(defaultConfig);
  const [amount, setAmount] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('');
  const [calculatedEarnings, setCalculatedEarnings] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading] = useState(false);
  const controls = useAnimation();

  const roleOptions: RoleOption[] = useMemo(() => {
    const tiers: TierData[] = config.tiers || [];
    const enabled = tiers.filter(t => t.isEnabled).sort((a, b) => a.displayOrder - b.displayOrder);
    if (enabled.length === 0) return [];
    return enabled.map(t => ({
      id: t.title,
      label: t.title,
      percentage: t.percentage,
      icon: iconMap[t.icon] || <FiShare2 size={24} />,
      description: t.description,
    }));
  }, [config.tiers]);

  const currentRole = useMemo(() => 
    roleOptions.find(r => r.id === selectedRole) || roleOptions[0],
  [selectedRole, roleOptions]);

  useEffect(() => {
    if (!isLoading && roleOptions.length > 0 && !selectedRole) {
      setSelectedRole(roleOptions[0].id);
    }
  }, [isLoading, roleOptions, selectedRole]);

  const calcLogic = config.calculatorLogic || defaultConfig.calculatorLogic!;
  const resultCard = config.resultCard || defaultConfig.resultCard!;
  const ctaCard = config.ctaCard || defaultConfig.ctaCard!;
  const globalSettings = config.globalSettings || defaultConfig.globalSettings!;
  const heroSection = config.heroSection || defaultConfig.heroSection!;
  const projectValue = config.projectValue || defaultConfig.projectValue!;

  const handleCalculate = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsCalculating(true);
    setCalculatedEarnings(null);
    
    await new Promise(resolve => setTimeout(resolve, globalSettings.calculationDelay ?? 600));
    
    const earnings = (numAmount * currentRole.percentage) / 100;
    const rounded = Math.round(earnings * Math.pow(10, calcLogic.rounding ?? 0)) / Math.pow(10, calcLogic.rounding ?? 0);
    setCalculatedEarnings(rounded);
    setIsCalculating(false);
    
    if (globalSettings.animationToggle ?? true) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.3 }
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    if (calculatedEarnings) setCalculatedEarnings(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#E9E9E7] text-[#1E293B] font-sans">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 sm:pb-16">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-slate-400">Loading calculator...</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E9E9E7] text-[#1E293B] font-sans">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-12 sm:pb-16">

        {/* HEADER */}
        <div className="text-center mb-6 pt-6">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/50 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4 border border-emerald-100 shadow-sm">
            <FiZap /> {heroSection.badgeText}
          </div>

          <h1 className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl leading-tight mb-2 ${caveat.className} text-[#32483e]`}>
            {heroSection.heading}{' '}
            <span className="relative inline-block">
              {heroSection.highlightText}
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 20" fill="none">
                <path
                  d="M5 15C50 5 150 5 295 15"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto mt-3 sm:mt-4 text-base sm:text-lg">
            {heroSection.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Side: Controls */}
          <div className="md:col-span-1 lg:col-span-7 space-y-6">
            <div className="bg-[#E9E9E7] rounded-2xl sm:rounded-[2rem] border border-white/60 p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">01. Project Value</span>
                {projectValue.capLabel && (
                  <span className="text-xs font-medium text-emerald-600 bg-white/50 px-2 py-0.5 rounded">{projectValue.capLabel}</span>
                )}
              </div>

              <div className="relative mb-6 sm:mb-10 group">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl sm:text-4xl font-light text-slate-300 pl-4 sm:pl-6 group-focus-within:text-[#32483e] transition-colors">{globalSettings.currencySymbol}</div>
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full bg-white/40 border-2 border-white rounded-xl sm:rounded-[1.5rem] pl-12 sm:pl-16 pr-4 sm:pr-8 py-4 sm:py-7 text-2xl sm:text-4xl font-bold outline-none focus:border-emerald-500/20 focus:bg-white transition-all"
                />
              </div>

              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 sm:mb-6 block">02. Involvement</span>

              <div className="space-y-3 mb-6 sm:mb-10">
                {roleOptions.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full group relative p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center gap-3 sm:gap-5 overflow-hidden ${
                      selectedRole === role.id
                        ? 'border-[#32483e] bg-white shadow-md'
                        : 'border-transparent bg-white/30 hover:bg-white/50'
                    }`}
                  >
                    {selectedRole === role.id && (
                      <motion.div layoutId="active-bar" className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#32483e]" />
                    )}

                    <div className={`p-2.5 sm:p-4 rounded-xl transition-all flex-shrink-0 ${
                      selectedRole === role.id ? 'bg-[#32483e] text-white' : 'bg-white/50 text-slate-400'
                    }`}>
                      {role.icon}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center mb-0.5 gap-2">
                        <span className={`font-bold text-sm sm:text-lg truncate ${selectedRole === role.id ? 'text-[#32483e]' : 'text-slate-600'}`}>
                          {role.label}
                        </span>
                        <span className={`text-xs font-bold flex-shrink-0 ${selectedRole === role.id ? 'text-[#32483e]' : 'text-slate-400'}`}>
                          {role.percentage}% Split
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 leading-snug">{role.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCalculate}
                disabled={!amount || isCalculating}
                className={`w-full py-4 sm:py-6 rounded-xl sm:rounded-[1.5rem] font-black text-base sm:text-xl tracking-wide transition-all flex items-center justify-center gap-3 ${
                  !amount ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#32483e] text-white hover:opacity-90 shadow-lg shadow-[#32483e]/10'
                }`}
              >
                {isCalculating ? globalSettings.buttonLabels?.processing || "Processing..." : <>{globalSettings.buttonLabels?.calculate || "Calculate My Cut"} <FiArrowRight /></>}
              </button>
            </div>
          </div>

          {/* Right Side: Result Card */}
          <div className="md:col-span-1 lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <motion.div
              animate={controls}
              className="bg-[#E9E9E7] rounded-2xl sm:rounded-[2rem] border border-white/60 p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-sm"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 sm:mb-10">
                  <span className="bg-white/80 text-emerald-600 p-2 rounded-lg"><FiDollarSign size={22}/></span>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{resultCard.heading}</div>
                    <div className="text-sm font-bold text-[#32483e]">{currentRole?.label}</div>
                  </div>
                </div>

                <div className="min-h-[120px] sm:min-h-[140px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {calculatedEarnings !== null ? (
                      <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="text-4xl sm:text-5xl md:text-6xl font-black text-[#32483e] tracking-tighter break-words">
                          {resultCard.currency || globalSettings.currencySymbol}
                          {calculatedEarnings.toLocaleString(resultCard.resultFormatting || 'en-IN')}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <FiInfo className="text-emerald-500 flex-shrink-0" />
                          Taxes calculated at payout.
                        </div>
                        <div className="pt-4 sm:pt-6 space-y-3">
                          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                            <span>{resultCard.label}</span>
                            <span>{currentRole.percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${currentRole.percentage}%` }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-6 sm:py-8 border-2 border-dashed border-white/40 rounded-3xl">
                        <p className="text-slate-400 font-medium italic text-sm sm:text-base">{resultCard.emptyStateMessage}</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Support CTA */}
            <div className="bg-[#32483e] rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl sm:text-2xl font-bold mb-2">{ctaCard.heading}</h4>
                <p className="text-emerald-100/60 text-sm mb-5 sm:mb-8">
                  {ctaCard.description}
                </p>
                <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                  <a href={ctaCard.whatsappLink || '#'} className="flex items-center justify-center gap-2 bg-[#E9E9E7] text-[#32483e] py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-white transition-colors">
                    <FiMessageCircle /> {ctaCard.primaryButton}
                  </a>
                  <a href={ctaCard.joinButtonLink || '/contact'} className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-colors">
                    {ctaCard.secondaryButton} <FiArrowRight />
                  </a>
                </div>
              </div>
              <FiAward className="absolute -right-8 -bottom-8 text-white/5 rotate-12" size={140} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
