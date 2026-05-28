export type CalendarStatus = "plain" | "done" | "current" | "scheduled";

export type CalendarDay = {
  day: number;
  status: CalendarStatus;
  gridColumnStart?: number;
};

export type Habit = {
  title: string;
  trainer: string;
  sessions: number;
  total: number;
  avatar: string;
  avatarClass: string;
};

export const workoutMetrics = [
  { label: "Calories intake", color: "bg-[#ffe25c]" },
  { label: "Calories burned", color: "bg-[#ff5f4f]" },
  { label: "Activity time", color: "bg-[#303430]" },
];

export const calendarDays: CalendarDay[] = [
  { day: 1, status: "done", gridColumnStart: 2 },
  { day: 2, status: "plain" },
  { day: 3, status: "plain" },
  { day: 4, status: "plain" },
  { day: 5, status: "done" },
  { day: 6, status: "plain" },
  { day: 7, status: "plain" },
  { day: 8, status: "plain" },
  { day: 9, status: "plain" },
  { day: 10, status: "plain" },
  { day: 11, status: "plain" },
  { day: 12, status: "plain" },
  { day: 12, status: "plain" },
  { day: 14, status: "current" },
  { day: 15, status: "plain" },
  { day: 16, status: "plain" },
  { day: 17, status: "scheduled" },
  { day: 18, status: "plain" },
  { day: 19, status: "scheduled" },
  { day: 20, status: "plain" },
  { day: 21, status: "plain" },
  { day: 22, status: "plain" },
  { day: 23, status: "scheduled" },
  { day: 24, status: "plain" },
  { day: 25, status: "plain" },
  { day: 26, status: "plain" },
  { day: 27, status: "plain" },
  { day: 28, status: "scheduled" },
  { day: 29, status: "plain" },
  { day: 30, status: "plain" },
];

