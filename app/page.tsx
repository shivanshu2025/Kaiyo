import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Collection from "@/components/sections/Collection";
import Banner from "@/components/sections/Banner";
import FutureEquitySection from "@/components/sections/FutureEquitySection";
import ProjectShowcase from "./ProjectShowcase/ProjectShowcase";
import ProcessAndTypography from "./ProcessAndTypography/ProcessAndTypography";
import { readCmsData } from "@/lib/cms-store";

// Content comes from the CMS document on disk, so the page must be rendered
// per request for admin edits to appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const cms = await readCmsData();
  const home = cms.home;

  return (
    <main className="bg-stone-50">
      <Hero dynamicContent={home.hero} />
      <Marquee />
      <Collection dynamicCollections={home.collection?.items} dynamicContent={home.collection} />
      <FutureEquitySection />
      <ProjectShowcase dynamicContent={home.projectShowcase} />
      <ProcessAndTypography dynamicContent={home.process} />
      <Banner dynamicContent={home.finalCta} />
 
    </main>
  );
}