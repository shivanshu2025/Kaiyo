interface CardSectionsProps {
  sections: Array<{
    title: string;
    cards: Array<{ src: string }>;
  }>;
  bgColor?: string;
}

export default function CardSections({
  sections,
  bgColor = "#F0F0F0"
}: CardSectionsProps) {
  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 md:px-10 lg:px-24" style={{ background: bgColor }}>
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="mb-8 sm:mb-10">
          <h3 className="text-xs sm:text-sm font-bold tracking-wider mb-4 sm:mb-5 text-[#1e1e1e]">
            {section.title}
          </h3>

          <div className="flex flex-wrap gap-4 sm:gap-5 md:gap-6">
            {section.cards.map((card, cardIdx) => (
              <div key={cardIdx} className="w-full sm:w-[calc(50%-10px)] md:w-[240px] lg:w-[280px]">
                <img
                  src={card.src}
                  alt={section.title}
                  className="w-full aspect-[4/3] object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
