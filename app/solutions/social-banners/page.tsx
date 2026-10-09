import { socialBannersData } from '@/components/solutions/data/socialBanners';
import SolutionPage from '@/components/solutions/SolutionPage';

export const dynamic = 'force-dynamic';

export default function SocialMediaBanners() {
  return <SolutionPage slug="social-media-banners" fallback={socialBannersData} />;
}