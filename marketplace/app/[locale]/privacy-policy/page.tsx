"use client";

import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function PrivacyPolicyPage() {
  const t = useTranslations('legal');

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>{t('privacyTitle')}</h1>
          <p className={styles.muted}>{t('lastUpdated')}</p>
          <p className={styles.muted}>{t('privacyBody')}</p>
        </article>
      </div>
    </main>
  );
}
