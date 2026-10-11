'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const FIELD_CLASS =
  'flex h-[52px] min-w-0 items-center gap-[11px] rounded-[15px] border border-transparent bg-[#eef2f4] px-[17px] text-[#7a8491] transition-[border-color,background-color,box-shadow] duration-[180ms] focus-within:border-[rgba(97,159,189,0.62)] focus-within:bg-[#f2f6f8] focus-within:shadow-[0_0_0_3px_rgba(104,175,207,0.13)] max-[600px]:h-[50px] max-[600px]:rounded-[14px] max-[600px]:px-[14px]';
const INPUT_CLASS =
  'h-full w-full min-w-0 border-0 bg-transparent p-0 text-[17px] tracking-[-0.1px] text-[#202832] outline-none placeholder:text-[#7b8490] placeholder:opacity-100 max-[600px]:text-base';
const CONTROL_FOCUS_CLASS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e89b2]';

function BrandMark() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] /90 shadow-[0_1px_2px_rgba(17,27,35,0.12)] max-[600px]:h-9 max-[600px]:w-9">
      <img
        src="/images/Kaiyologo.png"
        alt=""
        width={40}
        height={40}
        className="!h-8 !w-8 object-contain max-[600px]:!h-7 max-[600px]:!w-7"
      />
    </span>
  );
}

function EntryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <circle cx="16" cy="16" r="16" fill="#c4ccd4" />
      <circle cx="16" cy="12.4" r="5" fill="#ffffff" />
      <path d="M16 19.2c4.9 0 8.9 3.2 9.7 7.6A16 16 0 0 1 16 32a16 16 0 0 1-9.7-5.2c.8-4.4 4.8-7.6 9.7-7.6Z" fill="#ffffff" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0 text-[#7c8694]">
      <rect x="4.5" y="10" width="15" height="11" rx="2.3" fill="currentColor" stroke="none" />
      <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.15" fill="#eef2f4" />
      <path d="M12 16.5v1.6" stroke="#eef2f4" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
      <path d="M2.8 12s3.2-6 9.2-6 9.2 6 9.2 6-3.2 6-9.2 6-9.2-6-9.2-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
      <path d="m3 3 18 18M10.6 6.2c.5-.1.9-.2 1.4-.2 6 0 9.2 6 9.2 6a14 14 0 0 1-3.1 3.8M6.2 6.2C3.9 7.8 2.8 12 2.8 12s3.2 6 9.2 6c1.4 0 2.6-.3 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px] shrink-0 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
      <path d="M4.5 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[19px] w-[19px] animate-spin fill-none stroke-current stroke-[2.6] [stroke-linecap:round]">
      <circle cx="12" cy="12" r="9" opacity="0.28" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

export default function AdminLoginForm({ from, notice }: { from?: string; notice?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const destination = from && from.startsWith('/admin') ? from : '/admin';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
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
  }

  return (
    <main className="kaiyo-auth-bg relative isolate grid min-h-screen min-h-[100svh] place-items-center overflow-hidden bg-[#c6e8f5] px-6 pt-[98px] pb-10 max-[600px]:px-[18px] max-[600px]:pt-[92px] max-[600px]:pb-7">
      <div className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden kaiyo-orbit-breathe" aria-hidden="true">
        <svg className="block h-full w-full overflow-visible" viewBox="0 0 1600 1200" preserveAspectRatio="none">
          <ellipse className="fill-none stroke-white/70 [stroke-width:1.35px] [vector-effect:non-scaling-stroke]" cx="800" cy="1620" rx="1090" ry="1300" />
          <ellipse className="fill-none stroke-white/55 [stroke-width:1.05px] [vector-effect:non-scaling-stroke]" cx="800" cy="1530" rx="930" ry="1130" />
        </svg>
      </div>

      <a
        className="absolute z-[3] top-[clamp(24px,3.8vw,46px)] left-[clamp(24px,6.25vw,100px)] inline-flex items-center gap-[9px] text-[26px] font-bold leading-none tracking-[-1.1px] text-[#10151a] no-underline max-[600px]:top-[22px] max-[600px]:left-[22px] max-[600px]:gap-2 max-[600px]:text-[23px]"
        href="/"
        aria-label="Kaiyō home"
      >
        <BrandMark />
        <span>Kaiyō</span>
      </a>

      <section
className="kaiyo-panel-pattern kaiyo-panel-arrive relative z-[1] w-full max-w-[562px] rounded-[38px] border-0 bg-transparent px-12 pt-[50px] pb-[39px] backdrop-blur-[16px] max-[600px]:max-w-[440px] max-[600px]:rounded-[30px] max-[600px]:px-[25px] max-[600px]:pt-[34px] max-[600px]:pb-[27px] max-[360px]:px-[19px]"
aria-labelledby="kaiyo-auth-title"
      >
        <div className="mx-auto mb-[31px] grid h-20 w-20 place-items-center rounded-[27px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(241,247,250,0.8))] shadow-[0_8px_18px_rgba(82,126,146,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] kaiyo-badge-float max-[600px]:mb-[23px] max-[600px]:h-[68px] max-[600px]:w-[68px] max-[600px]:rounded-[23px] overflow-hidden">
          <EntryIcon />
        </div>

        <header className="mx-auto mb-[31px] max-w-[420px] text-center max-[600px]:mb-6">
          <h1
            className="m-0 text-[30px] font-[650] leading-[1.25] tracking-[-0.9px] text-[#0b1118] max-[600px]:text-[25px] max-[600px]:tracking-[-0.7px] max-[360px]:text-[23px]"
            id="kaiyo-auth-title"
          >
            Sign in to Kaiyō
          </h1>
          <p className="mx-auto mt-[10px] text-[20px] font-normal leading-[1.48] tracking-[-0.25px] text-[#7d8490] max-[600px]:mt-2 max-[600px]:max-w-[330px] max-[600px]:text-base max-[600px]:leading-[1.45]">
            Use your admin credentials to manage the website content.
          </p>
        </header>

        <form className="grid" onSubmit={handleSubmit}>
          {notice && (
            <p
              className="mb-3 rounded-[13px] border border-[#cfe3ea] bg-[#f2f9fc] px-4 py-3 text-[14px] leading-[1.4] text-[#2f6c8a]"
              role="status"
            >
              {notice}
            </p>
          )}

          <div className={FIELD_CLASS}>
            <LockIcon />
            <input
              className={INPUT_CLASS}
              type={passwordVisible ? 'text' : 'password'}
              name="password"
              placeholder="PIN"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              aria-label="Password"
            />
            <button
              type="button"
              className={`grid h-[34px] w-[30px] shrink-0 place-items-center border-0 bg-transparent p-0 text-[#77818d] ${CONTROL_FOCUS_CLASS}`}
              onClick={() => setPasswordVisible((visible) => !visible)}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible}
            >
              <EyeIcon visible={passwordVisible} />
            </button>
            <button
              className={`grid h-[34px] w-[30px] shrink-0 place-items-center border-0 bg-transparent p-0 text-[#77818d] disabled:cursor-not-allowed disabled:opacity-60 ${CONTROL_FOCUS_CLASS}`}
              type="submit"
              disabled={submitting}
              aria-label="Sign in"
            >
              {submitting ? <Spinner /> : <ArrowIcon />}
            </button>
          </div>

          {error && (
            <p
              className="mt-[14px] mb-0 flex items-start gap-2 rounded-[13px] border border-[#f0c9c9] bg-[#fdf0f0] px-4 py-3 text-[14px] leading-[1.4] text-[#a32020] max-[600px]:text-[13px]"
              role="alert"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px h-[17px] w-[17px] shrink-0 fill-none stroke-current stroke-[2.2] [stroke-linecap:round]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.2M12 16.3v.2" />
              </svg>
              <span>{error}</span>
            </p>
          )}
        </form>

        <div className="my-[23px] flex items-center gap-[13px] whitespace-nowrap text-[15px] text-[#7c8490] max-[600px]:my-5 max-[600px]:gap-[10px] max-[600px]:text-[13px] max-[360px]:gap-2 max-[360px]:text-xs">
          <span aria-hidden="true" className="h-px flex-1 bg-[radial-gradient(circle,rgba(132,148,161,0.43)_1px,transparent_1.2px)] bg-[length:10px_1px] bg-center" />
          <span>Kaiyō Studio · Admin access</span>
          <span aria-hidden="true" className="h-px flex-1 bg-[radial-gradient(circle,rgba(132,148,161,0.43)_1px,transparent_1.2px)] bg-[length:10px_1px] bg-center" />
        </div>

        <p className="mt-0 mb-0 text-center text-[14px] text-[#78818d] max-[600px]:text-[13px]">
          This area is restricted to site administrators.
        </p>
      </section>
    </main>
  );
}