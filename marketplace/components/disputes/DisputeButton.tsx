'use client';

import { useState } from 'react';
import styles from './disputes.module.css';

type Props = {
  jobId: string;
  disabled?: boolean;
};

const TYPE_OPTIONS = [
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'non_completion', label: 'Non completion' },
  { value: 'damage', label: 'Damage' },
  { value: 'no_show', label: 'No show' },
  { value: 'other', label: 'Other' },
] as const;

export default function DisputeButton({ jobId, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]['value']>('quality_issue');
  const [claim, setClaim] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isPending, setIsPending] = useState(false);

  const submit = async () => {
    setIsPending(true);
    setFeedback('');

    const response = await fetch('/api/disputes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        dispute_type: type,
        customer_claim: claim,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Dispute could not be created.');
      return;
    }

    setFeedback('Dispute created successfully.');
    setOpen(false);
    setClaim('');
  };

  return (
    <>
      <button type="button" className={styles.danger} onClick={() => setOpen(true)} disabled={disabled}>
        Report issue
      </button>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Open dispute</h3>
            <p className={styles.muted}>Explain the issue clearly for admin review.</p>
            <label className={styles.field}>
              <span>Dispute type</span>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                {TYPE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Your claim</span>
              <textarea
                value={claim}
                onChange={(event) => setClaim(event.target.value)}
                rows={5}
                placeholder="Describe what happened"
              />
            </label>
            <div className={styles.row}>
              <button type="button" className={styles.primary} onClick={submit} disabled={isPending || claim.trim().length < 10}>
                {isPending ? 'Submitting...' : 'Submit dispute'}
              </button>
              <button type="button" className={styles.btn} onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}