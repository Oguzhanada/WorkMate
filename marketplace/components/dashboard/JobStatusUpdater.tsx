'use client';

import { useState } from 'react';
import styles from './dashboard.module.css';

const statusOptions = [
  'open',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export default function JobStatusUpdater({
  jobId,
  initialStatus,
}: {
  jobId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);

  const updateStatus = async () => {
    setIsPending(true);
    setFeedback('');

    const response = await fetch(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Status could not be updated.');
      return;
    }

    setFeedback(`Status updated: ${payload.job.status}`);
  };

  return (
    <div className={styles.card}>
      <p className={styles.meta}>Job status</p>
      <div className={styles.buttons}>
        <select className={styles.input} value={status} onChange={(event) => setStatus(event.target.value)}>
          {statusOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="button" className={styles.primary} onClick={updateStatus} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save status'}
        </button>
      </div>
      {feedback ? <p className={styles.meta}>{feedback}</p> : null}
    </div>
  );
}
