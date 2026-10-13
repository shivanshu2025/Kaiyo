/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // `output: 'standalone'` was removed: Vercel is the deployment target and builds
  // its own server output, so standalone was redundant while also conflicting with
  // netlify.toml's `publish = ".next"`. Reinstate it only if self-hosting via
  // Docker, and drop netlify.toml at the same time.

  /**
   * Baseline security headers.
   *
   * The admin dashboard is cookie-authenticated, so these are the second line of
   * defence behind the guards in `backend/lib/guards.ts`:
   *  - `nosniff` stops a browser from re-interpreting a response as another type,
   *  - `DENY` framing blocks clickjacking of the dashboard,
   *  - `no-referrer` keeps query strings (which can carry a `?from=` admin path)
   *    out of third-party requests and out of the Referer header,
   *  - HSTS is only sent over HTTPS, so it is harmless in local development.
   *
   * A Content-Security-Policy is intentionally NOT set here. The site loads fonts,
   * images and video from many third-party origins (pexels, unsplash, gstatic,
   * flaticon, envatousercontent, vercel blob/S3), and Next.js injects inline
   * bootstrap scripts. A policy wide enough not to break those is no longer a
   * meaningful restriction, and a narrow one would break the public site. Add one
   * with `report-only` once the full origin list has been inventoried.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdni.iconscout.com',
      },
      {
        protocol: 'https',
        hostname: 'bootstrapmade.com',
      },
      {
        protocol: 'https',
        hostname: 'market-resized.envatousercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'image1.jdomni.in',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'engineersealstamps.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
