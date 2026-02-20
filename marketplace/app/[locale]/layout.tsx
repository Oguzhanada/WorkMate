import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';

import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import styles from '@/components/site/site.module.css';
import {type Locale} from '@/i18n/config';
import {loadMessages, isValidLocale} from '@/lib/i18n';

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
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
