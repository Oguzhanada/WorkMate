"use client";

import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {localeLabels, locales, type Locale} from '@/i18n/config';
import styles from './site.module.css';

export default function LanguageSwitcher() {
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segments = pathname.split('/').filter(Boolean);
  const activeLocale: Locale = locales.includes(segments[0] as Locale)
    ? (segments[0] as Locale)
    : 'en';

  const switchLocale = (nextLocale: Locale) => {
    const parts = pathname.split('/').filter(Boolean);

    if (parts.length > 0 && locales.includes(parts[0] as Locale)) {
      parts.shift();
    }

    const targetPath = `/${[nextLocale, ...parts].join('/')}`;
    const query = searchParams.toString();

    router.push(query ? `${targetPath}?${query}` : targetPath);
  };

  return (
    <select
      className={styles.switcher}
      value={activeLocale}
      aria-label={t('language')}
      onChange={(event) => switchLocale(event.target.value as Locale)}
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale]}
        </option>
      ))}
    </select>
  );
}
