"use client";

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';

import styles from './site.module.css';

export default function SiteFooter() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const home = useTranslations('home');
  const header = useTranslations('header');

  const localized = (path: string) => `/${locale}${path}`;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <h4>{t('siteMap')}</h4>
            <Link href={localized('/about')}>{t('about')}</Link>
            <Link href={localized('/nasil-calisir')}>{t('how')}</Link>
            {/* Careers link is temporarily hidden until the page is ready. */}
            {/* <Link href={localized('/arama?q=careers')}>{t('careers')}</Link> */}
            <Link href={localized('/iletisim')}>{t('contact')}</Link>
            <Link href={localized('/sss')}>{t('faq')}</Link>
            <Link href={localized('/profil')}>{header('profile')}</Link>
          </div>
          <div>
            <h4>{t('topSearches')}</h4>
            <Link href={localized('/hizmet/ev-temizligi')}>{home('trend.homeCleaning')}</Link>
            <Link href={localized('/hizmet/boya-badana')}>{home('trend.painting')}</Link>
            <Link href={localized('/hizmet/nakliyat')}>{home('trend.moving')}</Link>
            <Link href={localized('/hizmet/klima-servisi')}>{home('trend.acRepair')}</Link>
          </div>
          <div>
            <h4>{t('social')}</h4>
            <div className={styles.socials}>
              <a href="#" aria-label="Instagram">
                <i className="fa-brands fa-instagram" />
              </a>
              <a href="#" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f" />
              </a>
              <a href="#" aria-label="LinkedIn">
                <i className="fa-brands fa-linkedin-in" />
              </a>
              <a href="#" aria-label="X">
                <i className="fa-brands fa-x-twitter" />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <label>
            {t('country')}:
            <select defaultValue="TR">
              <option value="TR">Turkiye</option>
              <option value="IE">Ireland</option>
              <option value="BR">Brasil</option>
              <option value="ES">Espana</option>
            </select>
          </label>

          <p>{t('copyright')}</p>

          <div className={styles.footerLegal}>
            <Link href={localized('/privacy-policy')}>{t('privacy')}</Link>
            <Link href={localized('/terms')}>{t('terms')}</Link>
            <Link href={localized('/cookie-policy')}>{t('cookie')}</Link>
            <Link href={localized('/data-retention')}>{t('retention')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
