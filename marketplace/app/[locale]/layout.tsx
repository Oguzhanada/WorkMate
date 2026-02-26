import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';

import CookieConsentBanner from '@/components/site/CookieConsentBanner';
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
    }
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
      <div className={styles.siteRoot}>
        <Navbar />
        {children}
        <CookieConsentBanner />
        <ConditionalSiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
