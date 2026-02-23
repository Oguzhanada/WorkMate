"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '../inner.module.css';

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('login');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsSessionReady(Boolean(data.session));
    });
  }, []);

  const checks = {
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isStrong = Object.values(checks).every(Boolean);
  const score = Math.round((Object.values(checks).filter(Boolean).length / 5) * 100);
  const strengthColor = score < 40 ? '#e67e22' : score < 80 ? '#f1c40f' : '#22a55c';

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isSessionReady) {
      setError(t('resetSessionMissing'));
      return;
    }

    if (!isStrong) {
      setError(t('errors.passwordRules'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordMatch'));
      return;
    }

    setIsPending(true);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(t('resetSuccess'));
    setTimeout(() => {
      router.push(`/${locale}/giris`);
      router.refresh();
    }, 1000);
  };

  return (
    <main className={styles.formWrap}>
      <h1 className={styles.formTitle}>{t('resetTitle')}</h1>
      <p className={styles.muted}>{t('resetSubtitle')}</p>
      {!isSessionReady ? <div className={styles.error}>{t('resetSessionMissing')}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.toast}>{success}</div> : null}

      <form onSubmit={onSubmit}>
        <label className={styles.field}>
          <span>{t('newPassword')}</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('confirmNewPassword')}</span>
          <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>

        <div className={styles.passwordPanel}>
          <p className={styles.strengthHead}>{t('passwordRules.strength', { score })}</p>
          <div className={styles.strengthTrack}>
            <div
              className={styles.strengthFill}
              style={{ width: `${score}%`, backgroundColor: strengthColor }}
            />
          </div>
          <ul className={styles.ruleList}>
            <li className={`${styles.ruleItem} ${checks.minLength ? styles.ruleOk : ''}`}>
              <i className={`fa-solid ${checks.minLength ? 'fa-check' : 'fa-circle'}`} />
              {t('passwordRules.minLength')}
            </li>
            <li className={`${styles.ruleItem} ${checks.lower ? styles.ruleOk : ''}`}>
              <i className={`fa-solid ${checks.lower ? 'fa-check' : 'fa-circle'}`} />
              {t('passwordRules.lower')}
            </li>
            <li className={`${styles.ruleItem} ${checks.upper ? styles.ruleOk : ''}`}>
              <i className={`fa-solid ${checks.upper ? 'fa-check' : 'fa-circle'}`} />
              {t('passwordRules.upper')}
            </li>
            <li className={`${styles.ruleItem} ${checks.number ? styles.ruleOk : ''}`}>
              <i className={`fa-solid ${checks.number ? 'fa-check' : 'fa-circle'}`} />
              {t('passwordRules.number')}
            </li>
            <li className={`${styles.ruleItem} ${checks.special ? styles.ruleOk : ''}`}>
              <i className={`fa-solid ${checks.special ? 'fa-check' : 'fa-circle'}`} />
              {t('passwordRules.special')}
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={isPending || !isSessionReady}>
            {isPending ? t('resetting') : t('resetPassword')}
          </button>
          <Link href={`/${locale}/giris`} className={styles.secondary}>
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </main>
  );
}
