import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {Toaster} from 'sonner';

import CookieConsent from '@/components/ui/CookieConsent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import ConditionalSiteFooter from '@/components/site/ConditionalSiteFooter';
import Navbar from '@/components/home/Navbar';
import styles from '@/components/site/site.module.css';
import {type Locale} from '@/i18n/config';
import {loadMessages, isValidLocale} from '@/lib/i18n';

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
      <GoogleAnalytics />
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
