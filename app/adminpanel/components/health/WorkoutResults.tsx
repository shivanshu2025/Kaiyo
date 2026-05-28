import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { workoutMetrics } from "../../lib/fitnessDashboard";
import { GlassPanel } from "./GlassPanel";

function MetricBubble({ label, subLabel, className, delay }: { label: string; subLabel: string; className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.74 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      <span className="text-center text-[13px] font-black leading-tight text-[#171923]">
        {label}
        <br />
        <span className="font-bold">{subLabel}</span>
      </span>
    </motion.div>
  );
}

export function WorkoutResults() {
  return (
    <GlassPanel tone="warm" delay={0.05} className="min-h-[300px] p-6 sm:p-7 lg:min-h-[324px] [@media(max-height:950px)]:min-h-[292px] [@media(max-height:950px)]:p-5 [@media(max-height:760px)]:min-h-[268px] [@media(max-height:760px)]:p-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="max-w-[240px] text-xl font-black leading-tight tracking-[-0.03em] text-[#171923]">
          Your Workout
          <br />
          Results for Today
        </h2>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171923] text-[#ffe159] shadow-[0_12px_24px_rgba(23,25,35,0.22)]">
          <CalendarDays className="h-[17px] w-[17px]" />
        </button>
      </div>

      <div className="absolute bottom-7 left-7 z-20 space-y-3">
        {workoutMetrics.map((metric) => (
          <div key={metric.label} className="flex items-center gap-3">
            <span className={`${metric.color} h-2.5 w-10 rounded-full shadow-[0_0_12px_rgba(255,225,89,0.45)]`} />
            <span className="text-xs font-semibold text-[#313235]/80">{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-4 bottom-6 top-16 sm:inset-x-8 sm:bottom-8 sm:top-12">
        <MetricBubble
          label="1.875"
          subLabel="kcal"
          delay={0.18}
          className="absolute right-2 top-2 flex h-[190px] w-[190px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff4a7_0%,#ffe15b_44%,rgba(255,225,91,0.62)_68%,rgba(255,225,91,0)_100%)] shadow-[0_0_56px_rgba(255,225,91,0.38)] sm:right-4 sm:h-[230px] sm:w-[230px]"
        />
        <MetricBubble
          label="850"
          subLabel="kcal"
          delay={0.28}
          className="absolute bottom-0 right-[170px] flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_36%_38%,#ffb39e_0%,#ff6253_48%,rgba(255,98,83,0.55)_70%,rgba(255,98,83,0)_100%)] shadow-[0_0_48px_rgba(255,98,83,0.34)] sm:right-[210px] sm:h-[170px] sm:w-[170px]"
        />
        <MetricBubble
          label="2.30"
          subLabel="hours"
          delay={0.38}
          className="absolute right-[210px] top-8 flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_28%,#5c625b_0%,#222620_58%,#11130f_100%)] shadow-[0_18px_42px_rgba(24,26,22,0.28)] sm:right-[270px]"
        />
      </div>
    </GlassPanel>
  );
}
