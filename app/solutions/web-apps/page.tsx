import { webAppsData } from '@/components/solutions/data/webApps';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

const SUB_SLUG = 'next-gen-web-apps';

export default function NextGenWebAppsPage() {
  const sections = webAppsData.sections;

  return (
    <>
      <HeroSection {...webAppsData.hero} />
      <TopSection {...webAppsData.topSection} />
      <BannerStrip {...webAppsData.banner} />
      <CardSections sections={sections} />
      <FooterSection {...webAppsData.footer} />
    </>
  );
}
