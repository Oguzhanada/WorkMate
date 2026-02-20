import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function FaqPage() {
  const t = useTranslations('faqPage');

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <h1>{t('title')}</h1>
        <p className={styles.muted}>{t('subtitle')}</p>

        <section className={styles.faq}>
          <details>
            <summary>{t('q1')}</summary>
            <p className={styles.muted}>{t('a1')}</p>
          </details>
          <details>
            <summary>{t('q2')}</summary>
            <p className={styles.muted}>{t('a2')}</p>
          </details>
          <details>
            <summary>{t('q3')}</summary>
            <p className={styles.muted}>{t('a3')}</p>
          </details>
          <details>
            <summary>{t('q4')}</summary>
            <p className={styles.muted}>{t('a4')}</p>
          </details>
        </section>
      </div>
    </main>
  );
}
