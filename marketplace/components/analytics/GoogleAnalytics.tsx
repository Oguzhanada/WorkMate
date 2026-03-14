'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { isStrictCspPath } from '@/lib/security/csp-routes';

const STORAGE_KEY = 'wm_cookie_consent';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Consent-aware GA4 loader.
 *
 * Reads cookie consent from localStorage and only loads the GA4 script
 * when analytics consent is explicitly granted. Re-checks on storage
 * events (cross-tab consent changes) and polls briefly after mount
 * to catch same-tab consent updates from CookieConsent component.
 */
export default function GoogleAnalytics() {
  const [consented, setConsented] = useState(false);
  const pathname = usePathname();
  const shouldSkipAnalytics = isStrictCspPath(pathname ?? '/');

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || shouldSkipAnalytics) return;

    function checkConsent() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const prefs = JSON.parse(raw);
        return prefs?.analytics === true;
      } catch {
        return false;
      }
    }

    // Initial check — use queueMicrotask to avoid setState in effect body
    queueMicrotask(() => setConsented(checkConsent()));

    // Listen for cross-tab consent changes
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        queueMicrotask(() => setConsented(checkConsent()));
      }
    }
    window.addEventListener('storage', onStorage);

    // Poll briefly to catch same-tab consent changes from CookieConsent
    // (localStorage doesn't fire storage events in the same tab)
    const interval = setInterval(() => {
      queueMicrotask(() => setConsented(checkConsent()));
    }, 2000);

    // Stop polling after 5 minutes (consent decision should be made by then)
    const timeout = setTimeout(() => clearInterval(interval), 300_000);

    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [shouldSkipAnalytics]);

  if (!GA_MEASUREMENT_ID || !consented || shouldSkipAnalytics) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
      onLoad={() => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = (...args: unknown[]) => {
          window.dataLayer?.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
      }}
    />
  );
}
