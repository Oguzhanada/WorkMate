'use client';

import { useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '@/components/dashboard/dashboard.module.css';

export default function JobPhotoUploader({
  jobId,
  customerId,
  initialPhotoUrls,
}: {
  jobId: string;
  customerId: string;
  initialPhotoUrls: string[];
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [photoCount, setPhotoCount] = useState(initialPhotoUrls.length);

  const remaining = useMemo(() => Math.max(0, 20 - photoCount), [photoCount]);

  const addPhotos = async () => {
    if (files.length === 0) {
      setFeedback('Please choose at least one photo.');
      return;
    }

    if (files.length > remaining) {
      setFeedback(`You can upload up to ${remaining} more photo(s).`);
      return;
    }

    setIsPending(true);
    setFeedback('');
    const supabase = getSupabaseBrowserClient();
    const uploadedPaths: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setFeedback('Only image files are allowed.');
        setIsPending(false);
        return;
      }

      const safeName = file.name.replace(/\s+/g, '-');
      const path = `jobs/${customerId}/${jobId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('job-photos').upload(path, file, { upsert: false });
      if (error) {
        setFeedback(`Photo upload failed: ${error.message}`);
        setIsPending(false);
        return;
      }
      uploadedPaths.push(path);
    }

    const response = await fetch(`/api/jobs/${jobId}/photos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_urls: uploadedPaths }),
    });
    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Job photos could not be updated.');
      return;
    }

    setFiles([]);
    setPhotoCount(payload.total_count ?? photoCount);
    setFeedback(`Photos added successfully. Total photos: ${payload.total_count}.`);
  };

  return (
    <div className={styles.card}>
      <p className={styles.meta}>Job photos: {photoCount}/20</p>
      <div className={styles.field}>
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.primary} onClick={addPhotos} disabled={isPending || remaining === 0}>
          {isPending ? 'Uploading...' : 'Add photos'}
        </button>
      </div>
      {feedback ? <p className={styles.meta}>{feedback}</p> : null}
    </div>
  );
}
