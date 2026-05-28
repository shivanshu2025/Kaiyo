import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Home,
  LogOut,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils/cn";
import Link from "next/link";


type SidebarProps = {
  activeItem: string;
  onItemChange: (item: string) => void;
  onLogout: () => void;
};

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  alert?: boolean;
};

function BeRunLogo() {
  return (
<Link href="/" className="flex flex-col items-center gap-2">
  <div className="relative h-10 w-10 text-[#151720]">
    <img src="/images/Kaiyologo.png" alt="logo" />
  </div>

  <span className="text-[12px] font-black tracking-tight text-[#171923]">
    kaiyo
  </span>
</Link>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      aria-label={item.label}
      onClick={onClick}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
        active
          ? "bg-[#171923] text-[#ffe159] shadow-[0_12px_30px_rgba(23,25,35,0.18)]"
          : "text-[#171923]/80 hover:bg-[#f2eee7] hover:text-[#171923]"
      )}
    >
      <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.7 : 2} />

      {item.alert && (
        <span className="absolute right-3 top-2.5 h-2 w-2 rounded-full bg-[#ff5948] ring-2 ring-white" />
      )}
    </button>
  );
}

export function Sidebar({
  activeItem,
  onItemChange,
  onLogout,
}: SidebarProps) {
  const primaryItems = useMemo<NavItem[]>(
    () => [
      { id: "home", label: "Home", icon: Home },

    ],
    []
  );

  const secondaryItems = useMemo<NavItem[]>(
    () => [
      { id: "notifications", label: "Notifications", icon: Bell, alert: true },
      { id: "settings", label: "Settings", icon: Settings },
    ],
    []
  );

  return (
    <aside
      className="
        flex w-full flex-col gap-4
        md:w-[90px] md:justify-between
        bg-transparent
      "
    >
      {/* TOP */}
      <div className="flex flex-row items-center justify-between gap-4 md:flex-col md:gap-10">
        <BeRunLogo />

        {/* PRIMARY NAV */}
        <motion.nav
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="
            flex gap-2 overflow-x-auto rounded-[30px]
            bg-white/92 p-2 shadow-[0_14px_45px_rgba(31,27,20,0.08)]
            md:flex-col md:overflow-visible md:rounded-full
          "
        >
          {primaryItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeItem === item.id}
              onClick={() => onItemChange(item.id)}
            />
          ))}
        </motion.nav>
      </div>

      {/* BOTTOM (NOW VISIBLE ON ALL DEVICES) */}
      <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-center">
        {/* secondary nav */}
        <nav
          className="
            flex gap-2 rounded-[30px] bg-white/92 p-2
            shadow-[0_14px_45px_rgba(31,27,20,0.08)]
            md:flex-col
          "
        >
          {secondaryItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeItem === item.id}
              onClick={() => onItemChange(item.id)}
            />
          ))}
        </nav>

        {/* logout + avatar */}
        <div
          className="
            flex items-center gap-3 rounded-[30px] bg-white/92 p-2
            shadow-[0_14px_45px_rgba(31,27,20,0.08)]
            md:flex-col md:p-3
          "
        >
          <button
            aria-label="Log out"
            onClick={onLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#171923] hover:bg-[#f2eee7]"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>

          <div className="flex h-[40px] w-[40px] md:h-[50px] md:w-[50px] items-center justify-center overflow-hidden rounded-full ring-4 ring-white">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8-jvZvJy35gpnQ4IOHMRt4pHg8iqGcsVqSQ&s"
              alt="dp"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}