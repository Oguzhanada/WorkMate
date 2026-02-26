'use client';

import styles from './disputes.module.css';

export default function DisputeAlert({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={styles.wrap}>
      <p className={styles.badge}>Dispute alert</p>
      <p className={styles.muted}>You have {count} active dispute(s). Please review and respond quickly.</p>
    </div>
  );
}