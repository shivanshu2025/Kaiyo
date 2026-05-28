import { landingPagesData } from '@/components/solutions/data/landingPages';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function LandingPages() {
  return (
    <>
      <HeroSection {...landingPagesData.hero} />
      <TopSection {...landingPagesData.topSection} />
      <BannerStrip {...landingPagesData.banner} />
      <CardSections sections={landingPagesData.sections} />
      <FooterSection {...landingPagesData.footer} />
    </>
  );
}