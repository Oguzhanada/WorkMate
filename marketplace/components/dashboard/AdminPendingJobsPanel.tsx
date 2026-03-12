'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './admin-pending-jobs.module.css';

type PendingJob = {
  id: string;
  title: string;
  description?: string;
  category: string;
  county: string | null;
  locality: string | null;
  budget_range: string;
  status: string;
  review_status: 'pending_review' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  customer_id: string;
  customer_name: string | null;
  photo_urls?: string[];
};

export default function AdminPendingJobsPanel() {
  const [items, setItems] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [active, setActive] = useState<PendingJob | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/pending-jobs', { cache: 'no-store' });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Pending jobs could not be loaded.');
      return;
    }

    setFeedback('');
    setItems(payload.jobs ?? []);
  }, []);

  const approve = async (jobId: string) => {
    const response = await fetch(`/api/admin/jobs/${jobId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Approved by admin' }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Approval failed.');
      return;
    }
    setFeedback('Job approved and published.');
    setItems((current) => current.filter((item) => item.id !== jobId));
    setActive(null);
  };

  const reject = async () => {
    if (!active) return;
    if (!reason.trim()) {
      setFeedback('Rejection reason is required.');
      return;
    }

    const response = await fetch(`/api/admin/jobs/${active.id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: reason.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || 'Rejection failed.');
      return;
    }

    setFeedback('Job rejected with reason.');
    setItems((current) => current.filter((item) => item.id !== active.id));
    setActive(null);
    setReason('');
  };

  const pendingCount = useMemo(() => items.length, [items]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; };
  }, [load]);

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3>Pending Job Reviews</h3>
          <p className={styles.muted}>Admin review queue for job publishing.</p>
        </div>
        <button type="button" className={styles.btn} onClick={load}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <p className={styles.badge}>Pending: {pendingCount}</p>
      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Budget</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.customer_name ?? item.customer_id.slice(0, 8)}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
                <td>{item.locality ?? '-'}, {item.county ?? '-'}</td>
                <td>{item.budget_range}</td>
                <td>{new Date(item.created_at).toLocaleDateString('en-IE')}</td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.approve} onClick={() => approve(item.id)}>
                      Approve
                    </button>
                    <button type="button" className={styles.reject} onClick={() => setActive(item)}>
                      Reject
                    </button>
                    <button type="button" className={styles.secondary} onClick={() => setActive(item)}>
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.empty}>No pending jobs.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {active ? (
        <div className={styles.overlay} onClick={() => setActive(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <h4>{active.title}</h4>
            <p className={styles.muted}>{active.category} • {active.locality ?? '-'}, {active.county ?? '-'}</p>
            <p className={styles.muted}>Budget: {active.budget_range}</p>
            {active.description ? (
              <p className={styles.muted} style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{active.description}</p>
            ) : null}
            {active.photo_urls && active.photo_urls.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {active.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Job photo ${i + 1}`}
                    style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--wm-border)', cursor: 'pointer' }}
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            ) : null}
            <label className={styles.field}>
              <span>Rejection reason (required for reject)</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain what should be fixed before publishing"
                rows={4}
              />
            </label>
            <div className={styles.actions}>
              <button type="button" className={styles.approve} onClick={() => approve(active.id)}>
                Approve
              </button>
              <button type="button" className={styles.reject} onClick={reject}>
                Reject with reason
              </button>
              <button type="button" className={styles.secondary} onClick={() => setActive(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
