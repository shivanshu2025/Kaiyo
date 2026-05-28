import { digitalInvitesData } from '@/components/solutions/data/digitalInvites';
import HeroSection from '@/components/solutions/HeroSection';
import TopSection from '@/components/solutions/TopSection';
import BannerStrip from '@/components/solutions/BannerStrip';
import CardSections from '@/components/solutions/CardSections';
import FooterSection from '@/components/solutions/FooterSection';

export default function DigitalInvitesPage() {
  return (
    <>
      <HeroSection {...digitalInvitesData.hero} />
      <TopSection {...digitalInvitesData.topSection} />
      <BannerStrip {...digitalInvitesData.banner} />
      <CardSections sections={digitalInvitesData.sections} bgColor="#F0F0F0" />
      <FooterSection {...digitalInvitesData.footer} />
    </>
  );
}