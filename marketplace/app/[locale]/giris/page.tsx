"use client";

import Link from 'next/link';
import {FormEvent, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import styles from '../inner.module.css';

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors.shortPassword'));
      return;
    }

    setSuccess(t('success'));
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.toast}>{success}</div> : null}

      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-apple" /> {t('apple')}
      </button>

      <form onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('email')}</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className={styles.field}>
          <span>{t('password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary}>
            {t('login')}
          </button>
        </div>
      </form>

      <p>
        {t('noAccount')} <Link href={`/${locale}/uye-ol`}>{t('signupLink')}</Link>
      </p>
    </main>
  );
}
