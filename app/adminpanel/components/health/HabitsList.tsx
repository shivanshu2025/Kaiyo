"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils/cn";
import { GlassPanel } from "./GlassPanel";

export type Habit = {
  id: number;
  title: string;
  trainer: string;
  sessions: number;
  total: number;
  avatar: string;
  avatarClass: string;
};

const initialHabits: Habit[] = [
  {
    id: 1,
    title: "Creative Studio",
    trainer: "Brand Logos • Viral Thumbnails",
    sessions: 4,
    total: 12,
    avatar: "C",
    avatarClass: "bg-[#d8cfb6] text-[#20222b]",
  },
  {
    id: 2,
    title: "Web Apps",
    trainer: "Portfolios • Landing Pages",
    sessions: 7,
    total: 10,
    avatar: "W",
    avatarClass: "bg-[#f0d5c5] text-[#20222b]",
  },
  {
    id: 3,
    title: "Web Apps",
    trainer: "Portfolios • Landing Pages",
    sessions: 7,
    total: 10,
    avatar: "W",
    avatarClass: "bg-[#f0d5c5] text-[#20222b]",
  },
  {
    id: 4,
    title: "Mobile UI",
    trainer: "React Native • Flutter",
    sessions: 2,
    total: 8,
    avatar: "M",
    avatarClass: "bg-[#d6c0a1] text-[#20222b]",
  },
];

function SessionBars({ habit }: { habit: Habit }) {
  return (
    <div className="flex items-end gap-1">
      {Array.from({ length: habit.total }, (_, index) => {
        const active = index < habit.sessions;

        return (
          <motion.span
            key={`${habit.id}-${index}`}
            initial={{ height: 4, opacity: 0.4 }}
            animate={{
              height: active ? 18 : 14,
              opacity: 1,
            }}
            transition={{
              duration: 0.32,
              delay: 0.18 + index * 0.025,
            }}
            className={cn(
              "w-1.5 rounded-full",
              active
                ? "bg-[#ff5f4f] shadow-[0_0_10px_rgba(255,95,79,0.38)]"
                : "bg-[#d8d4cc]"
            )}
          />
        );
      })}
    </div>
  );
}

export function HabitsList() {
  const [habits, setHabits] = useState(initialHabits);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // pagination (ONLY 3 CARDS)
  const pageSize = 3;
  const [page, setPage] = useState(0);

  const paginatedHabits = useMemo(() => {
    const start = page * pageSize;
    return habits.slice(start, start + pageSize);
  }, [habits, page]);

  const handleAddNew = () => {
    const newHabit: Habit = {
      id: Date.now(),
      title: "New Project",
      trainer: "Creative Solution",
      sessions: 3,
      total: 10,
      avatar: "N",
      avatarClass: "bg-[#d6c0a1] text-[#20222b]",
    };

    setHabits((prev) => [newHabit, ...prev]);
    setPage(0); // show new card immediately
  };

  const handleDelete = (id: number) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setActiveMenu(null);
  };

  // close menu on outside click
  useEffect(() => {
    const close = () => setActiveMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <GlassPanel
      delay={0.22}
      className="min-h-[310px] p-6 overflow-hidden"
      hover
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#171923]">
          My Solutions
        </h2>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-3 text-sm font-black text-[#171923] transition-all hover:translate-x-1"
        >
          Add New
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171923] text-[#ffe159] shadow-[0_10px_20px_rgba(23,25,35,0.16)]">
            <Plus className="h-4 w-4" />
          </span>
        </button>
      </div>

      {/* LIST */}
      <div className="mt-6 space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scroll">
        <AnimatePresence>
          {paginatedHabits.map((habit, index) => (
            <motion.article
              key={habit.id}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="relative grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl bg-[#f0ede6] px-4 py-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black",
                    habit.avatarClass
                  )}
                >
                  {habit.avatar}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-[#171923]">
                    {habit.title}
                  </h3>
                  <p className="truncate text-xs font-semibold text-[#716b61]">
                    {habit.trainer}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 relative">
                <SessionBars habit={habit} />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu((prev) =>
                      prev === habit.id ? null : habit.id
                    );
                  }}
                  className="rounded-full p-1 hover:bg-white/70"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {activeMenu === habit.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-10 z-20 w-32 rounded-xl border bg-white p-2 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200 text-[#171923] text-sm hover:bg-gray-300 transition disabled:opacity-40"
        >
          ‹
        </button>

        <button
          onClick={() =>
            setPage((p) =>
              (p + 1) * pageSize < habits.length ? p + 1 : p
            )
          }
          disabled={page >= Math.max(Math.ceil(habits.length / pageSize) - 1, 0)}
          className="h-7 w-7 flex items-center justify-center rounded-full bg-gray-200 text-[#171923] text-sm hover:bg-gray-300 transition disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </GlassPanel>
  );
}