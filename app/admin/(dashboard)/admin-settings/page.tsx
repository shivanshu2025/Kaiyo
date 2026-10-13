'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Timer, KeyRound, MonitorSmartphone } from 'lucide-react';
import { Button, Card, ErrorBlock, Field, LoadingBlock, inputClass } from '@/components/admin/ui';
import { adminFetch, ApiError } from '@/lib/admin-client';

type AdminSession = {
  id: string;
  userAgent: string;
  ip: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  current: boolean;
};

type SecurityData = {
  maxFailedAttempts: number;
  lockoutMinutes: number;
  autoLogoutMinutes: number;
  failedAttempts: number;
  lockedUntil: string | null;
  passwordUpdatedAt: string | null;
  lastLoginAt: string | null;
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

/**
 * Inline validation message, rendered directly beneath the input it belongs to.
 *
 * `adminFetch` already extracts the server's `{ field: message }` map into
 * `ApiError.fields`; nothing displayed it, so every validation failure collapsed
 * into the single banner line ("Some fields are invalid"). The styling mirrors the
 * `Field` hint it sits under, so it slots in without changing the layout.
 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span role="alert" className="mt-1 block text-[11px] font-medium text-red-600">
      {message}
    </span>
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
  const [pinFieldErrors, setPinFieldErrors] = useState<Record<string, string>>({});
  const [pinStatus, setPinStatus] = useState<Status>(null);
  const [savingPin, setSavingPin] = useState(false);

  const [limits, setLimits] = useState({ maxFailedAttempts: 5, lockoutMinutes: 15, autoLogoutMinutes: 60 });
  const [securityStatus, setSecurityStatus] = useState<Status>(null);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const response = await adminFetch<SecurityData>('/api/admin/security');
      setData(response.data);
      setLimits({
        maxFailedAttempts: response.data.maxFailedAttempts,
        lockoutMinutes: response.data.lockoutMinutes,
        autoLogoutMinutes: response.data.autoLogoutMinutes,
      });
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : 'Unable to load security settings.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Typing in a field clears its own message, so the form does not nag while fixing it. */
  const editPin = (setter: (value: string) => void, field: string) => (value: string) => {
    setter(value);
    setPinFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  async function savePin() {
    if (savingPin) return;
    setSavingPin(true);
    setPinStatus(null);
    setPinFieldErrors({});

    try {
      const response = await adminFetch('/api/admin/pin', {
        method: 'POST',
        json: { currentPin, newPin, confirmPin },
      });

      setPinStatus({
        kind: 'success',
        message: response.message || 'PIN updated.',
      });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      await load();
    } catch (error) {
      // The server returns one message per offending field; keep them all so each
      // is shown beside the input it refers to instead of only in the banner.
      setPinFieldErrors(error instanceof ApiError && error.fields ? error.fields : {});
      setPinStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'Unable to update the PIN.',
      });
    } finally {
      setSavingPin(false);
    }
  }

  async function saveSecurity() {
    if (savingSecurity) return;
    setSavingSecurity(true);
    setSecurityStatus(null);

    try {
      const response = await adminFetch('/api/admin/security', {
        method: 'PUT',
        json: limits,
      });

      setSecurityStatus({
        kind: 'success',
        message: response.message || 'Security settings saved.',
      });
      await load();
    } catch (error) {
      setSecurityStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'Unable to save settings.',
      });
    } finally {
      setSavingSecurity(false);
    }
  }

  async function revoke(body: { id?: string; others?: boolean }) {
    const key = body.id || 'others';
    setRevoking(key);
    setSecurityStatus(null);

    try {
      const response = await adminFetch('/api/admin/sessions', { method: 'DELETE', json: body });

      // The current session was revoked: its cookie is already cleared server-side.
      if (body.id && body.id === data?.currentSessionId) {
        router.replace('/admin/login?reason=session');
        router.refresh();
        return;
      }

      setSecurityStatus({
        kind: 'success',
        message: response.message || 'Session revoked.',
      });
      await load();
    } catch (error) {
      setSecurityStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'Unable to revoke session.',
      });
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
          data.passwordUpdatedAt
            ? `Last updated ${formatDate(data.passwordUpdatedAt)}.`
            : 'The password is stored in the database as a salted hash.'
        }
      >
        <div className="space-y-4">
          <Field label="Current PIN" hint="Confirm your existing PIN to authorise the change.">
            <PinInput
              value={currentPin}
              onChange={editPin(setCurrentPin, 'currentPin')}
              autoComplete="current-password"
              label="Current PIN"
            />
            <FieldError message={pinFieldErrors.currentPin} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="New PIN"
              hint="At least 10 characters, with an uppercase letter, a lowercase letter and a number."
            >
              <PinInput
                value={newPin}
                onChange={editPin(setNewPin, 'newPin')}
                autoComplete="new-password"
                label="New PIN"
              />
              <FieldError message={pinFieldErrors.newPin} />
            </Field>

            <Field label="Confirm New PIN" hint="Must match the new PIN.">
              <PinInput
                value={confirmPin}
                onChange={editPin(setConfirmPin, 'confirmPin')}
                autoComplete="new-password"
                label="Confirm New PIN"
              />
              <FieldError message={pinFieldErrors.confirmPin} />
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
            {data.passwordUpdatedAt && (
              <span className="text-xs text-stone-500">
                The PIN is stored securely as a salted hash — it is never sent to the browser.
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
                min={5}
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