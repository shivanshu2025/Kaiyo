'use client';

import type { HomeProcess, HomeProcessStep } from '@/lib/cms-types';

const DEFAULT_HEADING = 'Project process and typography';
const DEFAULT_DESCRIPTION = 'MODERN WEB DESIGN / DIGITAL PRESENCE';
const DEFAULT_STEPS: HomeProcessStep[] = [
  {
    number: "01",
    title: "UNDERSTAND",
    description:
      "We understand your business idea and what you need from your website.",
  },
  {
    number: "02",
    title: "DESIGN",
    description:
      "We create a clean and modern website design based on your requirements.",
  },
  {
    number: "03",
    title: "BUILD",
    description:
      "We turn the design into a functional website that is easy to use.",
  },
  {
    number: "04",
    title: "DELIVER",
    description:
      "We make sure your website is ready to use on desktop and mobile devices.",
  },
];

// Grid placement / card-corner layout used by the desktop composition.
// Kept in the exact order the existing four cards use so the layout is unchanged.
const DESKTOP_PLACEMENTS = [
  "max-[767px]:col-start-1 max-[767px]:row-start-1 md:col-start-2 md:row-start-1",
  "max-[767px]:col-start-2 max-[767px]:row-start-1 md:col-start-3 md:row-start-1",
  "max-[767px]:col-start-1 max-[767px]:row-start-2 md:col-start-1 md:row-start-2",
  "max-[767px]:col-start-2 max-[767px]:row-start-2 md:col-start-2 md:row-start-2",
];
const DESKTOP_TOPS = [false, true, true, false];

