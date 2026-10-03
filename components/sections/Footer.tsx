'use client';

import { useState } from 'react';
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from 'react-icons/fa';

const socialLinks = [
  {
    icon: FaLinkedinIn,
    url: 'https://www.linkedin.com/in/jatin-singh-1033aa3b7/',
    label: 'LinkedIn',
  },
  {
    icon: FaGithub,
    url: 'https://github.com/shivanshu2025',
    label: 'GitHub',
  },
  {
    icon: FaInstagram,
    url: 'https://www.instagram.com/__codeno.in/',
    label: 'Instagram',
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const handleStartProject = () => {
    const whatsappNumber = '919760926681';
    const trimmedEmail = email.trim();

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!trimmedEmail) {
      const whatsappUrl =
        `https://wa.me/${whatsappNumber}?text=` +
        encodeURIComponent(
          'Hello, I want to start a project.'
        );

      window.open(whatsappUrl, '_blank');

      setEmail('');
      setStatus('idle');
      setMessage('');

      return;
    }

    if (!gmailRegex.test(trimmedEmail)) {
      setStatus('error');
      setMessage('Please enter a valid Gmail address.');
      return;
    }

    const whatsappMessage =
      `Hello, I want to start a project.\n\nMy email: ${trimmedEmail}`;

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=` +
      encodeURIComponent(whatsappMessage);

    window.open(whatsappUrl, '_blank');

    setEmail('');
    setStatus('idle');
    setMessage('');
  };

  return (
    <footer className="bg-[#E9E9E7] px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-16 text-[#2d2d2d]">
      <div className="max-w-7xl mx-auto">
        <div>
          <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
            LET'S BUILD SOMETHING
          </h3>

          <div className="flex w-full max-w-full items-center overflow-hidden rounded-full border border-gray-400 sm:w-[420px] md:w-[500px] lg:w-[560px]">

            <input
              type="email"
              value={email}
              onChange={(e) => {
                const value = e.target.value;

                const gmailCharactersOnly =
                  /^[a-zA-Z0-9._%+-@]*$/;

                if (!gmailCharactersOnly.test(value)) {
                  return;
                }

                if ((value.match(/@/g) || []).length > 1) {
                  return;
                }

                setEmail(value);
                setStatus('idle');
                setMessage('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartProject();
                }
              }}
              placeholder="GET IN TOUCH"
              autoComplete="email"
              className="min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none truncate"
            />

            <button
              type="button"
              onClick={handleStartProject}
              className="
                shrink-0
                rounded-full
                bg-[#2f4f3f]
                px-4 py-2.5
                text-xs font-semibold
                text-white
                transition-all duration-300 ease-in-out
                hover:bg-[#666660]
                hover:scale-[1.02]
                active:scale-[0.98]
                sm:px-6 sm:py-3 sm:text-sm
              "
            >
              START A PROJECT
            </button>
          </div>

          {status === 'error' && (
            <p className="mt-2 text-xs font-semibold text-[#DC2626]">
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="my-8 sm:my-10 border-t border-gray-300 max-w-7xl mx-auto" />

      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-5 sm:gap-6 md:flex-row">

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2f4f3f]">
          Kaiy{'\u014d'}
        </h2>

        <div className="flex gap-3 sm:gap-4">

          {socialLinks.map(({ icon: Icon, url, label }) => {
            const isHovered = hoveredIcon === label;

            return (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onMouseEnter={() => setHoveredIcon(label)}
                onMouseLeave={() => setHoveredIcon(null)}
                onClick={() => {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="
                  flex
                  h-9 w-9
                  sm:h-10 sm:w-10
                  shrink-0
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  border
                  outline-none
                  select-none
                  transition-all
                  duration-300
                  ease-in-out
                  active:scale-95
                  focus-visible:ring-2
                  focus-visible:ring-[#2f4f3f]
                  focus-visible:ring-offset-2
                "
                style={{
                  backgroundColor: isHovered
                    ? '#2f4f3f'
                    : 'transparent',

                  borderColor: isHovered
                    ? '#2f4f3f'
                    : '#9ca3af',

                  color: isHovered
                    ? '#ffffff'
                    : '#2d2d2d',

                  transform: isHovered
                    ? 'translateY(-4px) scale(1.08)'
                    : 'translateY(0) scale(1)',

                  transition:
                    'all 300ms ease-in-out',
                }}
              >
                <Icon
                  size={13}
                  style={{
                    pointerEvents: 'none',
                    transform: isHovered
                      ? 'scale(1.15)'
                      : 'scale(1)',
                    transition:
                      'transform 300ms ease-in-out',
                  }}
                />
              </button>
            );
          })}

        </div>
      </div>
    </footer>
  );
}
