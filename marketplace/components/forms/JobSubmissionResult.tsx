"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { JOB_BUDGET_OPTIONS } from '@/lib/data/budgets';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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
  photo_urls?: string[] | null;
};

export default function JobSubmissionResult({
  initialJob,
  customerId,
}: {
  initialJob: JobSummary;
  customerId: string;
}) {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const [job, setJob] = useState(initialJob);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photoCount, setPhotoCount] = useState((initialJob.photo_urls ?? []).length);

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

  const onUploadPhotos = async () => {
    setError('');
    setOk('');
    const supabase = getSupabaseBrowserClient();
    if (uploadFiles.length === 0) {
      setError('Please choose at least one image.');
      return;
    }

    if (photoCount + uploadFiles.length > 20) {
      setError(`You can upload up to ${20 - photoCount} more image(s).`);
      return;
    }

    setIsUploading(true);
    const uploadedPaths: string[] = [];

    for (const file of uploadFiles) {
      if (!file.type.startsWith('image/')) {
        setIsUploading(false);
        setError('Only image files are allowed.');
        return;
      }

      const safeName = file.name.replace(/\s+/g, '-');
      const path = `jobs/${customerId}/${job.id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('job-photos').upload(path, file, { upsert: false });

      if (uploadError) {
        setIsUploading(false);
        setError(uploadError.message || 'Photo upload failed.');
        return;
      }

      uploadedPaths.push(path);
    }

    const response = await fetch(`/api/jobs/${job.id}/photos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_urls: uploadedPaths }),
    });
    const payload = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(payload.error || 'Job photos could not be updated.');
      return;
    }

    setUploadFiles([]);
    setPhotoCount(payload.total_count ?? photoCount);
    setOk(`Photos uploaded successfully. Total photos: ${payload.total_count ?? photoCount}.`);
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
        <div className={styles.row}>
          <strong>Photos:</strong> <span>{photoCount}/20</span>
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

        {isEditing ? (
          <section className={styles.photoSection}>
            <h3>Add photos</h3>
            <p className={styles.muted}>You can upload before/after or issue photos for better provider quotes.</p>
            <div className={styles.photoUploader}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
              />
              <button type="button" onClick={onUploadPhotos} className={styles.secondary} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload selected photos'}
              </button>
            </div>
          </section>
        ) : null}

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
          <Link href={withLocalePrefix(localeRoot, '/dashboard/customer')} className={styles.secondary}>
            Go to my jobs
          </Link>
        </div>
      </article>
    </main>
  );
}
