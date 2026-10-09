import type { Metadata } from 'next';
import localFont from 'next/font/local';
import FooterWrapper from '@/components/sections/FooterWrapper';
import NavbarWrapper from '@/components/sections/NavbarWrapper';
import SupportWidget from '@/components/sections/SupportWidget/SupportWidget';
import '@/styles/globals.css';

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const metadataBase = new URL(siteUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: `Kaiy\u014d`,
    template: `%s | Kaiy\u014d`,
  },
  description: 'Live boldly, dress bravely. Premium fashion collection.',
  icons: {
    icon: '/images/Kaiyologo.png',
    shortcut: '/images/Kaiyologo.png',
    apple: '/images/Kaiyologo.png',
  },
  openGraph: {
    images: [
      {
        url: '/images/Kaiyologo.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: '/images/Kaiyologo.png',
      },
    ],
  },
};

const inter = localFont({
  src: [{ path: '../public/fonts/inter-latin-var.woff2', weight: '100 900', style: 'normal' }],
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
  variable: '--font-inter',
});

const caveat = localFont({
  src: [{ path: '../public/fonts/caveat-latin-var.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  fallback: ['cursive'],
  variable: '--font-caveat',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased flex flex-col',
          inter.variable,
          caveat.variable
        )}
      >
        <NavbarWrapper />
        <SupportWidget />
        <div className="flex-1">
          {children}
        </div>
        <FooterWrapper />
      </body>
    </html>
  );
}
