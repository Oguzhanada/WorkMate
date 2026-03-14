import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const repoRoot = path.resolve(__dirname, '..');

// Keep CSP out of next.config headers().
// We use route-tier CSP in middleware so strict pages can receive a per-request
// nonce. Re-introducing a global `script-src ... strict-dynamic` header here
// will break Next/Turbopack hydration on baseline pages because there is no
// nonce/hash relationship for the framework bundles.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
