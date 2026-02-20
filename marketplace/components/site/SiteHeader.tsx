"use client";

import Link from 'next/link';
import {useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import LanguageSwitcher from './LanguageSwitcher';
import styles from './site.module.css';

const navItems = [
  {key: 'cleaning', href: '/hizmet/ev-temizligi'},
  {key: 'renovation', href: '/hizmet/boya-badana'},
  {key: 'moving', href: '/hizmet/nakliyat'},
  {key: 'repair', href: '/hizmet/klima-servisi'},
  {key: 'tutoring', href: '/arama?q=tutoring'},
  {key: 'events', href: '/arama?q=events'},
  {key: 'other', href: '/arama?q=home'}
] as const;

export default function SiteHeader() {
  const locale = useLocale();
  const t = useTranslations('header');
  const common = useTranslations('common');
  const [menuOpen, setMenuOpen] = useState(false);

  const localized = (path: string) => `/${locale}${path}`;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerBar}>
          <Link href={localized('/')} className={styles.logo} aria-label="ADA">
            <span className={styles.logoPill}>ADA</span>
          </Link>

          <button
            className={styles.mobileMenuButton}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <i className="fa-solid fa-bars" />
          </button>

          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
            {navItems.map((item) => (
              <Link key={item.key} href={localized(item.href)} onClick={() => setMenuOpen(false)}>
                {t(`menu.${item.key}`)}
              </Link>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link href={localized('/hizmet-ver')} className={`${styles.primaryButton} ${styles.desktopAction}`}>
              {t('becomePro')}
            </Link>
            <Link href={localized('/giris')} className={`${styles.linkButton} ${styles.desktopAction}`}>
              {t('login')}
            </Link>
            <Link href={localized('/about')} className={`${styles.linkButton} ${styles.desktopAction}`}>
              {t('help')}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>

        <div className={styles.trustBar}>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-circle-check" />
            {common('trusted')}
          </span>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-lock" />
            {common('secure')}
          </span>
          <span className={styles.trustItem}>
            <i className="fa-solid fa-shield" />
            {common('guarantee')}
          </span>
        </div>
      </div>
    </header>
  );
}
