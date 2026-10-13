import type { Metadata } from 'next';
import { socialBannersData } from '@/components/solutions/data/socialBanners';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: 'Social Media Banners | Kaiyō',
    description:
      'Scroll-stopping social media banners and post designs built to lift engagement across your channels.',
    alternates: { canonical: '/solutions/social-media-banners' },
  };
}

export default function SocialMediaBanners() {
  return <SolutionPage slug="social-media-banners" fallback={socialBannersData} />;
}