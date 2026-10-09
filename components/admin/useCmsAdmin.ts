'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { CmsData } from '@/lib/cms-types';

type SaveResult = { ok: true; data: CmsData } | { ok: false; error: string };

/**
 * Loads the CMS document for admin editing and persists changes through the
 * existing `PUT /api/cms` endpoint (cookie-authenticated admin token).
 */
export function useCmsAdmin() {
  const [data, setData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/cms', { cache: 'no-store' });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || !payload.data) {
        setLoadError(payload?.error || 'Failed to load content');
        setData(null);
        return;
      }

      setData(payload.data as CmsData);
    } catch {
      setLoadError('Failed to load content');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (patch: Partial<CmsData>): Promise<SaveResult> => {
    setSaving(true);
    try {
      const response = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success || !payload.data) {
        const message = payload?.error || 'Failed to save changes';
        toast.error(message);
        return { ok: false, error: message };
      }

      setData(payload.data as CmsData);
      toast.success('Changes saved');
      return { ok: true, data: payload.data as CmsData };
    } catch {
      toast.error('Failed to save changes');
      return { ok: false, error: 'Failed to save changes' };
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, setData, loading, loadError, saving, save, reload: load };
}