"use client";

import {FormEvent, useState} from 'react';
import {useTranslations} from 'next-intl';

import styles from '../inner.module.css';

type Mode = 'customer' | 'provider';

export default function SignupPage() {
  const t = useTranslations('signup');
  const [mode, setMode] = useState<Mode>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !phone || !city || !email || !password) {
      setError(t('errors.required'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors.password'));
      return;
    }

    if (mode === 'provider' && (!services || !region)) {
      setError(t('errors.services'));
      return;
    }

    setSuccess(mode === 'customer' ? t('successCustomer') : t('successProvider'));
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.toast}>{success}</div> : null}

      <div className={styles.tabRow}>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'customer' ? styles.activeTab : ''}`}
          onClick={() => setMode('customer')}
        >
          {t('customerTab')}
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${mode === 'provider' ? styles.activeTab : ''}`}
          onClick={() => setMode('provider')}
        >
          {t('providerTab')}
        </button>
      </div>

      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-apple" /> {t('apple')}
      </button>

      <form onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.name')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>{t('fields.phone')}</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.city')}</span>
            <input value={city} onChange={(event) => setCity(event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>{t('fields.email')}</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
        </div>

        <label className={styles.field}>
          <span>{t('fields.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {mode === 'provider' ? (
          <>
            <label className={styles.field}>
              <span>{t('fields.services')}</span>
              <input value={services} onChange={(event) => setServices(event.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{t('fields.region')}</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} />
            </label>
            <p className={styles.muted}>{t('verificationNote')}</p>
            <p className={styles.muted}>{t('bankInfoNote')}</p>
          </>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary}>
            {t('create')}
          </button>
        </div>
      </form>
    </main>
  );
}
