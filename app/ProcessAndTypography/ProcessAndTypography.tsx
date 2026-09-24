'use client';

const processSteps = [
  {
    number: "/1",
    title: "Research & Analysis",
    description:
      "Analyzed client needs and explored industry references to define UX structure and visual direction.",
    placement:
      "max-[767px]:col-start-1 max-[767px]:row-start-1 md:col-start-2 md:row-start-1",
    top: false,
  },
  {
    number: "/2",
    title: "Wireframing",
    description:
      "Defined the website structure and created low-fidelity wireframes.",
    placement:
      "max-[767px]:col-start-2 max-[767px]:row-start-1 md:col-start-3 md:row-start-1",
    top: true,
  },
  {
    number: "/3",
    title: "UI Design",
    description:
      "Designed UI screens and applied appropriate animations to enhance key interactions.",
    placement:
      "max-[767px]:col-start-1 max-[767px]:row-start-2 md:col-start-1 md:row-start-2",
    top: true,
  },
  {
    number: "/4",
    title: "Responsive Design",
    description:
      "Adapted the desktop design for mobile, maintaining usability and visual consistency.",
    placement:
      "max-[767px]:col-start-2 max-[767px]:row-start-2 md:col-start-2 md:row-start-2",
    top: false,
  },
];

export default function ProcessAndTypography() {
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
        Project process and typography
      </h2>

      {/* MOBILE + TABLET flow (< lg) */}
      <div className="relative z-[5] flex flex-col gap-6 lg:hidden">
        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
          {processSteps.map((step) => (
            <article
              key={step.number}
              className="process-card relative flex aspect-square flex-col justify-between overflow-hidden rounded-[12px] border border-solid border-[rgba(17,17,17,0.2)] bg-[rgba(255,255,255,0.4)] p-[10%] backdrop-blur-[2px] transition-all duration-500 ease-out hover:-translate-y-[6px] hover:scale-[1.012] hover:border-[rgba(17,17,17,0.5)] hover:bg-[#ffffff] hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)] sm:rounded-[13px]"
            >
              {step.top ? (
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
          ))}
        </div>

        {/* Marquee - natural flow, not absolute */}
        <div className="pointer-events-none -mx-[7%] overflow-hidden py-2 sm:-mx-[6%] sm:py-4" aria-hidden="true">
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(5rem,22vw,10rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
            </span>
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(5rem,22vw,10rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
            </span>
          </div>
        </div>

        <div className="text-right font-mono text-[8px] font-bold uppercase tracking-[0.08em] text-[rgba(17,17,17,0.5)] sm:text-[9px] sm:tracking-[0.1em]">
          System Font Stack / UI Mono
        </div>
      </div>

      {/* DESKTOP (lg+) - preserve original absolute composition */}
      <div className="hidden lg:contents">
        {/* PROCESS CARDS */}
        <div className="absolute left-[10.4%] top-[3%] z-[5] hidden w-[78%] grid-cols-3 gap-[22px] lg:grid lg:gap-[28px]">
          {processSteps.map((step) => (
            <article
              key={step.number + "-desktop"}
              className={`process-card relative aspect-square overflow-hidden rounded-[14px] border border-solid border-[rgba(17,17,17,0.2)] bg-[rgba(255,255,255,0.4)] backdrop-blur-[2px] transition-all duration-500 ease-out hover:-translate-y-[6px] hover:scale-[1.012] hover:border-[rgba(17,17,17,0.5)] hover:bg-[#ffffff] hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)] ${step.placement}`}
            >
              <span
                className={`absolute right-[10%] font-mono text-[12px] font-bold leading-none text-[rgba(17,17,17,0.4)] transition-all duration-300 ${
                  step.top ? "bottom-[10%]" : "top-[10%]"
                }`}
              >
                {step.number}
              </span>
              <div
                className={`absolute left-[10%] right-[10%] ${step.top ? "top-[10%]" : "bottom-[10%]"}`}
              >
                <h3 className="m-0 mb-[16px] font-display font-black uppercase text-[17px] leading-[0.95] tracking-[-0.03em] text-[#111111] transition-all duration-300 hover:translate-x-[3px] hover:tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="m-0 max-w-[94%] font-mono text-[11px] font-bold uppercase leading-[1.4] text-[rgba(17,17,17,0.55)] transition-colors duration-300 hover:text-[#111111]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* LARGE BACKGROUND MOVING MARQUEE TEXT (CENTERED) */}
        <div
          className="absolute left-0 top-[50%] z-[1] hidden w-full -translate-y-1/2 overflow-hidden pointer-events-none lg:block"
          aria-hidden="true"
        >
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(10rem,35vw,26rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
            </span>
            <span className="inline-block px-6 font-display font-black uppercase leading-[0.8] tracking-[0.05em] text-[#ecebea] text-[clamp(10rem,35vw,26rem)] transition-colors duration-1000 group-hover:text-[#e4e3e1]">
              shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
            </span>
          </div>
        </div>

        {/* TYPOGRAPHY META INFO */}
        <div className="absolute bottom-[6%] right-[11%] z-[3] hidden text-right font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[rgba(17,17,17,0.5)] transition-all duration-300 hover:translate-x-[4px] hover:tracking-[0.12em] hover:text-[#111111] lg:block">
          System Font Stack / UI Mono
        </div>
      </div>
    </section>
  );
}
