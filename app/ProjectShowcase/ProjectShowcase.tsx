export default function ProjectShowcase() {
  return (
    <section
      id="testimonial"
      className="relative h-[clamp(880px,120vw,1215px)] overflow-hidden bg-[#171717] text-[#f5f4f2] sm:h-[clamp(860px,125vw,1180px)] md:h-[clamp(820px,78vw,1215px)] lg:h-[clamp(880px,70vw,1215px)]"
      aria-labelledby="project-title"
    >

      <video className="absolute inset-0 w-full h-full z-0 object-cover object-center [filter:grayscale(1)_brightness(0.43)_contrast(1.22)] opacity-[0.86]" autoPlay loop muted playsInline poster="/images/projects-logo-poster.jpg" aria-hidden="true">
        <source src="https://videos.pexels.com/video-files/29848605/12817762_3840_2160_30fps.mp4" type="video/mp4" />
        <source src="https://videos.pexels.com/video-files/34128902/14471915_3840_2160_30fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-[3.2%] left-[5.6%] z-[3] flex items-start font-display font-black uppercase text-[clamp(3.15rem,7.1vw,4.55rem)] leading-[0.82] tracking-[-0.07em] sm:left-[6%] sm:text-[clamp(2.8rem,8vw,4.2rem)] md:left-[5.6%] md:text-[clamp(3rem,6vw,4.55rem)]">
        <span className="ml-[6px] mt-[2px] font-mono text-[clamp(9px,1.1vw,14px)] font-bold leading-[1.1] tracking-[0.04em] text-[rgba(245,244,242,0.9)] uppercase whitespace-nowrap sm:ml-[7px] md:ml-[8px]">
          [about the project]
        </span>
      </div>

      <dl className="absolute top-[10.3%] left-[5.6%] z-[2] w-[min(38%,390px)] m-0 font-mono text-[clamp(10px,1.15vw,15px)] font-bold leading-[1.1] uppercase text-[rgba(245,244,242,0.95)] max-sm:left-[6%] max-sm:top-[12.5%] max-sm:w-[88%] sm:w-[min(42%,360px)] sm:text-[11px] md:w-[min(38%,390px)] md:text-[clamp(10px,1.1vw,14px)]">
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


      <p className="absolute top-[10.3%] right-[5.7%] z-[2] w-[min(30%,310px)] m-0 font-mono text-[clamp(10px,1.15vw,15px)] font-bold leading-[1.15] uppercase text-[rgba(245,244,242,0.98)] max-sm:left-[6%] max-sm:right-[6%] max-sm:top-[22.5%] max-sm:w-[88%] sm:left-[6%] sm:right-[6%] sm:top-[24%] sm:w-[88%] sm:text-[11px] md:left-auto md:right-[5.7%] md:top-[10.3%] md:w-[min(30%,310px)] md:text-[clamp(10px,1.05vw,14px)]">
        A minimalistic portfolio website for a Webflow &amp; Shopify developer, focused on clarity, structure, and essential content.
      </p>

      <div
        className="absolute left-[42.5%] top-[3.2%] z-[1] h-[27%] w-[25%] opacity-[0.78] max-sm:left-[52%] max-sm:top-[3.5%] max-sm:h-[20%] max-sm:w-[36%] max-sm:opacity-[0.52] sm:left-[50%] sm:h-[22%] sm:w-[32%] md:left-[42.5%] md:top-[3.2%] md:h-[27%] md:w-[25%]"
        aria-hidden="true"
      >
        <span className="absolute block bg-[#252525] top-0 left-[41%] w-[17%] h-[94%] [clip-path:polygon(24%_0,100%_7%,79%_100%,0_90%)] rotate-[12deg]" />
        <span className="absolute block bg-[#252525] top-[45%] left-[2%] w-[98%] h-[21%] [clip-path:polygon(2%_23%,15%_0,100%_67%,87%_100%)] rotate-[27deg]" />
        <span className="absolute block bg-[#303030] top-[43%] left-[38%] w-[22%] h-[22%] [clip-path:polygon(0_25%,55%_0,100%_54%,43%_100%)] rotate-[14deg]" />
      </div>

      <div className="absolute left-[5.6%] right-[5.6%] top-[42.8%] z-[3] grid h-[10.7%] grid-cols-[0.7fr_1fr] gap-[8px] max-sm:left-[6%] max-sm:right-[6%] max-sm:top-[35%] max-sm:h-auto max-sm:grid-cols-1 max-sm:gap-3 sm:left-[6%] sm:right-[6%] sm:top-[37%] sm:h-auto sm:grid-cols-1 sm:gap-3 md:left-[5.6%] md:right-[5.6%] md:top-[42.8%] md:h-[10.7%] md:grid-cols-[0.7fr_1fr] md:gap-[8px]">
        <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[18px] pb-[13px] pt-[16px] text-[#171717] max-sm:min-h-[122px] max-sm:px-[16px] max-sm:pb-[14px] max-sm:pt-[14px] sm:min-h-[128px] sm:rounded-[13px] md:min-h-0 md:rounded-[14px]">
          <span className="mb-[9px] block font-mono text-[clamp(9px,0.95vw,12px)] font-bold uppercase leading-[1]">
            [goal]
          </span>

          <p className="m-0 font-mono text-[clamp(10px,1.05vw,14px)] font-bold uppercase leading-[1.18] sm:text-[11px] md:text-[clamp(10px,1vw,13px)]">
            To create a modern, minimalistic website with a clear focus on the main CTA - submitting a contact form for client inquiries and project requests.
          </p>
        </article>

        <article className="min-w-0 overflow-hidden rounded-[14px] bg-[#f5f4f2] px-[18px] pb-[13px] pt-[16px] text-[#171717] max-sm:min-h-[140px] max-sm:px-[16px] max-sm:pb-[14px] max-sm:pt-[14px] sm:min-h-[148px] sm:rounded-[13px] md:min-h-0 md:rounded-[14px]">
          <span className="mb-[9px] block font-mono text-[clamp(9px,0.95vw,12px)] font-bold uppercase leading-[1]">
            [solution]
          </span>

          <p className="m-0 font-mono text-[clamp(10px,1.05vw,14px)] font-bold uppercase leading-[1.18] sm:text-[11px] md:text-[clamp(10px,1vw,13px)]">
            Focus on a &quot;tech&quot;-driven typographic style and a sharp black-and-white palette. A clear hierarchy and structured project cards were used to present content effectively, while unnecessary elements were removed to keep the experience focused on the main CTA.
          </p>
        </article>
      </div>

      <h2
        id="project-title"
        className="absolute left-[11.5%] top-[62%] z-[3] m-0 flex w-max origin-top-left flex-col items-start gap-[15px] font-display font-black uppercase leading-[0.79] tracking-[0.035em] text-[#f7f6f4] [transform:scaleX(0.74)] text-[clamp(5rem,12.8vw,9.7rem)] max-sm:left-[8%] max-sm:top-[69%] max-sm:gap-[8px] max-sm:text-[clamp(3.8rem,18vw,6.5rem)] max-sm:[transform:scaleX(0.72)] sm:left-[8%] sm:top-[71%] sm:gap-[10px] sm:text-[clamp(4.2rem,17vw,7.5rem)] md:left-[11.5%] md:top-[62%] md:gap-[15px] md:text-[clamp(5rem,11vw,9.7rem)]"
        aria-label="Clarity, structure, function"
      >
        <span className="block whitespace-nowrap">Clarity</span>

        <span className="ml-[13%] block whitespace-nowrap max-sm:ml-[10%]">
          Structure
        </span>

        <span className="block whitespace-nowrap">Function</span>
      </h2>



      <span
        className="absolute left-[51.8%] top-[71%] z-[2] block h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] max-sm:left-[54%] max-sm:top-[73%] max-sm:h-[64px] max-sm:w-[64px] sm:h-[70px] sm:w-[70px] md:left-[51.8%] md:top-[71%] md:h-[clamp(65px,10.5vw,95px)] md:w-[clamp(65px,10.5vw,95px)]"
        aria-hidden="true"
      />
      <span
        className="absolute left-[11.2%] top-[80.3%] z-[2] block h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] max-sm:left-[7%] max-sm:top-[80.5%] max-sm:h-[64px] max-sm:w-[64px] sm:h-[70px] sm:w-[70px] md:left-[11.2%] md:top-[80.3%] md:h-[clamp(65px,10.5vw,95px)] md:w-[clamp(65px,10.5vw,95px)]"
        aria-hidden="true"
      />
      <span
        className="absolute left-[52.4%] top-[89.2%] z-[2] block h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] max-sm:left-[54%] max-sm:top-[88%] max-sm:h-[64px] max-sm:w-[64px] sm:h-[70px] sm:w-[70px] md:left-[52.4%] md:top-[89.2%] md:h-[clamp(65px,10.5vw,95px)] md:w-[clamp(65px,10.5vw,95px)]"
        aria-hidden="true"
      />
      <span
        className="absolute left-[75%] top-[77.3%] z-[2] block h-[clamp(65px,10.5vw,95px)] w-[clamp(65px,10.5vw,95px)] scale-[0.72] opacity-[0.25] before:absolute before:left-1/2 before:top-1/2 before:h-[8px] before:w-full before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:left-1/2 after:top-1/2 after:h-[8px] after:w-full after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] max-sm:left-[74%] max-sm:top-[78%] max-sm:h-[64px] max-sm:w-[64px] sm:h-[70px] sm:w-[70px] md:left-[75%] md:top-[77.3%] md:h-[clamp(65px,10.5vw,95px)] md:w-[clamp(65px,10.5vw,95px)]"
        aria-hidden="true"
      />

    </section>
  );
}
