import { socialBannersData } from '@/components/solutions/data/socialBanners';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function SocialMediaBanners() {
  return (
    <>
      <HeroSection {...socialBannersData.hero} />
      <TopSection {...socialBannersData.topSection} />
      <BannerStrip {...socialBannersData.banner} />
      <CardSections sections={socialBannersData.sections} />
      <FooterSection {...socialBannersData.footer} />
    </>
  );
}