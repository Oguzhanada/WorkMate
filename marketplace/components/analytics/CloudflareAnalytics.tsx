'use client';

import Script from 'next/script';

/**
 * Cloudflare Web Analytics
 *
 * Privacy-first, cookie-free analytics with no GDPR consent requirement.
 * Runs alongside Google Analytics — shows real user visits, page views,
 * Core Web Vitals, and country breakdowns without PII.
 *
 * Dashboard: dash.cloudflare.com → Analytics & Logs → Web Analytics
 *
 * Env var (public):
 *   NEXT_PUBLIC_CF_ANALYTICS_TOKEN — the "JS snippet" token from CF dashboard
 *
 * If not configured, this component renders nothing.
 */
export default function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  if (!token) return null;

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}
