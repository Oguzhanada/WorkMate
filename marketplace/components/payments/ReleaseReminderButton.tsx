'use client';

import { useState } from 'react';
import styles from './auto-release.module.css';

export default function ReleaseReminderButton({ jobId }: { jobId: string }) {
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);

  const sendReminder = async () => {
    setIsPending(true);
    setFeedback('');
    const response = await fetch(`/api/jobs/${jobId}/remind-release`, { method: 'POST' });
    const payload = await response.json();
    setIsPending(false);
    if (!response.ok) {
      setFeedback(payload.error || 'Reminder could not be sent.');
      return;
    }
    setFeedback('Reminder sent to customer.');
  };

  return (
    <div>
      <button type="button" className={styles.btn} onClick={sendReminder} disabled={isPending}>
        {isPending ? 'Sending...' : 'Send payment reminder'}
      </button>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </div>
  );
}