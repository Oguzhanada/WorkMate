"use client";

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './site.module.css';

const navItems = [
  {key: 'cleaning', href: '/hizmet/ev-temizligi'},
  {key: 'renovation', href: '/hizmet/boya-badana'},
  {key: 'moving', href: '/hizmet/nakliyat'},
  {key: 'repair', href: '/hizmet/klima-servisi'},
  {key: 'tutoring', href: '/arama?q=tutoring'},
  {key: 'events', href: '/arama?q=events'},
  {key: 'other', href: '/diger'}
] as const;

export default function SiteHeader() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('header');
  const common = useTranslations('common');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const localized = (path: string) => `/${locale}${path}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({data}) => {
      setIsAuthenticated(Boolean(data.user));
    });

    const {
      data: {subscription}
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(localized('/giris'));
    router.refresh();
  };

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
            {isAuthenticated ? (
              <>
                <Link href={localized('/profil')} className={`${styles.linkButton} ${styles.desktopAction}`}>
                  {t('profile')}
                </Link>
                <button type="button" onClick={logout} className={`${styles.linkButton} ${styles.desktopAction} ${styles.linkButtonPlain}`}>
                  {t('logout')}
                </button>
              </>
            ) : (
              <Link href={localized('/giris')} className={`${styles.linkButton} ${styles.desktopAction}`}>
                {t('login')}
              </Link>
            )}
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
