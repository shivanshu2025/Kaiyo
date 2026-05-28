'use client';

export default function Ads() {
  return (
    <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] bg-[#E9E9E7] font-sans overflow-x-hidden">
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          className="h-full w-full object-cover opacity-30"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/video/video2.mp4" type="video/mp4" />
        </video>

      </div>
    </section>
  );
}

