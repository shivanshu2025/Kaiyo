import { socialBannersData } from '@/components/solutions/data/socialBanners';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'social-media-banners';

export default function SocialMediaBanners() {
  const sections = socialBannersData.sections;

  return (
    <>
      <HeroSection {...socialBannersData.hero} />
      <TopSection {...socialBannersData.topSection} />
      <BannerStrip {...socialBannersData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...socialBannersData.footer} />
    </>
  );
}
