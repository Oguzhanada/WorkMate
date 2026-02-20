"use client";

import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function CookiePolicyPage() {
  const t = useTranslations('legal');

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>{t('cookieTitle')}</h1>
          <p className={styles.muted}>{t('lastUpdated')}</p>
          <p className={styles.muted}>{t('cookieBody')}</p>
        </article>
      </div>
    </main>
  );
}
