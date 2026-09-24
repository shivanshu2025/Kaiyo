export default function ProjectShowcase() {
  return (
    <section
      id="testimonial"
      className="relative overflow-hidden bg-[#171717] text-[#f5f4f2] h-auto min-h-0 px-[6%] pb-8 pt-6 sm:pb-8 md:px-[5%] lg:block lg:h-[clamp(880px,70vw,1215px)] lg:min-h-[880px] lg:px-0 lg:pb-0 lg:pt-0"
      aria-labelledby="project-title"
    >
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover object-center [filter:grayscale(1)_brightness(0.43)_contrast(1.22)] opacity-[0.86]"
        autoPlay
        loop
        muted
        playsInline
        poster="/images/projects-logo-poster.jpg"
        aria-hidden="true"
      >
        <source
          src="https://videos.pexels.com/video-files/29848605/12817762_3840_2160_30fps.mp4"
          type="video/mp4"
        />
        <source
          src="https://videos.pexels.com/video-files/34128902/14471915_3840_2160_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* ===================================================== */}
      {/* MOBILE + TABLET (< lg) : natural document flow  */}
      {/* ===================================================== */}
      <div className="relative z-[3] flex flex-col gap-5 lg:hidden">
        {/* ABOUT meta */}
        <div className="flex flex-col gap-4">
          <span className="font-mono text-[10px] font-bold uppercase leading-none tracking-[0.04em] text-[rgba(245,244,242,0.9)]">
            [about the project]
          </span>

          <dl className="m-0 grid w-full gap-0 font-mono text-[11px] font-bold uppercase leading-[1.1] text-[rgba(245,244,242,0.95)]">
            <div className="grid min-h-[36px] grid-cols-[1fr_1fr] items-center border-b border-solid border-[rgba(245,244,242,0.15)]">
              <dt className="m-0">Client</dt>
              <dd className="m-0 justify-self-end">Web developer</dd>
            </div>
            <div className="grid min-h-[36px] grid-cols-[1fr_1fr] items-center border-b border-solid border-[rgba(245,244,242,0.15)]">
              <dt className="m-0">Service</dt>
              <dd className="m-0 justify-self-end">UX/UI design</dd>
            </div>
            <div className="grid min-h-[36px] grid-cols-[1fr_1fr] items-center border-b border-solid border-[rgba(245,244,242,0.15)]">
              <dt className="m-0">Year</dt>
              <dd className="m-0 justify-self-end">2025</dd>
            </div>
          </dl>

          <p className="m-0 max-w-full font-mono text-[11px] font-bold uppercase leading-[1.4] text-[rgba(245,244,242,0.98)]">
            A minimalistic portfolio website for a Webflow &amp; Shopify developer, focused on clarity,
            structure, and essential content.
          </p>
        </div>

        {/* ABSTRACT SHAPE - flow centered, not absolute */}
        <div
          className="relative mx-auto h-[132px] w-[min(200px,58%)] opacity-[0.52] sm:h-[148px] sm:w-[min(240px,48%)]"
          aria-hidden="true"
        >
          <span className="absolute left-[41%] top-0 h-[94%] w-[17%] rotate-[12deg] block bg-[#252525] [clip-path:polygon(24%_0,100%_7%,79%_100%,0_90%)]" />
          <span className="absolute left-[2%] top-[45%] h-[21%] w-[98%] rotate-[27deg] block bg-[#252525] [clip-path:polygon(2%_23%,15%_0,100%_67%,87%_100%)]" />
          <span className="absolute left-[38%] top-[43%] h-[22%] w-[22%] rotate-[14deg] block bg-[#303030] [clip-path:polygon(0_25%,55%_0,100%_54%,43%_100%)]" />
        </div>

        {/* GOAL + SOLUTION - stacked */}
        <div className="grid grid-cols-1 gap-3">
          <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[16px] pb-[14px] pt-[14px] text-[#171717] sm:px-[18px]">
            <span className="mb-[9px] block font-mono text-[11px] font-bold uppercase leading-[1]">
              [goal]
            </span>
            <p className="m-0 font-mono text-[11px] font-bold uppercase leading-[1.35]">
              To create a modern, minimalistic website with a clear focus on the main CTA - submitting a
              contact form for client inquiries and project requests.
            </p>
          </article>

          <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[16px] pb-[14px] pt-[14px] text-[#171717] sm:px-[18px]">
            <span className="mb-[9px] block font-mono text-[11px] font-bold uppercase leading-[1]">
              [solution]
            </span>
            <p className="m-0 font-mono text-[11px] font-bold uppercase leading-[1.35]">
              Focus on a &quot;tech&quot;-driven typographic style and a sharp black-and-white palette. A
              clear hierarchy and structured project cards were used to present content effectively, while
              unnecessary elements were removed to keep the experience focused on the main CTA.
            </p>
          </article>
        </div>

        {/* TITLE with controlled bottom breathing room - section pb provides 40-48px */}
        <div className="relative mt-2 overflow-visible pt-2">
          <h2
            id="project-title"
            className="m-0 flex max-w-[92vw] origin-top-left flex-col items-start gap-[8px] font-display font-black uppercase leading-[0.79] tracking-[0.035em] text-[#f7f6f4] [transform:scaleX(0.72)] text-[clamp(2.85rem,18vw,5rem)] sm:gap-[10px] sm:text-[clamp(3rem,17vw,6rem)]"
            aria-label="Clarity, structure, function"
          >
            <span className="block whitespace-nowrap">Clarity</span>
            <span className="ml-[10%] block whitespace-nowrap">Structure</span>
            <span className="block whitespace-nowrap">Function</span>
          </h2>

          {/* Decorative X - anchored to title wrapper so they move with content and never create page gap */}
          <span
            className="pointer-events-none absolute -top-[18px] left-[54%] block h-[44px] w-[44px] opacity-[0.32] before:absolute before:left-1/2 before:top-1/2 before:h-[6px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[6px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] sm:h-[52px] sm:w-[52px]"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute bottom-[34%] left-[-2%] block h-[44px] w-[44px] opacity-[0.32] before:absolute before:left-1/2 before:top-1/2 before:h-[6px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[6px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] sm:left-[0%] sm:h-[52px] sm:w-[52px]"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute -bottom-[6px] right-[14%] block h-[40px] w-[40px] scale-[0.9] opacity-[0.22] before:absolute before:left-1/2 before:top-1/2 before:h-[6px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[6px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] sm:h-[48px] sm:w-[48px]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ===================================================== */}
      {/* DESKTOP (lg+) : preserve original artistic composition */}
      {/* ===================================================== */}
      <div className="hidden lg:contents" aria-hidden="true">
        {/* ABOUT THE PROJECT */}
        <div className="absolute left-[5.6%] top-[3.2%] z-[3] hidden items-start font-display font-black uppercase leading-[0.82] tracking-[-0.07em] text-[clamp(3.15rem,7.1vw,4.55rem)] lg:flex">
          <span className="ml-[6px] mt-[2px] whitespace-nowrap font-mono text-[clamp(9px,1.1vw,14px)] font-bold uppercase leading-[1.1] tracking-[0.04em] text-[rgba(245,244,242,0.9)]">
            [about the project]
          </span>
        </div>

        {/* PROJECT INFO */}
        <dl className="absolute left-[5.6%] top-[10.3%] z-[2] m-0 hidden w-[min(38%,390px)] font-mono text-[clamp(10px,1.15vw,15px)] font-bold uppercase leading-[1.1] text-[rgba(245,244,242,0.95)] lg:grid">
          <div className="grid min-h-[34px] grid-cols-[1fr_1fr] items-center border-b border-solid border-b-[rgba(245,244,242,0.15)]">
            <dt className="m-0">Client</dt>
            <dd className="m-0 justify-self-end">Web developer</dd>
          </div>
          <div className="grid min-h-[34px] grid-cols-[1fr_1fr] items-center border-b border-solid border-b-[rgba(245,244,242,0.15)]">
            <dt className="m-0">Service</dt>
            <dd className="m-0 justify-self-end">UX/UI design</dd>
          </div>
          <div className="grid min-h-[34px] grid-cols-[1fr_1fr] items-center border-b border-solid border-b-[rgba(245,244,242,0.15)]">
            <dt className="m-0">Year</dt>
            <dd className="m-0 justify-self-end">2025</dd>
          </div>
        </dl>

        {/* DESCRIPTION */}
        <p className="absolute right-[5.7%] top-[10.3%] z-[2] m-0 hidden w-[min(30%,310px)] font-mono text-[clamp(10px,1.15vw,15px)] font-bold uppercase leading-[1.15] text-[rgba(245,244,242,0.98)] lg:block">
          A minimalistic portfolio website for a Webflow &amp; Shopify developer, focused on clarity,
          structure, and essential content.
        </p>

        {/* ABSTRACT SHAPE */}
        <div
          className="absolute left-[42.5%] top-[3.2%] z-[1] hidden h-[27%] w-[25%] opacity-[0.78] lg:block"
          aria-hidden="true"
        >
          <span className="absolute left-[41%] top-0 block h-[94%] w-[17%] rotate-[12deg] bg-[#252525] [clip-path:polygon(24%_0,100%_7%,79%_100%,0_90%)]" />
          <span className="absolute left-[2%] top-[45%] block h-[21%] w-[98%] rotate-[27deg] bg-[#252525] [clip-path:polygon(2%_23%,15%_0,100%_67%,87%_100%)]" />
          <span className="absolute left-[38%] top-[43%] block h-[22%] w-[22%] rotate-[14deg] bg-[#303030] [clip-path:polygon(0_25%,55%_0,100%_54%,43%_100%)]" />
        </div>

        {/* GOAL + SOLUTION */}
        <div className="absolute left-[5.6%] right-[5.6%] top-[42.8%] z-[3] hidden h-[10.7%] grid-cols-[0.7fr_1fr] gap-[8px] lg:grid">
          <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[18px] pb-[13px] pt-[16px] text-[#171717]">
            <span className="mb-[9px] block font-mono text-[clamp(9px,0.95vw,12px)] font-bold uppercase leading-[1]">
              [goal]
            </span>
            <p className="m-0 font-mono text-[clamp(10px,1.05vw,14px)] font-bold uppercase leading-[1.18]">
              To create a modern, minimalistic website with a clear focus on the main CTA - submitting a
              contact form for client inquiries and project requests.
            </p>
          </article>
          <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[18px] pb-[13px] pt-[16px] text-[#171717]">
            <span className="mb-[9px] block font-mono text-[clamp(9px,0.95vw,12px)] font-bold uppercase leading-[1]">
              [solution]
            </span>
            <p className="m-0 font-mono text-[clamp(10px,1.05vw,14px)] font-bold uppercase leading-[1.18]">
              Focus on a &quot;tech&quot;-driven typographic style and a sharp black-and-white palette. A
              clear hierarchy and structured project cards were used to present content effectively, while
              unnecessary elements were removed to keep the experience focused on the main CTA.
            </p>
          </article>
        </div>

        {/* MAIN TITLE - desktop absolute with breathing room */}
        <h2
          aria-hidden="true"
          className="absolute bottom-[6%] left-[11.5%] z-[3] m-0 hidden w-max origin-bottom-left flex-col items-start gap-[15px] font-display font-black uppercase leading-[0.79] tracking-[0.035em] text-[#f7f6f4] [transform:scaleX(0.74)] text-[clamp(5rem,12.8vw,9.7rem)] lg:flex"
        >
          <span className="block whitespace-nowrap">Clarity</span>
          <span className="ml-[13%] block whitespace-nowrap">Structure</span>
          <span className="block whitespace-nowrap">Function</span>
        </h2>

        {/* DECORATIVE X - desktop positions preserved */}
        <span
          className="absolute left-[51.8%] top-[71%] z-[2] hidden h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] lg:block"
          aria-hidden="true"
        />
        <span
          className="absolute left-[11.2%] top-[80.3%] z-[2] hidden h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] lg:block"
          aria-hidden="true"
        />
        <span
          className="absolute left-[52.4%] top-[89.2%] z-[2] hidden h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] lg:block"
          aria-hidden="true"
        />
        <span
          className="absolute left-[75%] top-[77.3%] z-[2] hidden h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] scale-[0.72] opacity-[0.25] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:bg-[#292929] before:content-[''] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:bg-[#292929] after:content-[''] after:[transform:translate(-50%,-50%)_rotate(-45deg)] lg:block"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
