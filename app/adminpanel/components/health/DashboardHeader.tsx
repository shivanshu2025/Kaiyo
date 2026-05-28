import { Search } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between [@media(max-height:950px)]:gap-4"
    >
      <div>
        <h1 className="text-[30px] font-black leading-none tracking-[-0.04em] text-[#171923] sm:text-[34px]">Hi, Shivanshu!</h1>
        <p className="mt-3 text-sm font-medium text-[#4b4b50] [@media(max-height:950px)]:mt-2">Let's take a look at your activity today</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="group relative flex h-12 min-w-0 items-center rounded-full bg-white px-5 shadow-[0_14px_35px_rgba(31,27,20,0.05)] ring-1 ring-black/[0.02] transition-all focus-within:ring-2 focus-within:ring-[#ffe159] sm:w-[260px]">
          <Search className="h-[18px] w-[18px] text-[#171923]" />
          <input
            className="ml-3 w-full bg-transparent text-sm font-medium text-[#171923] outline-none placeholder:text-[#9a948a]"
            placeholder="Search for health data"
            type="search"
          />
        </label>

        <button className="h-12 rounded-full bg-[#171923] px-8 text-sm font-bold text-white shadow-[0_16px_35px_rgba(23,25,35,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#242735] active:translate-y-0">
          Upgrade
        </button>
      </div>
    </motion.header>
  );
}
