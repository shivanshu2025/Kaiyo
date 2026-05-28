import { webAppsData } from '@/components/solutions/data/webApps';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function NextGenWebAppsPage() {
  return (
    <>
      <HeroSection {...webAppsData.hero} />
      <TopSection {...webAppsData.topSection} />
      <BannerStrip {...webAppsData.banner} />
      <CardSections sections={webAppsData.sections} />
      <FooterSection {...webAppsData.footer} />
    </>
  );
}