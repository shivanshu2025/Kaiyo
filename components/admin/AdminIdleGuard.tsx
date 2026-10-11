'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side half of the "Auto Logout" security setting: signs the admin out after the
 * configured period of inactivity. The server-side token expiry (issued at login using
 * the same value) is the authoritative limit — this just ends the session promptly.
 */
export default function AdminIdleGuard({ minutes }: { minutes: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!minutes || minutes < 1) return;

    const limit = minutes * 60_000;
    let lastActivity = Date.now();
    let signingOut = false;

    const signOut = async () => {
      if (signingOut) return;
      signingOut = true;
      await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
      router.replace('/admin/login?reason=idle');
      router.refresh();
    };

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(signOut, limit);
    };

    const onActivity = () => {
      lastActivity = Date.now();
      schedule();
    };

    // Cheap periodic check so a backgrounded tab still signs out on time even when no
    // input events fire.
    const heartbeat = setInterval(() => {
      if (Date.now() - lastActivity >= limit) void signOut();
      else schedule();
    }, Math.min(limit, 30_000));

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'wheel',
      'touchstart',
      'focus',
    ];
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));

    schedule();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      clearInterval(heartbeat);
      events.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [minutes, router]);

  return null;
}