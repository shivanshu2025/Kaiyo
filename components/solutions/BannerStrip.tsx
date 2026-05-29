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
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-8 sm:flex-row sm:flex-wrap sm:gap-6 sm:px-6 sm:py-10 md:gap-8 md:px-10 lg:gap-12 lg:px-[7%]" style={{ backgroundColor: bg }}>
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

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <button
          className="rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 sm:py-2.5"
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
          className="rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors sm:px-5 sm:py-2.5"
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
