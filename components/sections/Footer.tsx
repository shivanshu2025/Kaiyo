import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';

const socialIcons = [FaLinkedinIn, FaFacebookF, FaInstagram, FaTwitter];

export default function Footer() {
  return (
    <footer className="bg-[#E9E9E7] px-4 sm:px-6 md:px-10 lg:px-16 py-10 sm:py-12 md:py-16 text-[#2d2d2d]">
      <div className="max-w-7xl mx-auto">
        <div>
          <h3 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
            Subscribe for News Letters
          </h3>
          <div className="flex w-full sm:w-[420px] max-w-full items-center overflow-hidden rounded-full border border-gray-400">
            <input
              type="email"
              placeholder="Your Email"
              className="min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm outline-none truncate"
            />
            <button className="flex-shrink-0 rounded-full bg-[#2f4f3f] px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#666660]">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="my-8 sm:my-10 border-t border-gray-300 max-w-7xl mx-auto" />

      <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-5 sm:gap-6 md:flex-row">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2f4f3f]">
          Kaiy{"\u014d"}
        </h2>

        <div className="flex gap-3 sm:gap-4">
          {socialIcons.map((Icon, i) => (
            <div
              key={i}
              className="flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-full border border-gray-400 transition hover:bg-[#2f4f3f] hover:text-white"
            >
              <Icon size={13} />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}