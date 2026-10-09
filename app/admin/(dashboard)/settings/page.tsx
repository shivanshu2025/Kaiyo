'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCmsAdmin } from '@/components/admin/useCmsAdmin';
import { Button, Card, ErrorBlock, Field, LoadingBlock, SaveBar, inputClass } from '@/components/admin/ui';
import type { CmsData, SiteSettings } from '@/lib/cms-types';

/**
 * Changing the global WhatsApp / phone numbers also refreshes the places that
 * already store a copy of them (partner CTA link, calculator CTA link, contact
 * page numbers) so one edit is reflected everywhere it is used.
 */
function applyGlobalNumbers(data: CmsData, previous: SiteSettings): Partial<CmsData> {
  const patch: Partial<CmsData> = { siteSettings: data.siteSettings };
  const whatsappChanged = previous.whatsappNumber !== data.siteSettings.whatsappNumber;
  const phoneChanged = previous.phoneNumber !== data.siteSettings.phoneNumber;

  if (whatsappChanged) {
    const rebuild = (link: string) => {
      const match = /^https:\/\/wa\.me\/([^?]+)\?(.*)$/.exec(link || '');
      if (!match) return link;
      return `https://wa.me/${data.siteSettings.whatsappNumber}?${match[2]}`;
    };

    patch.howItWorks = {
      ...data.howItWorks,
      ctaWhatsApp: rebuild(data.howItWorks?.ctaWhatsApp ?? ''),
    };
    patch.calculator = {
      ...data.calculator,
      ctaCard: {
        ...data.calculator?.ctaCard,
        whatsappLink: rebuild(data.calculator?.ctaCard?.whatsappLink ?? ''),
      },
    };
  }

  if (phoneChanged) {
    patch.contact = {
      ...data.contact,
      phone: data.siteSettings.phoneNumber,
      whatsapp: data.siteSettings.whatsappNumber,
    };
  }

  return patch;
}

export default function AdminSiteSettingsPage() {
  const { data, loading, loadError, saving, save, reload } = useCmsAdmin();
  const [draft, setDraft] = useState<CmsData | null>(null);

  useEffect(() => {
    setDraft(data);
  }, [data]);

  const dirty = useMemo(
    () => Boolean(draft && data && JSON.stringify(draft) !== JSON.stringify(data)),
    [draft, data]
  );

  if (loading) return <LoadingBlock />;
  if (loadError || !data || !draft) {
    return <ErrorBlock message={loadError || 'Content unavailable'} onRetry={reload} />;
  }

  const settings = draft.siteSettings;

  const setField = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft({ ...draft, siteSettings: { ...settings, [key]: value } });
  };

  const updateSocial = (index: number, patch: Partial<{ label: string; url: string }>) => {
    const socialLinks = settings.socialLinks.map((link, i) =>
      i === index ? { ...link, ...patch } : link
    );
    setField('socialLinks', socialLinks);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Site Settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Global values used across the public website.
        </p>
      </div>

      <Card title="Logo">
        <div className="space-y-4">
          <Field
            label="Logo path"
            hint="Use a file from /public/images, e.g. /images/Kaiyologo.png"
          >
            <input
              value={settings.logo}
              onChange={(event) => setField('logo', event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.logo}
              alt="Current logo"
              className="h-16 w-16 rounded-lg border border-stone-200 bg-white object-contain p-1"
            />
            <p className="text-xs text-stone-500">Preview of the saved logo.</p>
          </div>
        </div>
      </Card>

      <Card
        title="Contact numbers"
        description="Updating these also refreshes the copy stored on the How It Works, Calculator and Contact pages."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" hint="Digits only, with country code (e.g. 919760926681).">
            <input
              value={settings.whatsappNumber}
              onChange={(event) => setField('whatsappNumber', event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Phone number" hint="Displayed on the contact page.">
            <input
              value={settings.phoneNumber}
              onChange={(event) => setField('phoneNumber', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      <Card
        title="Social links"
        description="Shown in the footer. LinkedIn, GitHub and Instagram use their matching icons."
        actions={
          <Button
            onClick={() =>
              setField('socialLinks', [...settings.socialLinks, { label: '', url: '' }])
            }
          >
            + Add link
          </Button>
        }
      >
        {settings.socialLinks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-4 text-xs text-stone-500">
            No social links yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {settings.socialLinks.map((link, index) => (
              <li key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[180px_1fr_auto]">
                <input
                  value={link.label}
                  placeholder="Label"
                  onChange={(event) => updateSocial(index, { label: event.target.value })}
                  className={inputClass}
                />
                <input
                  value={link.url}
                  placeholder="https://"
                  onChange={(event) => updateSocial(index, { url: event.target.value })}
                  className={inputClass}
                />
                <Button
                  variant="danger"
                  onClick={() =>
                    setField(
                      'socialLinks',
                      settings.socialLinks.filter((_, i) => i !== index)
                    )
                  }
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={() => save(applyGlobalNumbers(draft, data.siteSettings))}
      />
    </div>
  );
}