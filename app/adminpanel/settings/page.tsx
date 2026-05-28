'use client';

import { useEffect } from "react";
import { useRequireAuth } from "../hooks/useRequireAuth";

export default function SettingsPage() {
  const ready = useRequireAuth();

  useEffect(() => {
    if (ready) {
      document.title = "kaiyo - Settings";
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-[#e6e8ee] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-8">
        <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#0f172a] tracking-tight">Settings</h1>
        <p className="mt-2 text-[15px] leading-6 text-[#64748b]">Manage your account settings and preferences.</p>
      </div>
    </div>
  );
}
