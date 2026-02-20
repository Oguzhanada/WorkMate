"use client";

import Link from 'next/link';
import {useActionState} from 'react';
import {useLocale, useTranslations} from 'next-intl';

import {initialAuthFormState, loginAction} from '@/lib/auth-actions';
import styles from '../inner.module.css';

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations('login');
  const [state, formAction, isPending] = useActionState(loginAction, initialAuthFormState);

  const errorMessage =
    state.status === 'error'
      ? state.code === 'invalid_email'
        ? t('errors.invalidEmail')
        : t('errors.shortPassword')
      : '';
  const successMessage = state.status === 'success' ? t('success') : '';

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}
      {successMessage ? <div className={styles.toast}>{successMessage}</div> : null}

      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button className={styles.oauthButton} type="button">
        <i className="fa-brands fa-apple" /> {t('apple')}
      </button>

      <form action={formAction}>
        <label className={styles.field}>
          <span>{t('email')}</span>
          <input name="email" />
        </label>

        <label className={styles.field}>
          <span>{t('password')}</span>
          <input type="password" name="password" />
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending}>
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
