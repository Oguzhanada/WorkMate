'use client';

import { useState } from 'react';
import styles from './disputes.module.css';

type Props = {
  disputeId: string;
  maxAmountCents: number;
  onResolved?: () => void;
};

export default function DisputeResolutionModal({ disputeId, maxAmountCents, onResolved }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(Math.floor(maxAmountCents / 2));
  const [feedback, setFeedback] = useState('');

  const resolve = async (resolutionType: 'partial_refund' | 'full_refund' | 'full_payment') => {
    const payload = {
      status: 'resolved',
      resolution_type: resolutionType,
      resolution_amount_cents: resolutionType === 'partial_refund' ? amount : resolutionType === 'full_refund' ? maxAmountCents : maxAmountCents,
      admin_notes: 'Resolved from modal.',
    };

    const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setFeedback(data.error || 'Resolution failed.');
      return;
    }

    setFeedback('Dispute resolved.');
    setOpen(false);
    onResolved?.();
  };

  return (
    <>
      <button type="button" className={styles.secondary} onClick={() => setOpen(true)}>
        Resolve dispute
      </button>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h3>Resolve dispute</h3>
            <p className={styles.muted}>Set a partial amount for split/partial refund.</p>
            <label className={styles.field}>
              <span>Partial amount (EUR {(amount / 100).toFixed(2)})</span>
              <input
                type="range"
                min={1}
                max={Math.max(1, maxAmountCents)}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => resolve('full_payment')}>Release full</button>
              <button type="button" className={styles.secondary} onClick={() => resolve('partial_refund')}>Partial refund</button>
              <button type="button" className={styles.danger} onClick={() => resolve('full_refund')}>Full refund</button>
              <button type="button" className={styles.btn} onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}