import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const repoRoot = path.resolve(__dirname, '..');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'strict-dynamic' https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https://ejpnmcxzycxqfdbetydp.supabase.co https://*.stripe.com https://images.unsplash.com https://*.tile.openstreetmap.org https://*.r2.dev https://*.cloudflarestorage.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "connect-src 'self' https://ejpnmcxzycxqfdbetydp.supabase.co wss://ejpnmcxzycxqfdbetydp.supabase.co https://api.stripe.com https://api.ideal-postcodes.co.uk https://*.tile.openstreetmap.org https://*.ingest.de.sentry.io https://*.sentry.io https://challenges.cloudflare.com https://cloudflareinsights.com https://*.r2.dev https://*.cloudflarestorage.com https://gateway.ai.cloudflare.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'ejpnmcxzycxqfdbetydp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https' as const,
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https' as const,
        hostname: '*.cloudflarestorage.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/signup', destination: '/sign-up', permanent: false },
      { source: '/register', destination: '/sign-up', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source map upload logs in non-CI environments
  silent: !process.env.CI,

  // Delete source maps after uploading to Sentry (hide from browser devtools)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Route Sentry events through a tunnel to avoid ad blockers
  tunnelRoute: '/monitoring',
});
