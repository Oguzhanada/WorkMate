"use client";

import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function TermsPage() {
  const t = useTranslations('legal');

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>{t('termsTitle')}</h1>
          <p className={styles.muted}>{t('lastUpdated')}</p>
          <p className={styles.muted}>{t('termsBody')}</p>
        </article>
      </div>
    </main>
  );
}
