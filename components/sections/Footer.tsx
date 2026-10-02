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

  const handleStartProject = () => {
    // Aapka WhatsApp number
    const whatsappNumber = '919760926681';

    // Email empty hai
    if (!email.trim()) {
      const whatsappUrl =
        `https://wa.me/${whatsappNumber}?text=` +
        encodeURIComponent(
          'Hello, I want to start a project.'
        );

      window.open(whatsappUrl, '_blank');
      return;
    }

    // Email ke saath WhatsApp message
    const whatsappMessage =
      `Hello, I want to start a project.\n\nMy email: ${email.trim()}`;

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=` +
      encodeURIComponent(whatsappMessage);

    window.open(whatsappUrl, '_blank');

    setStatus('success');
    setMessage('Opening WhatsApp...');
  };

  return (
    <footer className="bg-[#E9E9E7] px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-16 text-[#2d2d2d]">
      <div className="max-w-7xl mx-auto">
        <div>
          <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
            LET'S BUILD SOMETHING
          </h3>

          <div className="flex w-full max-w-full items-center overflow-hidden rounded-full border border-gray-400 sm:w-[420px] md:w-[500px] lg:w-[560px]">

            {/* GET IN TOUCH INPUT */}
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus('idle');
                setMessage('');
              }}
              placeholder="GET IN TOUCH"
              className="min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none truncate"
            />

            {/* START A PROJECT */}
            <button
              type="button"
              onClick={handleStartProject}
              className="shrink-0 rounded-full bg-[#2f4f3f] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#666660] sm:px-6 sm:py-3 sm:text-sm"
            >
              START A PROJECT
            </button>
          </div>

          {status === 'success' && (
            <p className="mt-2 text-xs font-semibold text-[#16A34A]">
              {message}
            </p>
          )}

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

          {socialLinks.map(({ icon: Icon, url, label }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-full border border-gray-400 transition hover:bg-[#2f4f3f] hover:text-white"
            >
              <Icon size={13} />
            </a>
          ))}

        </div>
      </div>
    </footer>
  );
}
