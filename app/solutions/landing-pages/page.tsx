import { landingPagesData } from '@/components/solutions/data/landingPages';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'landing-pages';

export default function LandingPages() {
  const sections = landingPagesData.sections;

  return (
    <>
      <HeroSection {...landingPagesData.hero} />
      <TopSection {...landingPagesData.topSection} />
      <BannerStrip {...landingPagesData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...landingPagesData.footer} />
    </>
  );
}