export default function ProcessAndTypography({
  dynamicContent,
}: {
  dynamicContent?: HomeProcess;
}) {
  const heading = dynamicContent?.heading?.trim() || DEFAULT_HEADING;
  const description = dynamicContent?.description || DEFAULT_DESCRIPTION;
  const processSteps =
    dynamicContent?.steps && dynamicContent.steps.length > 0
      ? dynamicContent.steps
      : DEFAULT_STEPS;

  return (
    <section
      className="group relative overflow-hidden bg-[#f7f6f5] text-[#111111] h-auto min-h-0 px-[7%] py-8 pb-8 sm:px-[6%] sm:py-8 sm:pb-8 lg:min-h-[900px] lg:px-0 lg:py-0"
      aria-labelledby="process-title"
    >
      <style jsx>{`
        @keyframes processCardIn {
          0% {
            opacity: 0;
            transform: translateY(25px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .process-card {
          opacity: 0;
          animation: processCardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .process-card:nth-child(1) {
          animation-delay: 80ms;
        }

        .process-card:nth-child(2) {
          animation-delay: 160ms;
        }

        .process-card:nth-child(3) {
          animation-delay: 240ms;
        }

        .process-card:nth-child(4) {
          animation-delay: 320ms;
        }

        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 55s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .process-card {
            opacity: 1;
            animation: none;
          }
          .animate-marquee {
            animation: none;
            transform: none;
          }
        }
      `}</style>

      <h2 id="process-title" className="sr-only">
        {heading}
      </h2>

      {/* MOBILE + TABLET flow (< lg) */}
      <div className="relative z-[5] flex flex-col gap-6 lg:hidden">
        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
          {processSteps.map((step, stepIndex) => {
            const top = DESKTOP_TOPS[stepIndex] ?? DESKTOP_TOPS[DESKTOP_TOPS.length - 1];
            return (
            <article
              key={step.number + stepIndex}
              className="process-card relative flex aspect-square flex-col justify-between overflow-hidden rounded-[12px] border border-solid border-[rgba(17,17,17,0.2)] bg-[rgba(255,255,255,0.4)] p-[10%] backdrop-blur-[2px] transition-all duration-500 ease-out hover:-translate-y-[6px] hover:scale-[1.012] hover:border-[rgba(17,17,17,0.5)] hover:bg-[#ffffff] hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)] sm:rounded-[13px]"
            >
              {top ? (
                <>
                  <span className="absolute bottom-[10%] right-[10%] font-mono text-[10px] font-bold leading-none text-[rgba(17,17,17,0.4)] sm:text-[11px]">
                    {step.number}
                  </span>
                  <div className="absolute left-[10%] right-[10%] top-[10%]">
                    <h3 className="m-0 mb-[8px] font-display font-black uppercase text-[13px] leading-[0.95] tracking-[-0.03em] text-[#111111] sm:mb-[10px] sm:text-[14px]">
                      {step.title}
                    </h3>
                    <p className="m-0 font-mono text-[9px] font-bold uppercase leading-[1.4] text-[rgba(17,17,17,0.55)] sm:text-[10px]">
                      {step.description}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="absolute right-[10%] top-[10%] font-mono text-[10px] font-bold leading-none text-[rgba(17,17,17,0.4)] sm:text-[11px]">
                    {step.number}
                  </span>
                  <div className="absolute bottom-[10%] left-[10%] right-[10%]">
                    <h3 className="m-0 mb-[8px] font-display font-black uppercase text-[13px] leading-[0.95] tracking-[-0.03em] text-[#111111] sm:mb-[10px] sm:text-[14px]">
                      {step.title}
                    </h3>
                    <p className="m-0 font-mono text-[9px] font-bold uppercase leading-[1.4] text-[rgba(17,17,17,0.55)] sm:text-[10px]">
                      {step.description}
                    </p>
                  </div>
                </>
              )}
            </article>
            );
          })}
        </div>

        {/* Marquee - natural flow, not absolute */}
        <div className="pointer-events-none -mx-[7%] overflow-hidden py-2 sm:-mx-[6%] sm:py-4" aria-hidden="true">
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(5rem,22vw,10rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              YOUR BRAND  •  YOUR WEBSITE  •
            </span>
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(5rem,22vw,10rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              YOUR BRAND  •  YOUR WEBSITE  •
            </span>
          </div>
        </div>

<div className="text-right font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)] sm:text-[9px] sm:tracking-[0.1em]">
           {description}
         </div>
      </div>

      {/* DESKTOP (lg+) - preserve original absolute composition */}
      <div className="hidden lg:contents">
        {/* PROCESS CARDS */}
        <div className="absolute left-[10.4%] top-[3%] z-[5] hidden w-[78%] grid-cols-3 gap-[22px] lg:grid lg:gap-[28px]">
          {processSteps.map((step, stepIndex) => {
            const top = DESKTOP_TOPS[stepIndex] ?? DESKTOP_TOPS[DESKTOP_TOPS.length - 1];
            const placement =
              DESKTOP_PLACEMENTS[stepIndex] ?? DESKTOP_PLACEMENTS[DESKTOP_PLACEMENTS.length - 1];
            return (
            <article
              key={step.number + "-desktop" + stepIndex}
              className={`process-card relative aspect-square overflow-hidden rounded-[14px] border border-solid border-[rgba(17,17,17,0.2)] bg-[rgba(255,255,255,0.4)] backdrop-blur-[2px] transition-all duration-500 ease-out hover:-translate-y-[6px] hover:scale-[1.012] hover:border-[rgba(17,17,17,0.5)] hover:bg-[#ffffff] hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)] ${placement}`}
            >
              <span
                className={`absolute right-[10%] font-mono text-[12px] font-bold leading-none text-[rgba(17,17,17,0.4)] transition-all duration-300 ${
                  top ? "bottom-[10%]" : "top-[10%]"
                }`}
              >
                {step.number}
              </span>
              <div
                className={`absolute left-[10%] right-[10%] ${top ? "top-[10%]" : "bottom-[10%]"}`}
              >
                <h3 className="m-0 mb-[16px] font-display font-black uppercase text-[17px] leading-[0.95] tracking-[-0.03em] text-[#111111] transition-all duration-300 hover:translate-x-[3px] hover:tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="m-0 max-w-[94%] font-mono text-[11px] font-bold uppercase leading-[1.4] text-[rgba(17,17,17,0.55)] transition-colors duration-300 hover:text-[#111111]">
                  {step.description}
                </p>
              </div>
            </article>
          );
          })}
        </div>

        {/* LARGE BACKGROUND MOVING MARQUEE TEXT (CENTERED) */}
        <div
          className="absolute left-0 top-[50%] z-[1] hidden w-full -translate-y-1/2 overflow-hidden pointer-events-none lg:block"
          aria-hidden="true"
        >
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(10rem,35vw,26rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              YOUR BRAND  •  YOUR WEBSITE  •
            </span>
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(10rem,35vw,26rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              YOUR BRAND  •  YOUR WEBSITE  •
            </span>
          </div>
        </div>

        {/* TYPOGRAPHY META INFO */}
        <div className="absolute bottom-[6%] right-[11%] z-[3] hidden text-right font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[rgba(17,17,17,0.5)] transition-all duration-300 hover:translate-x-[4px] hover:tracking-[0.12em] hover:text-[#111111] lg:block">
          {description}
        </div>
      </div>
    </section>
  );
}
