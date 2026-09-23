import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Collection from "@/components/sections/Collection";
import Banner from "@/components/sections/Banner";
import FutureEquitySection from "@/components/sections/FutureEquitySection";
import ProjectShowcase from "./ProjectShowcase/ProjectShowcase";
import ProcessAndTypography from "./ProcessAndTypography/ProcessAndTypography";

export default function Home() {
  return (
    <main className="bg-stone-50">
      <Hero />
      <Marquee />
      <Collection />
      <FutureEquitySection />
      <ProjectShowcase/>
      <ProcessAndTypography/>
      <Banner />
    </main>
  );
}
