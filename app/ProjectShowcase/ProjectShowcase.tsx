export default function ProjectShowcase() {
  return (
    <section
      id="testimonial"
      className="relative h-[clamp(880px,146.5vw,1215px)] overflow-hidden bg-[#171717] text-[#f5f4f2] max-[767px]:h-[clamp(940px,240vw,1215px)]"
      aria-labelledby="project-title"
    >

      <video className="absolute inset-0 w-full h-full z-0 object-cover object-center [filter:grayscale(1)_brightness(0.43)_contrast(1.22)] opacity-[0.86]" autoPlay loop muted playsInline poster="/images/projects-logo-poster.jpg" aria-hidden="true">
        <source src="https://videos.pexels.com/video-files/29848605/12817762_3840_2160_30fps.mp4" type="video/mp4" />
        <source src="https://videos.pexels.com/video-files/34128902/14471915_3840_2160_30fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute top-[3.2%] left-[5.6%] z-[3] flex items-start font-display font-black uppercase text-[clamp(3.15rem,7.1vw,4.55rem)] leading-[0.82] tracking-[-0.07em] max-[767px]:top-[4.2%] max-[767px]:left-[6%] max-[767px]:text-[clamp(3.2rem,14vw,4.6rem)]">
        <span className="mt-[2px] ml-[8px] font-mono text-[rgba(245,244,242,0.9)] text-[clamp(10px,1.1vw,14px)] font-bold tracking-[0.04em] leading-[1.1] uppercase whitespace-nowrap max-[767px]:mt-[1px] max-[767px]:ml-[6px] max-[767px]:text-[8px]">
          [about the project]
        </span>
      </div>

      <dl className="absolute top-[10.3%] left-[5.6%] z-[2] w-[min(38%,390px)] m-0 font-mono text-[rgba(245,244,242,0.95)] text-[clamp(11px,1.15vw,15px)] font-bold leading-[1.1] uppercase max-[767px]:top-[13.2%] max-[767px]:right-[6%] max-[767px]:w-[88%] max-[767px]:text-[10px]">
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


      <p className="absolute top-[10.3%] right-[5.7%] z-[2] w-[min(30%,310px)] m-0 font-mono text-[rgba(245,244,242,0.98)] text-[clamp(11px,1.15vw,15px)] font-bold leading-[1.15] uppercase max-[767px]:top-[24.5%] max-[767px]:w-[88%] max-[767px]:text-[10px]">
        A minimalistic portfolio website for a Webflow &amp; Shopify developer, focused on clarity, structure, and essential content.
      </p>

      <div
        className="absolute top-[3.2%] left-[42.5%] z-[1] w-[25%] h-[27%] opacity-[0.78] max-[767px]:top-[3%] max-[767px]:left-[55%] max-[767px]:w-[40%] max-[767px]:h-[24%] max-[767px]:opacity-[0.52]"
        aria-hidden="true"
      >
        <span className="absolute block bg-[#252525] top-0 left-[41%] w-[17%] h-[94%] [clip-path:polygon(24%_0,100%_7%,79%_100%,0_90%)] rotate-[12deg]" />
        <span className="absolute block bg-[#252525] top-[45%] left-[2%] w-[98%] h-[21%] [clip-path:polygon(2%_23%,15%_0,100%_67%,87%_100%)] rotate-[27deg]" />
        <span className="absolute block bg-[#303030] top-[43%] left-[38%] w-[22%] h-[22%] [clip-path:polygon(0_25%,55%_0,100%_54%,43%_100%)] rotate-[14deg]" />
      </div>

      <div className="absolute top-[42.8%] right-[5.6%] left-[5.6%] z-[3] grid h-[10.7%] grid-cols-[0.7fr_1fr] gap-[8px] max-[767px]:top-[38%] max-[767px]:h-auto max-[767px]:grid-cols-[1fr] max-[767px]:gap-[12px]">
        <article className="min-w-0 pt-[16px] px-[18px] pb-[13px] overflow-hidden rounded-[14px] bg-[#f5f4f2] text-[#171717] max-[767px]:min-h-[132px] max-[767px]:pt-[15px] max-[767px]:px-[17px] max-[767px]:pb-[14px] max-[767px]:rounded-[13px]">
          <span className="block mb-[9px] font-mono text-[clamp(9px,0.95vw,12px)] font-bold leading-[1] uppercase max-[767px]:text-[9px]">
            [goal]
          </span>

          <p className="m-0 font-mono text-[clamp(11px,1.1vw,14px)] font-bold leading-[1.18] uppercase max-[767px]:text-[10px] max-[767px]:leading-[1.22]">
            To create a modern, minimalistic website with a clear focus on the main CTA - submitting a contact form for client inquiries and project requests.
          </p>
        </article>

        <article className="min-w-0 pt-[16px] px-[18px] pb-[13px] overflow-hidden rounded-[14px] bg-[#f5f4f2] text-[#171717] max-[767px]:min-h-[132px] max-[767px]:pt-[15px] max-[767px]:px-[17px] max-[767px]:pb-[14px] max-[767px]:rounded-[13px] max-[767px]:last:min-h-[175px]">
          <span className="block mb-[9px] font-mono text-[clamp(9px,0.95vw,12px)] font-bold leading-[1] uppercase max-[767px]:text-[9px]">
            [solution]
          </span>

          <p className="m-0 font-mono text-[clamp(11px,1.1vw,14px)] font-bold leading-[1.18] uppercase max-[767px]:text-[10px] max-[767px]:leading-[1.22]">
            Focus on a &quot;tech&quot;-driven typographic style and a sharp black-and-white palette. A clear hierarchy and structured project cards were used to present content effectively, while unnecessary elements were removed to keep the experience focused on the main CTA.
          </p>
        </article>
      </div>

      <h2
        id="project-title"
        className="absolute top-[62%] left-[11.5%] z-[3] flex w-max m-0 flex-col items-start gap-[15px] font-display font-black uppercase text-[#f7f6f4] text-[clamp(5rem,12.8vw,9.7rem)] leading-[0.79] tracking-[0.035em] scale-x-[0.74] origin-top-left max-[767px]:top-[73.5%] max-[767px]:gap-[9px] max-[767px]:text-[clamp(4.8rem,19vw,8.3rem)] max-[767px]:leading-[0.8] max-[767px]:scale-x-[0.72] max-[767px]:tracking-[0.025em]"
        aria-label="Clarity, structure, function"
      >
        <span className="block whitespace-nowrap">Clarity</span>

        <span className="block whitespace-nowrap ml-[13%] max-[767px]:ml-[11%]">
          Structure
        </span>

        <span className="block whitespace-nowrap">Function</span>
      </h2>



      <span
        className="absolute z-[2] block w-[clamp(65px,10.5vw,95px)] h-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:top-1/2 before:left-1/2 before:w-full before:h-[8px] before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:top-1/2 after:left-1/2 after:w-full after:h-[8px] after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] top-[71%] left-[51.8%] max-[767px]:top-[74.2%] max-[767px]:left-[55%] max-[767px]:w-[78px] max-[767px]:h-[78px]"
        aria-hidden="true"
      />
      <span
        className="absolute z-[2] block w-[clamp(65px,10.5vw,95px)] h-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:top-1/2 before:left-1/2 before:w-full before:h-[8px] before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:top-1/2 after:left-1/2 after:w-full after:h-[8px] after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] top-[80.3%] left-[11.2%] max-[767px]:top-[82.8%] max-[767px]:left-[8%] max-[767px]:w-[78px] max-[767px]:h-[78px]"
        aria-hidden="true"
      />
      <span
        className="absolute z-[2] block w-[clamp(65px,10.5vw,95px)] h-[clamp(65px,10.5vw,95px)] opacity-[0.56] before:absolute before:top-1/2 before:left-1/2 before:w-full before:h-[8px] before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:top-1/2 after:left-1/2 after:w-full after:h-[8px] after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] top-[89.2%] left-[52.4%] max-[767px]:top-[91.6%] max-[767px]:left-[56%] max-[767px]:w-[78px] max-[767px]:h-[78px]"
        aria-hidden="true"
      />
      <span
        className="absolute z-[2] block w-[clamp(65px,10.5vw,95px)] h-[clamp(65px,10.5vw,95px)] opacity-[0.25] before:absolute before:top-1/2 before:left-1/2 before:w-full before:h-[8px] before:content-[''] before:bg-[#292929] before:[transform:translate(-50%,-50%)_rotate(45deg)] after:absolute after:top-1/2 after:left-1/2 after:w-full after:h-[8px] after:content-[''] after:bg-[#292929] after:[transform:translate(-50%,-50%)_rotate(-45deg)] top-[77.3%] left-[75%] scale-[0.72] max-[767px]:top-[80.5%] max-[767px]:left-[78%] max-[767px]:w-[78px] max-[767px]:h-[78px]"
        aria-hidden="true"
      />

    </section>
  );
}
