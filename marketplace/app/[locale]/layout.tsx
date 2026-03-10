import type {Metadata} from 'next';
import Script from 'next/script';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {Toaster} from 'sonner';

import CookieConsent from '@/components/ui/CookieConsent';
import ConditionalSiteFooter from '@/components/site/ConditionalSiteFooter';
import Navbar from '@/components/home/Navbar';
import styles from '@/components/site/site.module.css';
import {type Locale} from '@/i18n/config';
import {loadMessages, isValidLocale} from '@/lib/i18n';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const baseUrl = process.env.NEXT_PUBLIC_PLATFORM_BASE_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    return {};
  }

  const messages = await loadMessages(locale);
  const seo = messages.seo as Record<string, string>;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: seo.defaultTitle,
      template: `%s | ${seo.defaultTitle}`
    },
    description: seo.defaultDescription,
    alternates: {
      languages: {
        en: '/'
      }
    },
    openGraph: {
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      url: baseUrl,
      siteName: 'WorkMate',
      locale: 'en_IE',
      type: 'website',
      images: [
        {
          url: `/og?title=${encodeURIComponent(seo.defaultTitle)}&description=${encodeURIComponent(seo.defaultDescription)}`,
          width: 1200,
          height: 630,
          alt: seo.defaultTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: [`/og?title=${encodeURIComponent(seo.defaultTitle)}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await loadMessages(locale as Locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      <div className={styles.siteRoot}>
        <Navbar />
        {children}
        <CookieConsent />
        <ConditionalSiteFooter />
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </NextIntlClientProvider>
  );
}
