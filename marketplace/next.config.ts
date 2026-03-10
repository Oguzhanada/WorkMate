import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https://ejpnmcxzycxqfdbetydp.supabase.co https://*.stripe.com https://images.unsplash.com https://*.tile.openstreetmap.org",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "connect-src 'self' https://ejpnmcxzycxqfdbetydp.supabase.co wss://ejpnmcxzycxqfdbetydp.supabase.co https://api.stripe.com https://api.ideal-postcodes.co.uk https://*.tile.openstreetmap.org",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  turbopack: { root: __dirname },
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
    ],
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

export default withNextIntl(nextConfig);
