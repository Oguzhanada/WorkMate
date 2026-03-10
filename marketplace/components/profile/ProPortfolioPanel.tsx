'use client';

import { useEffect, useState } from 'react';
import styles from '@/components/dashboard/dashboard.module.css';

type PortfolioItem = {
  id: string;
  title: string;
  before_image_url: string;
  after_image_url: string;
  experience_note: string;
  visibility_scope?: 'public' | 'applied_customers';
  is_public?: boolean;
};

export default function ProPortfolioPanel() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [title, setTitle] = useState('');
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [experienceNote, setExperienceNote] = useState('');
  const [visibilityScope, setVisibilityScope] = useState<'public' | 'applied_customers'>('public');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  const load = async () => {
    const response = await fetch('/api/pro/portfolio', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Portfolio could not be loaded.');
      return;
    }
    setItems(payload.items ?? []);
  };

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; };
  }, []);

  const save = async () => {
    setIsPending(true);
    setError('');
    const response = await fetch('/api/pro/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        experience_note: experienceNote,
        visibility_scope: visibilityScope,
      }),
    });
    const payload = await response.json();
    setIsPending(false);
    if (!response.ok) {
      setError(payload.error || 'Save failed.');
      return;
    }
    setTitle('');
    setBeforeUrl('');
    setAfterUrl('');
    setExperienceNote('');
    setVisibilityScope('public');
    await load();
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/pro/portfolio?id=${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    await load();
  };

  return (
    <article className={styles.card}>
      <h2 className={styles.title}>Before / After Portfolio</h2>
      <p className={styles.meta}>Add visuals to build trust with customers.</p>
      {error ? <p className={styles.feedback}>{error}</p> : null}

      <div className={styles.stack}>
        <input className={styles.input} placeholder="Title (e.g. Bathroom renovation)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={styles.input} placeholder="Before image URL" value={beforeUrl} onChange={(e) => setBeforeUrl(e.target.value)} />
        <input className={styles.input} placeholder="After image URL" value={afterUrl} onChange={(e) => setAfterUrl(e.target.value)} />
        <textarea
          className={styles.textarea}
          placeholder="Share short experience details about this work (materials, timeline, outcome)"
          value={experienceNote}
          onChange={(e) => setExperienceNote(e.target.value)}
        />
        <label className={styles.field}>
          <span className={styles.meta}>Who can view this work?</span>
          <select
            className={styles.input}
            value={visibilityScope}
            onChange={(e) => setVisibilityScope(e.target.value as 'public' | 'applied_customers')}
          >
            <option value="public">Everyone</option>
            <option value="applied_customers">Only customers I applied to</option>
          </select>
        </label>
        <div className={styles.buttons}>
          <button className={styles.primary} onClick={save} disabled={isPending}>
            {isPending ? 'Saving...' : 'Add portfolio item'}
          </button>
        </div>
      </div>

      <div className={styles.stack}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            <p className={styles.title}>{item.title || 'Portfolio item'}</p>
            <p className={styles.meta}>
              Visibility:{' '}
              {(item.visibility_scope ?? (item.is_public ? 'public' : 'applied_customers')) === 'public'
                ? 'Everyone'
                : 'Only customers I applied to'}
            </p>
            <div className={styles.grid2}>
              <img src={item.before_image_url} alt="Before" style={{ width: '100%', borderRadius: 10 }} />
              <img src={item.after_image_url} alt="After" style={{ width: '100%', borderRadius: 10 }} />
            </div>
            {item.experience_note ? <p className={styles.meta}>Experience note: {item.experience_note}</p> : null}
            <div className={styles.buttons}>
              <button className={styles.danger} onClick={() => remove(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
