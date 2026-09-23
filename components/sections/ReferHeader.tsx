'use client';

import Navbar from './Navbar';

export default function ReferHeader() {
  return (
    <Navbar
      navLinks={[
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Calculator', href: '/calculator' },
      ]}
      ctaText="Get Started"
      ctaHref="/contact"
      showSolutions={false}
    />
  );
}
