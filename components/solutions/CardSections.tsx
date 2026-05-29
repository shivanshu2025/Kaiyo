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
    <div className="px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:px-24" style={{ background: bgColor }}>
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className="mx-auto mb-8 max-w-[1600px] sm:mb-10">
          <h3 className="text-xs sm:text-sm font-bold tracking-wider mb-4 sm:mb-5 text-[#1e1e1e]">
            {section.title}
          </h3>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),280px))] gap-4 sm:gap-5 md:gap-6">
            {section.cards.map((card, cardIdx) => (
              <div key={cardIdx} className="w-full">
                <img
                  src={card.src}
                  alt={section.title}
                  className="aspect-[4/3] w-full rounded-xl object-cover shadow-md transition-shadow duration-300 hover:shadow-lg"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
