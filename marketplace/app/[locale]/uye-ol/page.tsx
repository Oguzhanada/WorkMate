"use client";

import {FormEvent, useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import styles from '../inner.module.css';

type Mode = 'customer' | 'provider';

export default function SignupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('signup');

  const [mode, setMode] = useState<Mode>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState('');
  const [region, setRegion] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({data}) => {
      if (data.user) {
        router.replace(`/${locale}/profil`);
      }
    });
  }, [locale, router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (!name || !phone || !city || !email || !password) {
      setErrorMessage(t('errors.required'));
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMessage(t('errors.invalidEmail'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('errors.password'));
      return;
    }

    if (mode === 'provider' && (!services || !region)) {
      setErrorMessage(t('errors.services'));
      return;
    }

    setIsPending(true);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/${locale}/profil`;

    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: name,
          phone,
          city,
          role: mode === 'provider' ? 'verified_pro' : 'customer'
        }
      }
    });

    if (error) {
      setIsPending(false);
      setErrorMessage(error.message);
      return;
    }

    if (!data.session) {
      setIsPending(false);
      router.push(`/${locale}/giris`);
      return;
    }

    setIsPending(false);
    router.push(`/${locale}/profil`);
    router.refresh();
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('title')}</h1>
      <p className={styles.muted}>{t('subtitle')}</p>

      {errorMessage ? <div className={styles.error}>{errorMessage}</div> : null}

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

      <button className={styles.oauthButton} type="button" disabled>
        <i className="fa-brands fa-google" /> {t('google')}
      </button>
      <button className={styles.oauthButton} type="button" disabled>
        <i className="fa-brands fa-apple" /> {t('apple')}
      </button>

      <form onSubmit={onSubmit}>
        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.name')}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} name="name" />
          </label>

          <label className={styles.field}>
            <span>{t('fields.phone')}</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} name="phone" />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.field}>
            <span>{t('fields.city')}</span>
            <input value={city} onChange={(event) => setCity(event.target.value)} name="city" />
          </label>

          <label className={styles.field}>
            <span>{t('fields.email')}</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" />
          </label>
        </div>

        <label className={styles.field}>
          <span>{t('fields.password')}</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            name="password"
          />
        </label>

        {mode === 'provider' ? (
          <>
            <label className={styles.field}>
              <span>{t('fields.services')}</span>
              <input value={services} onChange={(event) => setServices(event.target.value)} name="services" />
            </label>
            <label className={styles.field}>
              <span>{t('fields.region')}</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} name="region" />
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
