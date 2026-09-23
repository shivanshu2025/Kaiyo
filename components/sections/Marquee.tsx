type MarqueeItemData = { text: string };

const defaultItems = [
  'DESIGN', 'INNOVATE', 'DOMINATE',
  'CRAFTING DIGITAL EXPERIENCES', 'WEBSITES THAT SELL',
  'MODERN WEBSITES', 'MODERN BRANDS',
];

interface Props {
  dynamicItems?: MarqueeItemData[];
}

export default function Marquee({ dynamicItems }: Props) {
  const items = dynamicItems && dynamicItems.length > 0
    ? dynamicItems.filter(i => i.text).map(i => i.text)
    : defaultItems;

  return (
    <section className="overflow-hidden bg-stone-900 py-6 text-white">
      <div className="marquee-track flex w-max animate-marquee whitespace-nowrap text-xl font-bold sm:text-2xl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-12 pr-12">
            {items.map((item, idx) => (
              <span key={idx} className="uppercase tracking-wide">
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}