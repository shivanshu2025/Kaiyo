'use client';

import { useEffect, useState } from 'react';
import type { CmsData, SiteSettings } from './cms-types';

export const fallbackSiteSettings: SiteSettings = {
  logo: '/images/Kaiyologo.png',
  whatsappNumber: '919760926681',
  phoneNumber: '9760926681',
  socialLinks: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jatin-singh-1033aa3b7/' },
    { label: 'GitHub', url: 'https://github.com/shivanshu2025' },
    { label: 'Instagram', url: 'https://www.instagram.com/__codeno.in/' },
  ],
};

export function useCmsData<T>(selector: (data: CmsData) => T, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/cms', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (alive && payload?.success && payload.data) {
          setValue(selector(payload.data));
        }
      })
      .catch(() => {
        if (alive) setValue(fallback);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { value, loading };
}

/**
 * Global settings (logo / whatsapp / phone / social links) for client
 * components. Falls back to the current hardcoded values so the public
 * website renders exactly as before until an admin saves new ones.
 */
export function useSiteSettings() {
  return useCmsData((data) => data.siteSettings, fallbackSiteSettings);
}