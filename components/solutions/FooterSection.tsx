interface FooterSectionProps {
  bg: string;
  left?: {
    title: string;
    titleColor: string;
    text: string;
  };
  right?: {
    title: string;
    titleColor: string;
    text: string;
  };
  single?: {
    title: string;
    titleColor: string;
    text: string;
  };
}

export default function FooterSection({
  bg,
  left,
  right,
  single
}: FooterSectionProps) {
  if (single) {
    return (
      <div style={{
        backgroundColor: bg,
        padding: "60px 40px",
        fontFamily: "Arial, sans-serif"
      }}>
        <h3 style={{ color: single.titleColor }}>{single.title}</h3>
        <p>{single.text}</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 sm:px-10 lg:px-20" style={{ backgroundColor: bg }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 md:gap-20">
        {/* Left */}
        {left && (
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: left.titleColor }}>
              {left.title}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed">
              {left.text}
            </p>
          </div>
        )}

        {/* Right */}
        {right && (
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: right.titleColor }}>
              {right.title}
            </h3>

            <p className="text-sm sm:text-base leading-relaxed">
              {right.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
