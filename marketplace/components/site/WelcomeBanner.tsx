"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import styles from '@/app/[locale]/home.module.css';

export default function WelcomeBanner() {
  const params = useSearchParams();
  const t = useTranslations('home');
  const show = params.get('welcome') === '1';

  if (!show) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <article className={styles.providerBanner}>
          <div className={styles.providerContent}>
            <h2>{t('welcomeTitle')}</h2>
            <p>{t('welcomeSubtitle')}</p>
            <Link href="/post-job" className={styles.providerButton}>
              {t('welcomeCta')}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
