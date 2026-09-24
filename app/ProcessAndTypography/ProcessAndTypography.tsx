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
      className="
        group
        relative
        min-h-[860px]
        overflow-hidden
        bg-[#f7f6f5]
        text-[#111111]
        sm:min-h-[880px]
        md:min-h-[900px]
      "
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
          /* Slower duration (55s instead of 25s) for a smoother, unhurried background flow */
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

      {/* PROCESS CARDS */}
      <div
        className="
          absolute
          top-[3%]
          left-[7%]
          z-[5]
          grid
          w-[86%]
          grid-cols-2
          gap-3
          sm:left-[7%]
          sm:w-[86%]
          sm:gap-4
          md:left-[10.4%]
          md:w-[78%]
          md:grid-cols-3
          md:gap-[22px]
          lg:gap-[28px]
        "
      >
        {processSteps.map((step) => (
          <article
            key={step.number}
            className={`
              process-card
              relative
              aspect-square
              overflow-hidden
              rounded-[12px]
              border
              border-solid
              border-[rgba(17,17,17,0.2)]
              bg-[rgba(255,255,255,0.4)]
              backdrop-blur-[2px]
              transition-all
              duration-500
              ease-out
              hover:-translate-y-[6px]
              hover:scale-[1.012]
              hover:border-[rgba(17,17,17,0.5)]
              hover:bg-[#ffffff]
              hover:shadow-[0_20px_45px_rgba(17,17,17,0.08)]
              sm:rounded-[13px]
              md:rounded-[14px]
              ${step.placement}
            `}
          >
            {/* NUMBER */}
            <span
              className={`
                absolute
                right-[10%]
                font-mono
                text-[10px]
                font-bold
                leading-none
                text-[rgba(17,17,17,0.4)]
                transition-all
                duration-300
                sm:text-[11px]
                md:text-[12px]
                ${
                  step.top
                    ? "bottom-[10%]"
                    : "top-[10%]"
                }
              `}
            >
              {step.number}
            </span>

            {/* CONTENT */}
            <div
              className={`
                absolute
                right-[10%]
                left-[10%]
                ${
                  step.top
                    ? "top-[10%]"
                    : "bottom-[10%]"
                }
              `}
            >
              {/* TITLE */}
              <h3
                className="
                  m-0
                  mb-[8px]
                  font-display
                  font-black
                  uppercase
                  text-[13px]
                  leading-[0.95]
                  tracking-[-0.03em]
                  text-[#111111]
                  transition-all
                  duration-300
                  hover:translate-x-[3px]
                  hover:tracking-[-0.01em]
                  sm:mb-[10px]
                  sm:text-[14px]
                  md:mb-[16px]
                  md:text-[17px]
                "
              >
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p
                className="
                  m-0
                  max-w-full
                  font-mono
                  text-[9px]
                  font-bold
                  uppercase
                  leading-[1.4]
                  text-[rgba(17,17,17,0.55)]
                  transition-colors
                  duration-300
                  hover:text-[#111111]
                  sm:text-[10px]
                  md:max-w-[94%]
                  md:text-[11px]
                "
              >
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* LARGE BACKGROUND MOVING MARQUEE TEXT (CENTERED) */}
      <div
        className="
          absolute
          top-[50%]
          left-0
          w-full
          -translate-y-1/2
          z-[1]
          overflow-hidden
          pointer-events-none
        "
        aria-hidden="true"
      >
        <div className="animate-marquee whitespace-nowrap">
          <span
            className="
              inline-block
              font-display
              font-black
              uppercase
              text-[#ecebea]
              text-[clamp(10rem,35vw,26rem)]
              leading-[0.8]
              tracking-[0.05em]
              px-6
              transition-colors
              duration-1000
              group-hover:text-[#e4e3e1]
            "
          >
            shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
          </span>
          <span
            className="
              inline-block
              font-display
              font-black
              uppercase
              text-[#ecebea]
              text-[clamp(10rem,35vw,26rem)]
              leading-[0.8]
              tracking-[0.05em]
              px-6
              transition-colors
              duration-1000
              group-hover:text-[#e4e3e1]
            "
          >
            shivanshu singh &nbsp;&bull;&nbsp; shivanshu singh &nbsp;&bull;&nbsp;
          </span>
        </div>
      </div>


      {/* TYPOGRAPHY META INFO */}
      <div
        className="
          absolute
          bottom-[6%]
          right-[7%]
          z-[3]
          font-mono
          text-[8px]
          font-bold
          uppercase
          tracking-[0.08em]
          text-[rgba(17,17,17,0.5)]
          text-right
          transition-all
          duration-300
          hover:translate-x-[4px]
          hover:tracking-[0.12em]
          hover:text-[#111111]
          sm:text-[9px]
          sm:tracking-[0.1em]
          md:right-[11%]
          md:text-[11px]
          md:tracking-[0.12em]
        "
      >
        System Font Stack / UI Mono
      </div>
    </section>
  );
}