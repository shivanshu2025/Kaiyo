import { viralThumbnailsData } from '@/components/solutions/data/viralThumbnails';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'viral-thumbnails';

export default function ViralThumbnailsPage() {
  const sections = viralThumbnailsData.sections;

  return (
    <>
      <HeroSection {...viralThumbnailsData.hero} />
      <TopSection {...viralThumbnailsData.topSection} />
      <BannerStrip {...viralThumbnailsData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...viralThumbnailsData.footer} />
    </>
  );
}
