import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import FooterWrapper from '@/components/sections/FooterWrapper';
import NavbarWrapper from '@/components/sections/NavbarWrapper';
import '@/styles/globals.css';

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://kaiyo-2.onrender.com')
);

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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-caveat',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased flex flex-col',
          inter.className,
          caveat.variable
        )}
      >
        <NavbarWrapper />
        <div className="flex-1">
          {children}
        </div>
        <FooterWrapper />
      </body>
    </html>
  );
}
