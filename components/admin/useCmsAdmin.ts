'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminFetch, ApiError } from '@/lib/admin-client';
import type { CmsData } from '@/lib/cms-types';

type SaveResult = { ok: true; data: CmsData } | { ok: false; error: string };

/**
 * Loads the CMS document for admin editing and persists changes through
 * `PUT /api/cms`.
 *
 * The endpoint requires an `admin`-role session and a CSRF header; `adminFetch`
 * supplies the token from the CSRF cookie and redirects to the login page if the
 * session has expired, so a signed-out admin sees the login screen rather than an
 * unexplained "failed to save".
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
      // `x-kaiyo-admin` asks for the dashboard view (submissions + unpublished
      // testimonials). The server still verifies the session and the role before
      // returning it.
      const response = await adminFetch<CmsData>('/api/cms', {
        headers: { 'x-kaiyo-admin': '1' },
      });
      setData(response.data);
    } catch (error) {
      setData(null);
      setLoadError(
        error instanceof ApiError ? error.message : 'Failed to load content',
      );
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
      const response = await adminFetch<CmsData>('/api/cms', {
        method: 'PUT',
        json: patch,
      });

      setData(response.data);
      toast.success(response.message || 'Changes saved');
      return { ok: true, data: response.data };
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to save changes';
      toast.error(message);
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, setData, loading, loadError, saving, save, reload: load };
}