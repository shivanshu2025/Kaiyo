interface TopSectionProps {
  title: string;
  subtitle: string;
  featuredCards: Array<{ src: string }>;
  infoBox: {
    icon: string;
    text: string;
  };
  bgColor?: string;
}

export default function TopSection({
  title,
  subtitle,
  featuredCards,
  infoBox,
  bgColor = "#F0F0F0"
}: TopSectionProps) {
  return (
    <div className="w-full pb-8 sm:pb-10" style={{ background: bgColor }}>
      <div className="mx-auto max-w-[1600px] px-4 pt-8 sm:px-6 sm:pt-12 md:px-10 md:pt-16 lg:px-24">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1e3932]">
          {title}
        </h1>

        <h3 className="mt-4 sm:mt-6 md:mt-8 text-base sm:text-lg md:text-xl lg:text-2xl text-[#32483e]">
          {subtitle}
        </h3>

        {/* Featured Cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),250px))] gap-3 py-4 sm:gap-4 sm:py-5 md:gap-5">
          {featuredCards.map((item, index) => (
            <div
              key={index}
              className="w-full"
            >
              <img
                src={item.src}
                alt="featured-design"
                className="h-auto w-full rounded-2xl shadow-md"
              />
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="w-full rounded-xl bg-[#f7f7f7] mt-4 sm:mt-5 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4">
            <img
              src={infoBox.icon}
              alt="design"
              className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0"
            />

            <p className="text-xs sm:text-sm md:text-base text-center sm:text-left">
              <b>{infoBox.text}</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
