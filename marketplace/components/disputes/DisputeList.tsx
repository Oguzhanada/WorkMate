'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './disputes.module.css';

type DisputeListItem = {
  id: string;
  job_id: string;
  status: string;
  dispute_type: string;
  payment_status: string;
  resolution_deadline: string;
  created_at: string;
};

export default function DisputeList() {
  const [items, setItems] = useState<DisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch('/api/disputes/user', { cache: 'no-store' });
      const payload = await response.json();
      setLoading(false);
      if (!response.ok) {
        setError(payload.error || 'Disputes could not be loaded.');
        return;
      }
      setItems(payload.disputes ?? []);
    };
    load();
  }, []);

  return (
    <section className={styles.wrap}>
      <h2>Disputes</h2>
      <p className={styles.muted}>Track dispute status and admin decisions.</p>
      {loading ? <p className={styles.muted}>Loading...</p> : null}
      {error ? <p className={styles.feedback}>{error}</p> : null}
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.id} className={styles.row}>
            <div>
              <p><strong>Job:</strong> {item.job_id.slice(0, 8)}</p>
              <p className={styles.muted}>Type: {item.dispute_type}</p>
              <p className={styles.muted}>Status: {item.status} • Payment: {item.payment_status}</p>
              <p className={styles.muted}>Deadline: {new Date(item.resolution_deadline).toLocaleDateString('en-IE')}</p>
            </div>
            <Link href={`./${item.id}`} className={styles.primary}>Open</Link>
          </article>
        ))}
      </div>
      {items.length === 0 && !loading ? <p className={styles.muted}>No disputes yet.</p> : null}
    </section>
  );
}
