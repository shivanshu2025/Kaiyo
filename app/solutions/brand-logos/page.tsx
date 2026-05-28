import { brandLogosData } from '@/components/solutions/data/brandLogos';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function BrandLogosPage() {
  return (
    <>
      <HeroSection {...brandLogosData.hero} />
      <TopSection {...brandLogosData.topSection} />
      <BannerStrip {...brandLogosData.banner} />
      <CardSections sections={brandLogosData.sections} />
      <FooterSection {...brandLogosData.footer} />
    </>
  );
}