"use client";

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function ContactPage() {
  const t = useTranslations('contact');
  const common = useTranslations('common');
  const [success, setSuccess] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSuccess(true);
  };

  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <h1>{t('title')}</h1>
        <p className={styles.muted}>{t('subtitle')}</p>

        <div className={styles.grid3}>
          <article className={styles.card}>
            <h3>{t('email')}</h3>
            <p className={styles.muted}>support@marketplace.example</p>
          </article>
          <article className={styles.card}>
            <h3>{t('phone')}</h3>
            <p className={styles.muted}>+353 1 555 1000</p>
          </article>
          <article className={styles.card}>
            <h3>{t('hours')}</h3>
            <p className={styles.muted}>Mon-Fri 09:00 - 18:00</p>
          </article>
        </div>

        <section className={styles.formWrap}>
          <h2>{t('formTitle')}</h2>
          {success ? <div className={styles.toast}>{t('success')}</div> : null}

          <form onSubmit={onSubmit}>
            <label className={styles.field}>
              <span>{t('name')}</span>
              <input required />
            </label>
            <label className={styles.field}>
              <span>{common('city')}</span>
              <input required />
            </label>
            <label className={styles.field}>
              <span>{t('message')}</span>
              <textarea rows={5} required />
            </label>
            <button type="submit" className={styles.primary}>
              {t('submit')}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
