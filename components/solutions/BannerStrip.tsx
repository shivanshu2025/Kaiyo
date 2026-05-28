'use client';

interface BannerStripProps {
  bg: string;
  title: string;
  titleColor?: string;
  text: string;
  textColor?: string;
  primaryBtn: {
    text: string;
    bg: string;
    color: string;
    hoverBg?: string;
  };
  secondaryBtn: {
    text: string;
    color: string;
    hoverBg?: string;
    hoverColor?: string;
  };
}

export default function BannerStrip({
  bg,
  title,
  titleColor = "#1e3932",
  text,
  textColor = "#32483e",
  primaryBtn,
  secondaryBtn
}: BannerStripProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center justify-center px-4 sm:px-6 md:px-10 lg:px-[7%] py-8 sm:py-10" style={{ backgroundColor: bg }}>
      <div className="text-center sm:text-left">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[28px]" style={{ color: titleColor }}>
          {title}
        </h1>
      </div>

      <div className="text-center sm:text-left">
        <p className="text-xs sm:text-sm md:text-base" style={{ color: textColor }}>
          {text}
        </p>
      </div>

      <div className="flex gap-3 sm:gap-4">
        <button
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-colors"
          style={{
            backgroundColor: primaryBtn.bg,
            color: primaryBtn.color,
          }}
          onMouseEnter={(e) => {
            if (primaryBtn.hoverBg) {
              (e.target as HTMLButtonElement).style.backgroundColor = primaryBtn.hoverBg!;
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = primaryBtn.bg;
          }}
        >
          {primaryBtn.text}
        </button>

        <button
          className="px-4 sm:px-5 py-2 sm:py-2.5 border-2 rounded-full text-sm font-semibold transition-colors"
          style={{
            color: secondaryBtn.color,
            borderColor: secondaryBtn.color,
            backgroundColor: "transparent"
          }}
          onMouseEnter={(e) => {
            if (secondaryBtn.hoverBg) {
              (e.target as HTMLButtonElement).style.backgroundColor = secondaryBtn.hoverBg!;
              if (secondaryBtn.hoverColor) {
                (e.target as HTMLButtonElement).style.color = secondaryBtn.hoverColor!;
              }
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.target as HTMLButtonElement).style.color = secondaryBtn.color;
          }}
        >
          {secondaryBtn.text}
        </button>
      </div>
    </div>
  );
}
