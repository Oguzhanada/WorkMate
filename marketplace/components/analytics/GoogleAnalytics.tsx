'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

const STORAGE_KEY = 'wm_cookie_consent';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

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
  }, []);

  if (!GA_MEASUREMENT_ID || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
