const items = [
  'DESIGN',
  'INNOVATE',
  'DOMINATE',
  'CRAFTING DIGITAL EXPERIENCES',
  'WEBSITES THAT SELL',
  'MODERN WEBSITES',
  'MODERN BRANDS',
];

export default function Marquee() {
  return (
    <section className="overflow-hidden bg-stone-900 py-6 text-white">
      <div className="marquee-track flex w-max animate-marquee whitespace-nowrap text-2xl font-bold">
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