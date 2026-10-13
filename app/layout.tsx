import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
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
    // suppressHydrationWarning: the admin theme bootstrap script sets a class on
    // <html> before React hydrates, which React would otherwise report as a
    // mismatch. It has no effect on the public site's markup.
    <html lang="en" suppressHydrationWarning>
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
        {/*
          Sonner renders nothing until `toast()` is called, so mounting it here is
          visually a no-op - it adds no markup, no spacing and no styling to the
          public site.

          It has to live in the ROOT layout rather than inside individual pages.
          `toast()` is a no-op unless a `<Toaster />` is currently mounted, so
          every confirmation and error message on a public page - the solution
          inquiry form, the calculator, testimonial submission - was silently
          dropped. The admin panel already mounted its own `<Toaster />` in
          `app/admin/layout.tsx`; this is the public-side equivalent.
        */}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
