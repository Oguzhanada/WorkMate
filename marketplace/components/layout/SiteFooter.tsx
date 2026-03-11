"use client";

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {getLocaleRoot, withLocalePrefix} from '@/lib/i18n/locale-path';
import WorkMateLogo from '@/components/ui/WorkMateLogo';

import styles from './site.module.css';

export default function SiteFooter() {
  const t = useTranslations('footer');
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const localized = (path: string) => withLocalePrefix(localeRoot, path);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandRow}>
              <WorkMateLogo size={42} />
              <h4>WorkMate</h4>
            </div>
            <p>
              Connecting Irish homeowners with trusted local professionals.
            </p>
          </div>
          <div>
            <h4>For Customers</h4>
            <Link href={localized('/find-services')}>Browse Services</Link>
            <Link href={localized('/post-job')}>Post a Job</Link>
            <Link href={localized('/pricing')}>Pricing</Link>
            <Link href={localized('/how-it-works')}>{t('how')}</Link>
            <Link href={localized('/faq')}>{t('faq')}</Link>
          </div>
          <div>
            <h4>For Professionals</h4>
            <Link href={localized('/become-provider')}>Become a Pro</Link>
            <Link href={localized('/founding-pro')}>Founding Pro</Link>
            <Link href={localized('/providers')}>Find Opportunities</Link>
            <Link href={localized('/dashboard/pro')}>Pro Dashboard</Link>
            <Link href={localized('/login')}>Pro Login</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href={localized('/about')}>{t('about')}</Link>
            <Link href={localized('/contact')}>{t('contact')}</Link>
            <Link href={localized('/privacy')}>{t('privacy')}</Link>
            <Link href={localized('/terms')}>{t('terms')}</Link>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>{t('copyright')}</p>

          <div className={styles.footerLegal}>
            <Link href={localized('/community-guidelines')}>Community Guidelines</Link>
            <Link href={localized('/cookie-policy')}>{t('cookie')}</Link>
            <Link href={localized('/data-retention')}>{t('retention')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

