'use client';

import { useCallback, useEffect, useState } from 'react';
import DisputeResolutionModal from './DisputeResolutionModal';
import styles from './disputes.module.css';

type DisputeDetailData = {
  dispute: {
    id: string;
    job_id: string;
    status: string;
    dispute_type: string;
    customer_claim: string;
    provider_response: string | null;
    admin_notes: string | null;
    payment_status: string;
  };
  logs: Array<{
    id: string;
    created_at: string;
    actor_role: string;
    action: string;
  }>;
  evidence: Array<{
    id: string;
    uploaded_at: string;
    file_url: string;
    file_type: string;
    description: string | null;
  }>;
};

export default function DisputeDetail({ disputeId }: { disputeId: string }) {
  const [data, setData] = useState<DisputeDetailData | null>(null);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState('image/jpeg');

  const load = useCallback(async () => {
    const response = await fetch(`/api/disputes/${disputeId}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Dispute detail could not be loaded.');
      return;
    }
    setData(payload);
    setError('');
  }, [disputeId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitProviderResponse = async () => {
    const response = await fetch(`/api/disputes/${disputeId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: responseText }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Response could not be saved.');
      return;
    }
    setResponseText('');
    await load();
  };

  const addEvidence = async () => {
    const response = await fetch(`/api/disputes/${disputeId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_url: evidenceUrl,
        file_type: evidenceType,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Evidence could not be added.');
      return;
    }
    setEvidenceUrl('');
    await load();
  };

  return (
    <section className={styles.wrap}>
      <h2>Dispute detail</h2>
      {error ? <p className={styles.feedback}>{error}</p> : null}
      {!data ? <p className={styles.muted}>Loading...</p> : null}

      {data ? (
        <>
          <p className={styles.badge}>{data.dispute.status}</p>
          <p><strong>Type:</strong> {data.dispute.dispute_type}</p>
          <p><strong>Claim:</strong> {data.dispute.customer_claim}</p>
          <p><strong>Provider response:</strong> {data.dispute.provider_response ?? 'Not provided yet'}</p>
          <p><strong>Payment:</strong> {data.dispute.payment_status}</p>

          <div className={styles.field}>
            <span>Provider response</span>
            <textarea
              rows={4}
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
            />
            <button type="button" className={styles.primary} onClick={submitProviderResponse}>
              Submit response
            </button>
          </div>

          <div className={styles.field}>
            <span>Add evidence URL</span>
            <input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://..." />
            <input value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)} placeholder="image/jpeg" />
            <button type="button" className={styles.secondary} onClick={addEvidence}>Add evidence</button>
          </div>

          <h3>Evidence</h3>
          <div className={styles.grid}>
            {data.evidence.map((item) => (
              <article key={item.id} className={styles.row}>
                <div>
                  <a href={item.file_url} target="_blank" rel="noreferrer">Open file</a>
                  <p className={styles.muted}>{item.file_type} • {new Date(item.uploaded_at).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>

          <h3>Timeline</h3>
          <div className={styles.grid}>
            {data.logs.map((log) => (
              <article key={log.id} className={styles.row}>
                <p>{log.actor_role} • {log.action}</p>
                <p className={styles.muted}>{new Date(log.created_at).toLocaleString()}</p>
              </article>
            ))}
          </div>

          <DisputeResolutionModal disputeId={disputeId} maxAmountCents={150000} onResolved={load} />
        </>
      ) : null}
    </section>
  );
}
