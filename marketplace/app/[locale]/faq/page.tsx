import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function FaqPage() {
  const t = useTranslations('faqPage');
  const items = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
  ] as const;

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <h1>{t('title')}</h1>
        <p className={styles.muted}>{t('subtitle')}</p>

        <section className={styles.faq}>
          {items.map((item) => (
            <details key={item}>
              <summary>{t(`q${item}`)}</summary>
              <p className={styles.muted}>{t(`a${item}`)}</p>
            </details>
          ))}
        </section>
      </div>
    </main>
  );
}
