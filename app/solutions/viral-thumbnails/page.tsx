import { viralThumbnailsData } from '@/components/solutions/data/viralThumbnails';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function ViralThumbnailsPage() {
  return (
    <>
      <HeroSection {...viralThumbnailsData.hero} />
      <TopSection {...viralThumbnailsData.topSection} />
      <BannerStrip {...viralThumbnailsData.banner} />
      <CardSections sections={viralThumbnailsData.sections} />
      <FooterSection {...viralThumbnailsData.footer} />
    </>
  );
}