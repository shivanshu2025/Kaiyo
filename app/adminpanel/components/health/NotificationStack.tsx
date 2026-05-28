"use client";

import { motion } from "framer-motion";
import {
  Landmark,
  Home,
  HandCoins,
  ScanLine,
  Users,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { useState } from "react";

const items = [
  { title: "Bank account", icon: Landmark, color: "bg-slate-200" },
  { title: "Ownership", icon: Home, color: "bg-blue-200" },
  { title: "Source of Funds", icon: HandCoins, color: "bg-amber-200" },
  {
    title: "Identity verification",
    icon: ScanLine,
    color: "bg-violet-600",
    textColor: "text-white",
  },
  { title: "Representatives", icon: Users, color: "bg-sky-200" },
  { title: "UBO", icon: ShieldCheck, color: "bg-emerald-200" },
  { title: "AML Screening", icon: LoaderCircle, color: "bg-red-100" },
];

export default function NotificationStack() {
  const [activeIndex, setActiveIndex] = useState(3);
  return (

    <div className="relative flex items-center justify-center p-6 pt-20 min-h-[420px]">

      <h1 className="absolute top-6 left-6 text-xl font-bold text-black">
        Notification
      </h1>

      <div className="relative w-full max-w-sm h-[320px] overflow-hidden flex items-center justify-center">
        {items.map((item, index) => {
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);

          const scale = Math.max(0.82, 1 - absOffset * 0.06);
          const opacity = Math.max(0, 1 - absOffset * 0.25);

          // reduced spacing so all cards stay inside
          const translateY = offset * 52;

          return (
            <motion.div
              key={item.title}
              onClick={() => setActiveIndex(index)}
              initial={false}
              animate={{
                scale,
                opacity,
                y: translateY,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              style={{
                zIndex: items.length - absOffset,
              }}
              className={`absolute flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer w-full transition-colors duration-300 ${offset === 0
                ? "bg-white shadow-xl"
                : "bg-white/70 shadow-sm"
                }`}
            >
              <div
                className={`p-2 rounded-lg ${item.color
                  } ${item.textColor || "text-gray-600"}`}
              >
                <item.icon size={24} />
              </div>

              <span
                className={`font-semibold ${offset === 0 ? "text-black" : "text-gray-400"
                  }`}
              >
                {item.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}