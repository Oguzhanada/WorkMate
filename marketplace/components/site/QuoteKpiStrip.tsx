'use client';

import { useEffect, useState } from 'react';
import styles from './site.module.css';

type QuoteKpi = {
  jobs_last_24h: number;
  jobs_with_3to5_quotes: number;
  jobs_with_3plus_quotes: number;
  first_quote_median_minutes: number | null;
};

export default function QuoteKpiStrip() {
  const [kpi, setKpi] = useState<QuoteKpi | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/metrics/quotes', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) return;
      setKpi(payload);
    }
    load();
  }, []);

  if (!kpi || kpi.jobs_last_24h === 0) return null;

  const ratio3to5 = Math.round((kpi.jobs_with_3to5_quotes / kpi.jobs_last_24h) * 100);
  const ratio3plus = Math.round((kpi.jobs_with_3plus_quotes / kpi.jobs_last_24h) * 100);

  return (
    <section className={styles.kpiStrip}>
      <div className={styles.container}>
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <strong>{kpi.jobs_last_24h}</strong>
            <span>Jobs posted in last 24h</span>
          </div>
          <div className={styles.kpiCard}>
            <strong>%{ratio3to5}</strong>
            <span>Listings with 3-5 quotes</span>
          </div>
          <div className={styles.kpiCard}>
            <strong>%{ratio3plus}</strong>
            <span>Listings with 3+ quotes</span>
          </div>
          <div className={styles.kpiCard}>
            <strong>{kpi.first_quote_median_minutes ?? '-'}</strong>
            <span>Median first quote (min)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
