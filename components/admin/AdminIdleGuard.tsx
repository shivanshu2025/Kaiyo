'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminHeaders } from '@/lib/admin-client';

/**
 * Client-side half of the "Auto Logout" security setting: signs the admin out after the
 * configured period of inactivity.
 *
 * This is a convenience, not the security boundary - the authoritative inactivity
 * limit is enforced server-side on every request by `resolveAuth` in
 * `lib/admin-auth.ts`, using the same value. This component only makes the sign-out
 * happen promptly instead of on the next click.
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
      // Sends the CSRF header so the server-side session is actually revoked,
      // rather than only clearing the cookie in this tab.
      await fetch('/api/admin/logout', { method: 'POST', headers: adminHeaders(false) }).catch(
        () => null,
      );
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