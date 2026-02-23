'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './forms.module.css';

type Address = {
  address_line_1: string;
  address_line_2?: string | null;
  locality: string;
  county: string;
  eircode: string;
};

export default function ProfileAddressForm({ initialAddress }: { initialAddress?: Address | null }) {
  const t = useTranslations('profile');
  const [addressLine1, setAddressLine1] = useState(initialAddress?.address_line_1 ?? '');
  const [addressLine2, setAddressLine2] = useState(initialAddress?.address_line_2 ?? '');
  const [locality, setLocality] = useState(initialAddress?.locality ?? '');
  const [county, setCounty] = useState(initialAddress?.county ?? '');
  const [eircode, setEircode] = useState(initialAddress?.eircode ?? '');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setIsPending(true);

    const response = await fetch('/api/profile/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        locality,
        county,
        eircode,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || t('addressSaveError'));
      return;
    }

    setFeedback(t('addressSaved'));
  };

  return (
    <form onSubmit={onSubmit} className={styles.card}>
      <h3 className={styles.title}>{t('addressTitle')}</h3>
      {feedback ? <p className={`${styles.feedback} ${styles.ok}`}>{feedback}</p> : null}
      {error ? <p className={`${styles.feedback} ${styles.error}`}>{error}</p> : null}
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span>{t('addressLine1')}</span>
          <input className={styles.input} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('addressLine2')}</span>
          <input className={styles.input} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('locality')}</span>
          <input className={styles.input} value={locality} onChange={(e) => setLocality(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('county')}</span>
          <input className={styles.input} value={county} onChange={(e) => setCounty(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>{t('eircode')}</span>
          <input className={styles.input} value={eircode} onChange={(e) => setEircode(e.target.value)} />
        </label>
      </div>
      <div className={styles.buttonRow}>
        <button type="submit" disabled={isPending} className={styles.primary}>
        {isPending ? t('saving') : t('saveAddress')}
        </button>
      </div>
    </form>
  );
}
