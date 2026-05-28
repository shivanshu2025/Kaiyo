import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { GlassPanel } from "./GlassPanel";

export function StepsCard() {
  return (
    <GlassPanel delay={0.18} className="min-h-[150px] p-6 [@media(max-height:950px)]:min-h-[138px] [@media(max-height:950px)]:p-5 [@media(max-height:760px)]:min-h-[128px] [@media(max-height:760px)]:p-4" hover>
      <div className="flex h-full items-center justify-between gap-5">
        <div className="min-w-[145px]">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#171923]">Steps for Today</h2>
          <p className="mt-1 text-xs font-medium text-[#777166]">Keep your body toned</p>

          <button className="mt-8 flex items-center gap-3 text-sm font-black text-[#171923] transition-all hover:translate-x-1 [@media(max-height:950px)]:mt-6">
            Change Goal
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#171923] text-[#ffe159] shadow-[0_10px_20px_rgba(23,25,35,0.16)]">
              <Pencil className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div className="relative flex h-[128px] w-[128px] shrink-0 items-center justify-center [@media(max-height:950px)]:h-[112px] [@media(max-height:950px)]:w-[112px]">
          <svg className="h-full w-full -rotate-[215deg]" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#ebe5dc" strokeWidth="8" strokeLinecap="round" strokeDasharray="212 70" />
            <motion.circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="url(#stepsGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="212 70"
              initial={{ strokeDashoffset: 212 }}
              animate={{ strokeDashoffset: 58 }}
              transition={{ duration: 1.1, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
            />
            <defs>
              <linearGradient id="stepsGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffe159" />
                <stop offset="45%" stopColor="#ff7a4e" />
                <stop offset="100%" stopColor="#ff4f43" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute text-center">
            <p className="text-xs font-semibold text-[#8b857b]">Goal</p>
            <p className="text-2xl font-black tracking-[-0.04em] text-[#171923]">8.500</p>
          </div>
          <div className="absolute right-0 top-5 rounded-full bg-white px-2 py-1 text-[10px] font-black text-[#171923] shadow-[0_8px_18px_rgba(31,27,20,0.12)]">
            5.201
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
