"use client";

import Link from 'next/link';
import {FormEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import styles from '../inner.module.css';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [oauthPending, setOauthPending] = useState<'' | 'google' | 'facebook'>('');

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({data}) => {
      if (data.user) {
        router.replace(`/profile`);
      }
    });
  }, [locale, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage(t('errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('errors.shortPassword'));
      return;
    }

    setIsPending(true);

    const supabase = getSupabaseBrowserClient();
    const {error} = await supabase.auth.signInWithPassword({email, password});

    setIsPending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push(`/?welcome=1`);
    router.refresh();
  };

  const loginWithOAuth = async (provider: 'google' | 'facebook') => {
    setErrorMessage('');
    setOauthPending(provider);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/?welcome=1`;
    const {error} = await supabase.auth.signInWithOAuth({
      provider,
      options: {redirectTo}
    });

    if (error) {
      setOauthPending('');
      setErrorMessage(error.message);
    }
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

      <button
        className={styles.oauthButton}
        type="button"
        onClick={() => loginWithOAuth('google')}
        disabled={Boolean(oauthPending)}
      >
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button
        className={styles.oauthButton}
        type="button"
        onClick={() => loginWithOAuth('facebook')}
        disabled={Boolean(oauthPending)}
      >
        <i className="fa-brands fa-facebook" /> {t('facebook')}
      </button>
      <p className={styles.muted}>{t('oauthInfo')}</p>

      <form onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('email')}</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
        </label>

        <label className={styles.field}>
          <span>{t('password')}</span>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <p>
          <Link href={`/forgot-password`}>{t('forgotLink')}</Link>
        </p>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending}>
            {t('login')}
          </button>
        </div>
      </form>

      <p>
        {t('noAccount')} <Link href={`/sign-up`}>{t('signupLink')}</Link>
      </p>
    </main>
  );
}

