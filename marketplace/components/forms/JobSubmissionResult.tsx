"use client";

import { useState } from 'react';
import Link from 'next/link';

import { JOB_BUDGET_OPTIONS } from '@/lib/constants/job';
import styles from './job-result.module.css';

type JobSummary = {
  id: string;
  title: string;
  description: string;
  eircode: string;
  county: string | null;
  locality: string | null;
  budget_range: (typeof JOB_BUDGET_OPTIONS)[number] | string;
  status: string;
  review_status: 'pending_review' | 'approved' | 'rejected' | string;
  created_at: string;
};

export default function JobSubmissionResult({ initialJob }: { initialJob: JobSummary }) {
  const [job, setJob] = useState(initialJob);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [form, setForm] = useState({
    title: initialJob.title,
    description: initialJob.description,
    eircode: initialJob.eircode,
    county: initialJob.county ?? '',
    locality: initialJob.locality ?? '',
    budget_range: initialJob.budget_range,
  });

  const onSave = async () => {
    setError('');
    setOk('');
    setIsSaving(true);

    const response = await fetch(`/api/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(payload.error || 'Could not update job summary.');
      return;
    }

    setJob(payload.job);
    setIsEditing(false);
    setOk('Job summary updated successfully.');
  };

  return (
    <main className={styles.wrap}>
      <article className={styles.card}>
        <h1>Job request submitted</h1>
        <p className={styles.muted}>
          Your request was received. It will be published after admin review.
        </p>

        <div className={styles.row}>
          <strong>Status:</strong> <span>{job.status}</span>
        </div>
        <div className={styles.row}>
          <strong>Review:</strong>{' '}
          <span>
            {job.review_status === 'pending_review'
              ? 'Pending admin approval'
              : job.review_status === 'approved'
              ? 'Published'
              : 'Rejected'}
          </span>
        </div>
        <div className={styles.row}>
          <strong>Posted:</strong> <span>{new Date(job.created_at).toLocaleString()}</span>
        </div>

        <label className={styles.field}>
          <span>Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            disabled={!isEditing}
          />
        </label>

        <label className={styles.field}>
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            disabled={!isEditing}
            rows={4}
          />
        </label>

        <div className={styles.grid3}>
          <label className={styles.field}>
            <span>Eircode</span>
            <input
              value={form.eircode}
              onChange={(event) => setForm((prev) => ({ ...prev, eircode: event.target.value.toUpperCase() }))}
              disabled={!isEditing}
            />
          </label>
          <label className={styles.field}>
            <span>County</span>
            <input
              value={form.county}
              onChange={(event) => setForm((prev) => ({ ...prev, county: event.target.value }))}
              disabled={!isEditing}
            />
          </label>
          <label className={styles.field}>
            <span>City</span>
            <input
              value={form.locality}
              onChange={(event) => setForm((prev) => ({ ...prev, locality: event.target.value }))}
              disabled={!isEditing}
            />
          </label>
        </div>

        <label className={styles.field}>
          <span>Budget</span>
          <select
            value={form.budget_range}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                budget_range: event.target.value as (typeof JOB_BUDGET_OPTIONS)[number],
              }))
            }
            disabled={!isEditing}
          >
            {JOB_BUDGET_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}

        <div className={styles.actions}>
          {!isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)} className={styles.primary}>
              Edit summary
            </button>
          ) : (
            <>
              <button type="button" onClick={onSave} disabled={isSaving} className={styles.primary}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className={styles.secondary}>
                Cancel
              </button>
            </>
          )}
          <Link href="/dashboard/customer" className={styles.secondary}>
            Go to my jobs
          </Link>
        </div>
      </article>
    </main>
  );
}
