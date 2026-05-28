"use client";

import { useEffect } from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";

type AlertType = "info" | "success" | "warning" | "error";

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  icon: "bell" | "calendar" | "check" | "warning";
}

interface AlertCardProps {
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
}

const notifications: Notification[] = [
  {
    id: 1,
    title: "New message from Jane",
    description:
      "Hey, just wanted to follow up on our meeting yesterday.",
    time: "2 hours ago",
    icon: "bell",
  },
  {
    id: 2,
    title: "Upcoming event",
    description: "Team meeting scheduled for Friday at 2pm.",
    time: "1 day ago",
    icon: "calendar",
  },
  {
    id: 3,
    title: "Task completed",
    description:
      'You completed the "Update website content" task.',
    time: "3 days ago",
    icon: "check",
  },
];

/* =========================
   ICONS
========================= */

function InfoIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#5B9BF3" strokeWidth="1.8" />
        <circle cx="11" cy="7.5" r="1" fill="#5B9BF3" />
        <rect x="10" y="9.5" width="2" height="5.5" rx="1" fill="#5B9BF3" />
      </svg>
    </div>
  );
}

function SuccessIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#34C67A" strokeWidth="1.8" />
        <path
          d="M7 11.5L9.5 14L15 8.5"
          stroke="#34C67A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function WarningIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 shadow-sm">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3L20 19H2L11 3Z"
          stroke="#E5A824"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="11" cy="16" r="0.8" fill="#E5A824" />
        <rect x="10.2" y="9" width="1.6" height="5" rx="0.8" fill="#E5A824" />
      </svg>
    </div>
  );
}

function ErrorIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-red-100 shadow-sm">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#E5534B" strokeWidth="1.8" />
        <circle cx="11" cy="14.5" r="1" fill="#E5534B" />
        <rect x="10" y="6.5" width="2" height="5.5" rx="1" fill="#E5534B" />
      </svg>
    </div>
  );
}

const iconMap: Record<AlertType, React.FC> = {
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  error: ErrorIcon,
};

const gradientMap: Record<AlertType, string> = {
  info: "from-blue-100/80 via-blue-50/40 to-transparent",
  success: "from-emerald-100/80 via-emerald-50/40 to-transparent",
  warning: "from-amber-100/80 via-yellow-50/40 to-transparent",
  error: "from-red-100/80 via-red-50/40 to-transparent",
};

/* =========================
   ALERT CARD
========================= */

function AlertCard({
  type,
  title,
  message,
  onClose,
}: AlertCardProps) {
  const Icon = iconMap[type];
  const gradient = gradientMap[type];

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_1px_4px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_2px_8px_-1px_rgba(0,0,0,0.06)]">

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${gradient}`}
        style={{ width: "40%" }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4">
        <Icon />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-800 leading-tight">
                {title}
              </h3>

              <p className="mt-1 text-[13.5px] text-gray-500 leading-snug">
                {message}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors duration-200 hover:bg-gray-100/80 hover:text-gray-600"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* =========================
   PAGE
========================= */

export default function App() {
  const ready = useRequireAuth();

  useEffect(() => {
    if (ready) {
      document.title = "kaiyo - Notifications";
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[#e6e8ee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 pb-6 pt-7 sm:px-8">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-[#0f172a] sm:text-[22px]">
              Notifications
            </h1>

            <p className="mt-1.5 text-[15px] leading-6 text-[#64748b]">
              You have 12 new notifications.
            </p>
          </div>

          <button
            aria-label="Archive"
            className="mt-0.5 -mr-2 rounded-xl p-2.5 text-[#94a3b8] transition-colors hover:bg-[#f8fafc] hover:text-[#475569]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5" />
              <path d="M3 8.5l3.5-4.5h11L21 8.5" />
              <path d="M9 12h6" />
              <rect
                x="8"
                y="15"
                width="8"
                height="1.5"
                rx="0.75"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </button>
        </div>

        {/* Wavy Divider */}
        <div className="relative h-[14px] w-full">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='28' height='12' viewBox='0 0 28 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 Q7 0 14 6 T28 6' stroke='%23e6e8ee' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Notifications */}
        <div className="px-5 pb-7 pt-5 sm:px-8">
          <div className="flex flex-col gap-4">
            {notifications.map((notification) => {
              const typeMap: Record<string, AlertType> = {
                bell: "info",
                calendar: "warning",
                check: "success",
                warning: "error",
              };

              return (
                <AlertCard
                  key={notification.id}
                  type={typeMap[notification.icon]}
                  title={notification.title}
                  message={notification.description}
                  onClose={() => {}}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}