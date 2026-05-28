'use client';

import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";

interface LoginSectionProps {
  onSignIn: (username: string, password: string) => boolean;
}

export function LoginSection({ onSignIn }: LoginSectionProps) {
  const [username, setUsername] = useState("@adminKaiyo");
  const [password, setPassword] = useState("12345678");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const success = onSignIn(username, password);
    setIsSubmitting(false);

    if (!success) {
      setErrorMessage("Invalid username or password. Please try again.");
    }
  };

  const mediaUrl =
    "https://images.castingcall.club/role_images/michelangelo-67611.gif";

  const isVideo = /\.(mp4|webm|ogg)$/i.test(mediaUrl);

  return (
    <section className="fixed inset-0 z-10 flex h-dvh w-screen flex-col items-center justify-center overflow-hidden bg-[#010409] px-4 text-[#f0f6fc] sm:px-6">
      <div className="flex flex-1 flex-col items-center justify-center w-full pb-16 [@media(max-height:700px)]:pb-12">
        <div className="flex w-full max-w-[308px] flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full"
          >

            <div className="flex w-full items-center justify-center mb-6">
              {isVideo ? (
                <video
                  src={mediaUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-20 w-20 rounded-full object-cover shadow-lg"
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Anime"
                  className="h-20 w-20 rounded-full object-cover shadow-lg"
                />
              )}
            </div>

            <h2 className="mb-5 text-center text-2xl font-light tracking-[-0.02em] text-[#f0f6fc]">
              Sign in to Kaiyō
            </h2>

            <form onSubmit={handleSubmit} className="rounded-md border border-[#30363d] bg-[#0d1117] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
              <label htmlFor="admin-login-username" className="block text-sm font-medium text-[#f0f6fc]">
                Username or email address
              </label>
              <input
                id="admin-login-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                className="mt-2 h-9 w-full rounded-md border border-[#30363d] bg-[#010409] px-3 text-sm text-[#f0f6fc] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition focus:border-[#1f6feb] focus:ring-2 focus:ring-[#1f6feb]/35"
              />

              <div className="mt-4 flex items-center justify-between gap-3">
                <label htmlFor="admin-login-password" className="block text-sm font-medium text-[#f0f6fc]">
                  Password
                </label>
                <a href="#forgot-password" className="text-xs font-medium text-[#58a6ff] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="admin-login-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 h-9 w-full rounded-md border border-[#30363d] bg-[#010409] px-3 text-sm text-[#f0f6fc] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none transition focus:border-[#1f6feb] focus:ring-2 focus:ring-[#1f6feb]/35"
              />

              {errorMessage ? (
                <p className="mt-3 rounded-md bg-[#8b0000] px-3 py-2 text-sm text-white" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 h-9 w-full rounded-md bg-[#238636] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(35,134,54,0.18)] transition hover:bg-[#2ea043] focus:outline-none focus:ring-2 focus:ring-[#238636]/50 focus:ring-offset-2 focus:ring-offset-[#0d1117] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
              >
                Sign In
              </button>
            </form>

            <div className="mt-4 rounded-md border border-[#30363d] bg-[#0d1117] p-4 text-center text-sm shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              {/* <a href="#passkey" className="font-medium text-[#58a6ff] hover:underline">
                Sign in with a passkey
              </a> */}
              <p className="mt-2 text-[#f0f6fc]">
                New to Kaiyō? {" "}
                <a href="#create-account" className="font-medium text-[#58a6ff] hover:underline">
                  Create an account
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-center text-xs text-[#8b949e] [@media(max-height:700px)]:bottom-4">
        <a href="#terms" className="hover:text-[#58a6ff] hover:underline">Terms</a>
        <a href="#privacy" className="hover:text-[#58a6ff] hover:underline">Privacy</a>
        <a href="#docs" className="hover:text-[#58a6ff] hover:underline">Docs</a>
        <a href="#support" className="hover:text-[#58a6ff] hover:underline">Contact GitHub Support</a>
        <a href="#cookies" className="hover:text-[#58a6ff] hover:underline">Manage cookies</a>
        <a href="#personal-info" className="hover:text-[#58a6ff] hover:underline">Do not share my personal information</a>
      </footer>
    </section>
  );
}
