import { readCmsData } from '@/lib/cms-store';
import HeroSection from './HeroSection';
import TopSection from './TopSection';
import BannerStrip from './BannerStrip';
import CardSections from './CardSections';
import FooterSection from './FooterSection';

type SolutionData = {
  hero?: any;
  topSection?: any;
  banner?: any;
  sections?: Array<{ title: string; cards: Array<{ src: string }> }>;
  footer?: any;
};

/**
 * Renders an existing solution page from the CMS document.
 * The hardcoded `fallback` is the original static data file, so the page keeps
 * working (unchanged) even if a solution has not been edited by an admin yet.
 */
export default async function SolutionPage({
  slug,
  fallback,
  cardBgColor,
}: {
  slug: string;
  fallback: SolutionData;
  cardBgColor?: string;
}) {
  const cms = await readCmsData();
  const stored = cms.solutions.find((solution) => solution.slug === slug);
  const storedData = stored?.data as SolutionData | undefined;

  const data: SolutionData =
    storedData && typeof storedData === 'object' && Object.keys(storedData).length > 0
      ? {
          ...fallback,
          ...storedData,
          sections:
            Array.isArray(storedData.sections) && storedData.sections.length > 0
              ? storedData.sections
              : fallback.sections,
        }
      : fallback;

  return (
    <>
      <HeroSection {...data.hero} />
      <TopSection {...data.topSection} />
      <BannerStrip {...data.banner} />
      <CardSections sections={data.sections ?? []} {...(cardBgColor ? { bgColor: cardBgColor } : {})} />
      <FooterSection {...data.footer} />
    </>
  );
}