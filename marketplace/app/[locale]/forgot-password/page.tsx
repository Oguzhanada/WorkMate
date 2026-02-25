"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '../inner.module.css';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations('login');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    setIsPending(true);
    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setIsPending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(t('resetMailSent'));
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('forgotTitle')}</h1>
      <p className={styles.muted}>{t('forgotSubtitle')}</p>
      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.toast}>{success}</div> : null}
      <form onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('email')}</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending}>
            {isPending ? t('sendingReset') : t('sendReset')}
          </button>
          <Link href={`/login`} className={styles.secondary}>
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </main>
  );
}

