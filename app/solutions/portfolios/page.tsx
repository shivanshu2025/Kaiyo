import { portfoliosData } from '@/components/solutions/data/portfolios';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'personal-portfolios';

export default function PersonalPortfolios() {
  const sections = portfoliosData.sections;

  return (
    <>
      <HeroSection {...portfoliosData.hero} />
      <TopSection {...portfoliosData.topSection} />
      <BannerStrip {...portfoliosData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...portfoliosData.footer} />
    </>
  );
}
