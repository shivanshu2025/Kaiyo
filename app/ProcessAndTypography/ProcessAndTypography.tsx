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
        min-h-[900px]
        overflow-hidden
        bg-[#f7f6f5]
        text-[#111111]
        max-[767px]:min-h-[900px]
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
          left-[10.4%]
          z-[5]
          grid
          w-[78%]
          grid-cols-3
          gap-[28px]
          max-[767px]:top-[4%]
          max-[767px]:left-[7%]
          max-[767px]:w-[86%]
          max-[767px]:grid-cols-2
          max-[767px]:gap-[12px]
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
              rounded-[14px]
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
              ${step.placement}
              max-[767px]:rounded-[10px]
            `}
          >
            {/* NUMBER */}
            <span
              className={`
                absolute
                right-[10%]
                font-mono
                text-[12px]
                font-bold
                leading-none
                text-[rgba(17,17,17,0.4)]
                transition-all
                duration-300
                max-[767px]:right-[10%]
                max-[767px]:text-[8px]
                ${
                  step.top
                    ? "bottom-[10%] max-[767px]:bottom-[10%]"
                    : "top-[10%] max-[767px]:top-[10%]"
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
                max-[767px]:right-[10%]
                max-[767px]:left-[10%]
                ${
                  step.top
                    ? "top-[10%] max-[767px]:top-[10%]"
                    : "bottom-[10%] max-[767px]:bottom-[10%]"
                }
              `}
            >
              {/* TITLE */}
              <h3
                className="
                  m-0
                  mb-[16px]
                  font-display
                  font-black
                  uppercase
                  text-[17px]
                  leading-[0.95]
                  tracking-[-0.03em]
                  text-[#111111]
                  transition-all
                  duration-300
                  hover:translate-x-[3px]
                  hover:tracking-[-0.01em]
                  max-[767px]:mb-[8px]
                  max-[767px]:text-[11px]
                "
              >
                {step.title}
              </h3>

              {/* DESCRIPTION */}
              <p
                className="
                  m-0
                  max-w-[94%]
                  font-mono
                  text-[11px]
                  font-bold
                  uppercase
                  leading-[1.4]
                  text-[rgba(17,17,17,0.55)]
                  transition-colors
                  duration-300
                  hover:text-[#111111]
                  max-[767px]:max-w-full
                  max-[767px]:text-[7px]
                  max-[767px]:leading-[1.4]
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

      {/* BEBAS NEUE */}
      <div
        className="
          absolute
          top-[57%]
          left-[10.4%]
          z-[3]
          font-display
          font-black
          uppercase
          text-[clamp(2.8rem,7vw,5.5rem)]
          leading-[0.85]
          tracking-[0.03em]
          scale-x-[0.8]
          origin-top-left
          transition-all
          duration-500
          hover:translate-x-[5px]
          hover:scale-x-[0.83]
          hover:tracking-[0.05em]
          hover:text-[#222222]
          max-[767px]:top-[53%]
          max-[767px]:left-[7%]
          max-[767px]:text-[clamp(2rem,10vw,4rem)]
          max-[767px]:tracking-[0.02em]
        "
      >
        Bebas Neue
      </div>

      {/* ACCENT */}
      <div
        className="
          absolute
          top-[65%]
          left-[10.4%]
          z-[3]
          font-mono
          text-[11px]
          font-bold
          uppercase
          tracking-[0.12em]
          text-[rgba(17,17,17,0.5)]
          transition-all
          duration-300
          hover:translate-x-[4px]
          hover:tracking-[0.16em]
          hover:text-[#111111]
          max-[767px]:top-[60%]
          max-[767px]:left-[7%]
          max-[767px]:text-[8px]
          max-[767px]:tracking-[0.08em]
        "
      >
        Display Typeface / Primary Accent
      </div>

      {/* JETBRAINS MONO */}
      <div
        className="
          absolute
          bottom-[6%]
          left-[10.4%]
          z-[3]
          font-sans
          font-black
          uppercase
          text-[clamp(2.5rem,4.5vw,4.5rem)]
          leading-[0.85]
          tracking-[-0.02em]
          transition-all
          duration-500
          hover:translate-x-[5px]
          hover:tracking-[0.01em]
          hover:text-[#222222]
          max-[767px]:bottom-[6%]
          max-[767px]:left-[7%]
          max-[767px]:text-[clamp(2rem,9vw,3.5rem)]
        "
      >
        JetBrains
        <br />
        Mono
      </div>

      {/* TYPOGRAPHY META INFO */}
      <div
        className="
          absolute
          bottom-[6%]
          right-[11%]
          z-[3]
          font-mono
          text-[11px]
          font-bold
          uppercase
          tracking-[0.12em]
          text-[rgba(17,17,17,0.5)]
          text-right
          transition-all
          duration-300
          hover:translate-x-[4px]
          hover:tracking-[0.16em]
          hover:text-[#111111]
          max-[767px]:right-[7%]
          max-[767px]:bottom-[6%]
          max-[767px]:text-[8px]
          max-[767px]:tracking-[0.08em]
        "
      >
        System Font Stack / UI Mono
      </div>
    </section>
  );
}