import { motion } from "framer-motion";
import { GlassPanel } from "./GlassPanel";

export function WeightLossPlan() {
  return (
    <GlassPanel delay={0.24} className="min-h-[150px] p-6 [@media(max-height:950px)]:min-h-[138px] [@media(max-height:950px)]:p-5 [@media(max-height:760px)]:min-h-[128px] [@media(max-height:760px)]:p-4" hover>
      <div className="flex items-start justify-between gap-5">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#171923]">Weight Loss Plan</h2>
        <div className="text-right">
          <p className="text-xl font-black tracking-[-0.04em] text-[#171923]">68%</p>
          <p className="text-xs font-semibold text-[#777166]">Completed</p>
        </div>
      </div>

      <div className="mt-9 [@media(max-height:950px)]:mt-6">
        <div className="relative h-5 rounded-full bg-[#ded8cd]">
          <div className="absolute inset-y-0 left-1 right-1 flex items-center justify-end gap-3 pr-2">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="h-1 w-1 rounded-full bg-[#bfb6a9]" />
            ))}
          </div>

          <motion.div
            initial={{ width: "18%" }}
            animate={{ width: "64%" }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-[#1b1e25] shadow-[0_0_16px_rgba(23,25,35,0.35)]"
          >
            <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white" />
            <div className="absolute -right-8 -top-9 rounded-full bg-[#171923] px-2 py-1 text-[10px] font-black text-white shadow-[0_10px_20px_rgba(23,25,35,0.18)]">
              53.2 kg
            </div>
          </motion.div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs font-black text-[#171923]">
          <span>58 kg</span>
          <span>50 kg</span>
        </div>
      </div>
    </GlassPanel>
  );
}
