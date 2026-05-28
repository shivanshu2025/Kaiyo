import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils/cn";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "light" | "warm" | "dark";
  delay?: number;
  hover?: boolean;
};

const toneClasses = {
  light: "border-white/70 bg-white/88 text-[#171923] shadow-[0_20px_70px_rgba(32,28,20,0.08)]",
  warm: "border-[#d7cfbf] bg-[#cfc7b6] text-[#171923] shadow-[0_22px_65px_rgba(84,75,58,0.12)]",
  dark: "border-white/10 bg-[#20232d] text-white shadow-[0_24px_70px_rgba(18,20,28,0.18)]",
};

export function GlassPanel({ children, className, tone = "light", delay = 0, hover = true }: GlassPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={hover ? { y: -4 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-[28px] border backdrop-blur-2xl will-change-transform",
        toneClasses[tone],
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          tone === "dark"
            ? "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.08),transparent_34%)]"
            : "bg-[linear-gradient(135deg,rgba(255,255,255,0.64),rgba(255,255,255,0.12))]",
        )}
      />
      <div className="relative h-full">{children}</div>
    </motion.section>
  );
}