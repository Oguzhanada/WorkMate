import { type CspTier } from '@/lib/security/csp-routes';

type BuildCspOptions = {
  nonce?: string;
  reportUri?: string;
  tier: CspTier;
};

const SCRIPT_SOURCES = [
  'https://js.stripe.com',
  'https://www.googletagmanager.com',
  'https://challenges.cloudflare.com',
  'https://static.cloudflareinsights.com',
];

const STYLE_SOURCES = [
  'https://fonts.googleapis.com',
  'https://cdnjs.cloudflare.com',
];

const IMG_SOURCES = [
  'data:',
  'blob:',
  'https://ejpnmcxzycxqfdbetydp.supabase.co',
  'https://*.stripe.com',
  'https://images.unsplash.com',
  'https://*.tile.openstreetmap.org',
  'https://*.r2.dev',
  'https://*.cloudflarestorage.com',
  'https://www.google-analytics.com',
];

const FONT_SOURCES = [
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com',
];

const CONNECT_SOURCES = [
  'https://ejpnmcxzycxqfdbetydp.supabase.co',
  'wss://ejpnmcxzycxqfdbetydp.supabase.co',
  'https://api.stripe.com',
  'https://api.ideal-postcodes.co.uk',
  'https://*.tile.openstreetmap.org',
  'https://*.ingest.de.sentry.io',
  'https://*.sentry.io',
  'https://challenges.cloudflare.com',
  'https://cloudflareinsights.com',
  'https://static.cloudflareinsights.com',
  'https://*.r2.dev',
  'https://*.cloudflarestorage.com',
  'https://gateway.ai.cloudflare.com',
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com',
];

const FRAME_SOURCES = [
  'https://js.stripe.com',
  'https://hooks.stripe.com',
  'https://challenges.cloudflare.com',
];

function joinDirective(name: string, values: Array<string | false | null | undefined>) {
  const filtered = values.filter(Boolean);
  return `${name} ${filtered.join(' ')}`;
}

function getDevConnectSources() {
  return process.env.NODE_ENV === 'development' ? ['ws:', 'http://localhost:*'] : [];
}

function getScriptDirective(tier: CspTier, nonce?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (tier === 'strict') {
    if (!nonce) {
      throw new Error('Strict CSP requires a nonce.');
    }

    // `strict-dynamic` is only safe here because strict routes receive a
    // per-request nonce from middleware and render dynamically.
    return joinDirective('script-src', [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      isDevelopment && "'unsafe-eval'",
      ...SCRIPT_SOURCES,
    ]);
  }

  return joinDirective('script-src', [
    "'self'",
    "'unsafe-inline'",
    isDevelopment && "'unsafe-eval'",
    ...SCRIPT_SOURCES,
  ]);
}

function getStyleDirective(tier: CspTier, nonce?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (tier === 'strict' && nonce && !isDevelopment) {
    return joinDirective('style-src', ["'self'", `'nonce-${nonce}'`, ...STYLE_SOURCES]);
  }

  return joinDirective('style-src', ["'self'", "'unsafe-inline'", ...STYLE_SOURCES]);
}

export function buildCspHeader({ nonce, reportUri, tier }: BuildCspOptions) {
  const directives = [
    "default-src 'self'",
    getScriptDirective(tier, nonce),
    getStyleDirective(tier, nonce),
    joinDirective('img-src', ["'self'", ...IMG_SOURCES]),
    joinDirective('font-src', ["'self'", ...FONT_SOURCES]),
    joinDirective('connect-src', ["'self'", ...CONNECT_SOURCES, ...getDevConnectSources()]),
    joinDirective('frame-src', ["'self'", ...FRAME_SOURCES]),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  if (reportUri) {
    directives.push(joinDirective('report-uri', [reportUri]));
  }

  return directives.join('; ');
}

export function getCspResponseHeaderName() {
  return process.env.CSP_REPORT_ONLY === 'true'
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
