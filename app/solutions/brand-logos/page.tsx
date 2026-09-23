import { brandLogosData } from '@/components/solutions/data/brandLogos';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'brand-logos';

export default function BrandLogosPage() {
  const sections = brandLogosData.sections;

  return (
    <>
      <HeroSection {...brandLogosData.hero} />
      <TopSection {...brandLogosData.topSection} />
      <BannerStrip {...brandLogosData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...brandLogosData.footer} />
    </>
  );
}
