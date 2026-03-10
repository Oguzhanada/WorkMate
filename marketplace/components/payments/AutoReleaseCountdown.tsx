'use client';

import { useEffect, useState } from 'react';
import styles from './auto-release.module.css';

export default function AutoReleaseCountdown({ autoReleaseAt }: { autoReleaseAt: string | null }) {
  const [remainingDays, setRemainingDays] = useState<number | null>(null);

  useEffect(() => {
    if (!autoReleaseAt) return;
    const compute = () => {
      const remainingMs = new Date(autoReleaseAt).getTime() - Date.now();
      setRemainingDays(Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24))));
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, [autoReleaseAt]);

  if (!autoReleaseAt || remainingDays === null) return null;

  return (
    <p className={styles.notice}>
      Payment will be auto-released in approximately {remainingDays} day(s) if no dispute is opened.
    </p>
  );
}