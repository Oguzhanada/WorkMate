'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from '@/app/[locale]/inner.module.css';

export default function DeleteAccountPanel() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const deleteAccount = async () => {
    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) return;

    setError('');
    setFeedback('');
    setIsPending(true);

    const response = await fetch('/api/account/delete', { method: 'POST' });
    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || t('deleteError'));
      return;
    }

    setFeedback(t('deleteSuccess'));
    setTimeout(() => {
      router.push(`/login`);
      router.refresh();
    }, 800);
  };

  return (
    <section className={styles.card}>
      <h2>{t('privacyActionsTitle')}</h2>
      <p className={styles.muted}>{t('deleteHint')}</p>
      {feedback ? <div className={styles.toast}>{feedback}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      <button
        type="button"
        className={styles.secondary}
        onClick={deleteAccount}
        disabled={isPending}
      >
        {isPending ? t('deleting') : t('deleteMyData')}
      </button>
    </section>
  );
}

