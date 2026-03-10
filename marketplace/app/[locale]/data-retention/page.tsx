import type { Metadata } from 'next';
import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export const metadata: Metadata = {
  title: 'Data Retention Policy',
  description: 'How long WorkMate retains your personal data.',
};

export default function DataRetentionPage() {
  const t = useTranslations('retention');

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>{t('title')}</h1>
          <p className={styles.muted}>{t('subtitle')}</p>
          <p className={styles.muted}>{t('p1')}</p>
          <p className={styles.muted}>{t('p2')}</p>
          <p className={styles.muted}>{t('p3')}</p>
        </article>
      </div>
    </main>
  );
}
