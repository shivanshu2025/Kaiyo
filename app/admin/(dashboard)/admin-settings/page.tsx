'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Timer, KeyRound, MonitorSmartphone } from 'lucide-react';
import { Button, Card, ErrorBlock, Field, LoadingBlock, inputClass } from '@/components/admin/ui';
import type { AdminSession } from '@/lib/admin-security';

type SecurityData = {
  maxFailedAttempts: number;
  lockoutMinutes: number;
  autoLogoutMinutes: number;
  failedAttempts: number;
  lockedUntil: string | null;
  pinUpdatedAt: string | null;
  pinChanged: boolean;
  currentSessionId: string | null;
  sessions: AdminSession[];
};

type Status = { kind: 'success' | 'error'; message: string } | null;

const statusClass = (kind: 'success' | 'error') =>
  kind === 'success'
    ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700'
    : 'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700';

const ACTION_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg bg-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--admin-brand-hover)] disabled:cursor-not-allowed disabled:opacity-60';

function PinInput({
  value,
  onChange,
  autoComplete,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  label: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        aria-label={label}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function describeDevice(userAgent: string) {
  if (!userAgent || userAgent === 'Unknown device') return 'Unknown device';
  const browser = /edg/i.test(userAgent)
    ? 'Edge'
    : /chrome|crios/i.test(userAgent)
      ? 'Chrome'
      : /firefox/i.test(userAgent)
        ? 'Firefox'
        : /safari/i.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const platform = /windows/i.test(userAgent)
    ? 'Windows'
    : /mac os/i.test(userAgent)
      ? 'macOS'
      : /android/i.test(userAgent)
        ? 'Android'
        : /iphone|ipad|ios/i.test(userAgent)
          ? 'iOS'
          : /linux/i.test(userAgent)
            ? 'Linux'
            : '';
  return platform ? `${browser} on ${platform}` : browser;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatus, setPinStatus] = useState<Status>(null);
  const [savingPin, setSavingPin] = useState(false);

  const [limits, setLimits] = useState({ maxFailedAttempts: 5, lockoutMinutes: 15, autoLogoutMinutes: 60 });
  const [securityStatus, setSecurityStatus] = useState<Status>(null);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const response = await fetch('/api/admin/security', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setLoadError(payload?.error || 'Unable to load security settings.');
        return;
      }
      setData(payload.data);
      setLimits({
        maxFailedAttempts: payload.data.maxFailedAttempts,
        lockoutMinutes: payload.data.lockoutMinutes,
        autoLogoutMinutes: payload.data.autoLogoutMinutes,
      });
    } catch {
      setLoadError('Unable to load security settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePin() {
    if (savingPin) return;
    setSavingPin(true);
    setPinStatus(null);

    try {
      const response = await fetch('/api/admin/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setPinStatus({ kind: 'error', message: payload?.error || 'Unable to update the PIN.' });
        return;
      }

      setPinStatus({ kind: 'success', message: payload.message || 'PIN updated.' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      await load();
    } catch {
      setPinStatus({ kind: 'error', message: 'Unable to update the PIN. Please try again.' });
    } finally {
      setSavingPin(false);
    }
  }

  async function saveSecurity() {
    if (savingSecurity) return;
    setSavingSecurity(true);
    setSecurityStatus(null);

    try {
      const response = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setSecurityStatus({ kind: 'error', message: payload?.error || 'Unable to save settings.' });
        return;
      }

      setSecurityStatus({ kind: 'success', message: payload.message || 'Security settings saved.' });
      await load();
    } catch {
      setSecurityStatus({ kind: 'error', message: 'Unable to save settings. Please try again.' });
    } finally {
      setSavingSecurity(false);
    }
  }

  async function revoke(body: { id?: string; others?: boolean }) {
    const key = body.id || 'others';
    setRevoking(key);
    setSecurityStatus(null);

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setSecurityStatus({ kind: 'error', message: payload?.error || 'Unable to revoke session.' });
        return;
      }

      // The current session was revoked: its cookie is already cleared server-side.
      if (body.id && body.id === data?.currentSessionId) {
        router.replace('/admin/login');
        router.refresh();
        return;
      }

      setSecurityStatus({ kind: 'success', message: payload.message || 'Session revoked.' });
      await load();
    } catch {
      setSecurityStatus({ kind: 'error', message: 'Unable to revoke session.' });
    } finally {
      setRevoking(null);
    }
  }

  if (loading) return <LoadingBlock label="Loading security settings…" />;
  if (loadError || !data) return <ErrorBlock message={loadError || 'Security settings unavailable'} onRetry={load} />;

  const lockedMinutes = data.lockedUntil
    ? Math.max(1, Math.ceil((new Date(data.lockedUntil).getTime() - Date.now()) / 60_000))
    : 0;
  const otherSessions = data.sessions.filter((session) => session.id !== data.currentSessionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Admin Settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage the admin PIN, login protection and active sessions.
        </p>
      </div>

      <Card
        title="Change Admin PIN"
        description={
          data.pinUpdatedAt
            ? `Last updated ${formatDate(data.pinUpdatedAt)}.`
            : 'Using the PIN configured through the ADMIN_PASSWORD environment variable.'
        }
      >
        <div className="space-y-4">
          <Field label="Current PIN" hint="Confirm your existing PIN to authorise the change.">
            <PinInput
              value={currentPin}
              onChange={setCurrentPin}
              autoComplete="current-password"
              label="Current PIN"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New PIN" hint="Minimum 4 characters.">
              <PinInput
                value={newPin}
                onChange={setNewPin}
                autoComplete="new-password"
                label="New PIN"
              />
            </Field>

            <Field label="Confirm New PIN" hint="Must match the new PIN.">
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                autoComplete="new-password"
                label="Confirm New PIN"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={savePin}
              disabled={savingPin || !currentPin || !newPin || !confirmPin}
              className={ACTION_CLASS}
            >
              <KeyRound size={16} />
              {savingPin ? 'Saving…' : 'Save Changes'}
            </button>
            {data.pinChanged && (
              <span className="text-xs text-stone-500">
                PIN is stored securely as a salted hash — it is never sent to the browser.
              </span>
            )}
          </div>

          {pinStatus && (
            <p className={statusClass(pinStatus.kind)} role="status">
              {pinStatus.message}
            </p>
          )}
        </div>
      </Card>

      <Card title="Security Settings" description="Applies to the admin login for this site.">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Failed Login Attempts"
              hint={`Allowed wrong PINs before lockout. ${data.failedAttempts} failed attempt${
                data.failedAttempts === 1 ? '' : 's'
              } recorded.`}
            >
              <input
                type="number"
                min={1}
                max={50}
                value={limits.maxFailedAttempts}
                onChange={(event) =>
                  setLimits({ ...limits, maxFailedAttempts: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Temporary Lockout (minutes)" hint="How long login stays blocked after the limit.">
              <input
                type="number"
                min={1}
                max={1440}
                value={limits.lockoutMinutes}
                onChange={(event) =>
                  setLimits({ ...limits, lockoutMinutes: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>

            <Field label="Auto Logout (minutes)" hint="Idle sessions are ended automatically.">
              <input
                type="number"
                min={1}
                max={720}
                value={limits.autoLogoutMinutes}
                onChange={(event) =>
                  setLimits({ ...limits, autoLogoutMinutes: Number(event.target.value) })
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            {lockedMinutes > 0 ? (
              <span className="font-medium text-red-700">
                Login is temporarily locked for another {lockedMinutes} minute
                {lockedMinutes === 1 ? '' : 's'}.
              </span>
            ) : (
              <span>
                Login is not locked. {Math.max(0, data.maxFailedAttempts - data.failedAttempts)} attempt
                {data.maxFailedAttempts - data.failedAttempts === 1 ? '' : 's'} remaining before
                lockout.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={saveSecurity} disabled={savingSecurity} className={ACTION_CLASS}>
              <ShieldCheck size={16} />
              {savingSecurity ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {securityStatus && (
            <p className={statusClass(securityStatus.kind)} role="status">
              {securityStatus.message}
            </p>
          )}
        </div>
      </Card>

      <Card
        title="Active Sessions"
        description="Devices currently signed in to the admin panel."
        actions={
          otherSessions.length > 0 ? (
            <Button
              variant="danger"
              onClick={() => revoke({ others: true })}
              disabled={revoking === 'others'}
            >
              <Timer size={14} />
              {revoking === 'others' ? 'Signing out…' : 'Sign out other sessions'}
            </Button>
          ) : null
        }
      >
        {data.sessions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No active sessions recorded.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.sessions.map((session) => {
              const isCurrent = session.id === data.currentSessionId;
              return (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <MonitorSmartphone size={16} className="mt-0.5 shrink-0 text-stone-500" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-stone-900">
                        {describeDevice(session.userAgent)}
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            This device
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        Started {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="danger"
                    disabled={revoking === session.id}
                    onClick={() => revoke({ id: session.id })}
                  >
                    {revoking === session.id ? 'Signing out…' : 'Revoke'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}