'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import './SupportWidget.css';

const FULL_TEXT = '__Codeno.in\nHi! I’m building something of my own. Support my journey with a coffee ☕';
const TYPING_SPEED = 40;

export default function SupportWidget() {
  const [isHovered, setIsHovered] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (!isHovered) {
      setTypedText('');
      setIsTyping(false);
      return;
    }

    setTypedText('');
    setIsTyping(true);
    let index = 0;

    typingTimerRef.current = setInterval(() => {
      index++;
      setTypedText(FULL_TEXT.slice(0, index));
      if (index >= FULL_TEXT.length) {
        clearInterval(typingTimerRef.current!);
        typingTimerRef.current = null;
        setIsTyping(false);
      }
    }, TYPING_SPEED);

    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
  }, [isHovered]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQrOpen) {
        setIsQrOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQrOpen]);

  useEffect(() => {
    if (isQrOpen && closeBtnRef.current) {
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isQrOpen]);

  const handleOpenQr = useCallback(() => {
    setIsQrOpen(true);
  }, []);

  const handleCloseQr = useCallback(() => {
    setIsQrOpen(false);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setIsQrOpen(false);
  }, []);

  const isReduced = prefersReducedMotion;

  return (
    <>
      <motion.div
        className="support-widget"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        role="complementary"
        aria-label="Support widget"
      >
        <div className="support-widget__container">

          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="support-widget__bubble"
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 8 }}
                transition={{ duration: isReduced ? 0 : 0.2, ease: 'easeOut' }}
              >
                <p className="support-widget__text">
                  {typedText}
                  {isTyping && <span className="support-widget__cursor">|</span>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="support-widget__avatar-wrap">
            <button
              ref={avatarBtnRef}
              className="support-widget__avatar-btn"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleOpenQr}
              aria-label="Support my work"
              aria-expanded={isQrOpen}
              aria-haspopup="dialog"
            >
              <motion.div
                className="support-widget__avatar-ring"
                animate={isHovered && !isReduced ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: isReduced ? 0 : 0.15 }}
              >
                <Image
                  src="/images/coffee.webp"
                  alt="Avatar - support contributor"
                  width={75}
                  height={75}
                  className="support-widget__avatar"
                />
              </motion.div>
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isQrOpen && (
          <motion.div
            className="support-widget__qr-overlay"
            onClick={handleOverlayClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isReduced ? 0 : 0.2 }}
          >
            <motion.div
              className="support-widget__qr-card"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Support my work"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: isReduced ? 0 : 0.2, ease: 'easeOut' }}
            >
              <button
                ref={closeBtnRef}
                className="support-widget__qr-close"
                onClick={handleCloseQr}
                aria-label="Close support dialog"
              >
                <X size={20} />
              </button>
              <h3 className="support-widget__qr-heading">Support my work ☕</h3>
              <p className="support-widget__qr-subtext">Scan the QR code to support.</p>
              <div className="support-widget__qr-image">
                <Image
                  src="/images/support-qr.png"
                  alt="QR code to support my work"
                  width={200}
                  height={200}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
