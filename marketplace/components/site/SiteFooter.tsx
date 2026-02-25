"use client";

import Link from 'next/link';
import {useTranslations} from 'next-intl';

import styles from './site.module.css';

export default function SiteFooter() {
  const t = useTranslations('footer');
  const home = useTranslations('home');
  const header = useTranslations('header');

  const localized = (path: string) => path;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div>
            <h4>{t('siteMap')}</h4>
            <Link href={localized('/about')}>{t('about')}</Link>
            <Link href={localized('/how-it-works')}>{t('how')}</Link>
            <Link href={localized('/jobs')}>Jobs</Link>
            <Link href={localized('/providers')}>Providers</Link>
            {/* Careers link is temporarily hidden until the page is ready. */}
            {/* <Link href={localized('/search?q=careers')}>{t('careers')}</Link> */}
            <Link href={localized('/contact')}>{t('contact')}</Link>
            <Link href={localized('/faq')}>{t('faq')}</Link>
            <Link href={localized('/profile')}>{header('profile')}</Link>
          </div>
          <div>
            <h4>{t('topSearches')}</h4>
            <Link href={localized('/service/home-cleaning')}>{home('trend.homeCleaning')}</Link>
            <Link href={localized('/service/painting-decorating')}>{home('trend.painting')}</Link>
            <Link href={localized('/service/moving-services')}>{home('trend.moving')}</Link>
            <Link href={localized('/service/ac-service')}>{home('trend.acRepair')}</Link>
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

