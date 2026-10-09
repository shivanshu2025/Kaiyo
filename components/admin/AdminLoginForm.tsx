'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const destination = from && from.startsWith('/admin') ? from : '/admin';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setError(payload?.error || 'Invalid admin credentials');
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError('Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9E9E7] px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400">Kaiyō</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Admin Login</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to manage the website content.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-700">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#32483e]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#32483e]"
            />
          </label>

          {error && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626]">
              <AlertCircle size={14} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#32483e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a3d34] disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}