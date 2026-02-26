'use client';

import styles from './auto-release.module.css';

export default function AutoReleaseCountdown({ autoReleaseAt }: { autoReleaseAt: string | null }) {
  if (!autoReleaseAt) return null;
  const remainingMs = new Date(autoReleaseAt).getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  return (
    <p className={styles.notice}>
      Payment will be auto-released in approximately {remainingDays} day(s) if no dispute is opened.
    </p>
  );
}