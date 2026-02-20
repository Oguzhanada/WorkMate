"use client";

import {useActionState, useState} from 'react';
import {useTranslations} from 'next-intl';

import {initialAuthFormState, signupAction} from '@/lib/auth-actions';
import styles from '../inner.module.css';

type Mode = 'customer' | 'provider';

export default function SignupPage() {
  const t = useTranslations('signup');
  const [mode, setMode] = useState<Mode>('customer');
  const [state, formAction, isPending] = useActionState(signupAction, initialAuthFormState);

  const errorMessage =
    state.status === 'error'
      ? state.code === 'invalid_email'
        ? t('errors.invalidEmail')
        : state.code === 'short_password'
          ? t('errors.password')
          : state.code === 'services_required'
            ? t('errors.services')
            : t('errors.required')
      : '';
  const successMessage =
    state.status === 'success'
      ? state.code === 'success_provider'
        ? t('successProvider')
        : t('successCustomer')
      : '';

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
      {successMessage ? <div className={styles.toast}>{successMessage}</div> : null}

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

      <form action={formAction}>
        <input type="hidden" name="mode" value={mode} />
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.name')}</span>
            <input name="name" />
          </label>

          <label className={styles.field}>
            <span>{t('fields.phone')}</span>
            <input name="phone" />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.city')}</span>
            <input name="city" />
          </label>

          <label className={styles.field}>
            <span>{t('fields.email')}</span>
            <input name="email" />
          </label>
        </div>

        <label className={styles.field}>
          <span>{t('fields.password')}</span>
          <input type="password" name="password" />
        </label>

        {mode === 'provider' ? (
          <>
            <label className={styles.field}>
              <span>{t('fields.services')}</span>
              <input name="services" />
            </label>
            <label className={styles.field}>
              <span>{t('fields.region')}</span>
              <input name="region" />
            </label>
            <p className={styles.muted}>{t('verificationNote')}</p>
            <p className={styles.muted}>{t('bankInfoNote')}</p>
          </>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending}>
            {t('create')}
          </button>
        </div>
      </form>
    </main>
  );
}
