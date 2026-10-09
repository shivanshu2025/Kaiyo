import { promises as fs } from 'fs';
import path from 'path';
import { defaultCmsData } from './cms-defaults';
import type { CmsData } from './cms-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'cms.json');

export function mergeCmsData(stored: Partial<CmsData>): CmsData {
  return {
    ...defaultCmsData,
    ...stored,
    siteSettings: { ...defaultCmsData.siteSettings, ...stored.siteSettings },
    home: { ...defaultCmsData.home, ...stored.home },
    pricing: { ...defaultCmsData.pricing, ...stored.pricing },
    howItWorks: { ...defaultCmsData.howItWorks, ...stored.howItWorks },
    calculator: { ...defaultCmsData.calculator, ...stored.calculator },
    testimonials: { ...defaultCmsData.testimonials, ...stored.testimonials },
    contact: { ...defaultCmsData.contact, ...stored.contact },
    media: { ...defaultCmsData.media, ...stored.media },
    updatedAt: stored.updatedAt || defaultCmsData.updatedAt,
  };
}

export async function readCmsData(): Promise<CmsData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return mergeCmsData(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.error('Failed to read cms data', error);
    }
    await writeCmsData(defaultCmsData);
    return defaultCmsData;
  }
}

export async function writeCmsData(data: CmsData): Promise<CmsData> {
  const nextData = { ...data, updatedAt: new Date().toISOString() };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(nextData, null, 2), 'utf8');
  return nextData;
}

export function mergeIncomingCmsData(current: CmsData, incoming: Partial<CmsData>): CmsData {
  return mergeCmsData({
    ...current,
    ...incoming,
    siteSettings: { ...current.siteSettings, ...incoming.siteSettings },
    home: { ...current.home, ...incoming.home },
    pricing: { ...current.pricing, ...incoming.pricing },
    howItWorks: { ...current.howItWorks, ...incoming.howItWorks },
    calculator: { ...current.calculator, ...incoming.calculator },
    testimonials: { ...current.testimonials, ...incoming.testimonials },
    contact: { ...current.contact, ...incoming.contact },
    media: { ...current.media, ...incoming.media },
  });
}

export async function updateCmsData(updater: (data: CmsData) => CmsData): Promise<CmsData> {
  const data = await readCmsData();
  return writeCmsData(updater(data));
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
