'use client';

import styles from './profile-verification.module.css';

type Props = {
  value: 'document_upload' | 'stripe_identity';
  onChange: (value: 'document_upload' | 'stripe_identity') => void;
};

export default function IdentityMethodSelector({ value, onChange }: Props) {
  return (
    <div className={styles.fileRow}>
      <button
        type="button"
        className={value === 'document_upload' ? styles.secondary : styles.uploadInner}
        onClick={() => onChange('document_upload')}
      >
        Upload document
      </button>
      <button
        type="button"
        className={value === 'stripe_identity' ? styles.secondary : styles.uploadInner}
        onClick={() => onChange('stripe_identity')}
      >
        Stripe Identity
      </button>
    </div>
  );
}