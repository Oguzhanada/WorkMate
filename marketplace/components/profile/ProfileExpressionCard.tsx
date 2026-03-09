'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const STORAGE_KEY = 'workmate_profile_expression_note_v1';

export default function ProfileExpressionCard() {
  const [note, setNote] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const payload = JSON.parse(saved) as { note?: string; savedAt?: string };
        if (payload.note) setNote(payload.note);
        if (payload.savedAt) setSavedAt(payload.savedAt);
      } catch {
        // Keep default empty state if storage payload is invalid.
      }
    });
  }, []);

  const save = () => {
    const now = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ note, savedAt: now }));
    setSavedAt(now);
  };

  return (
    <Card className="rounded-2xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">About you</h3>
        <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
          Private local note
        </span>
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
        Write a short personal statement about your work style, preferences, or goals.
      </p>
      <textarea
        rows={4}
        className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--wm-border)', background: 'var(--wm-surface)' }}
        placeholder="Example: I focus on clear communication, punctual delivery, and quality finish."
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
          {savedAt ? `Saved locally on ${new Date(savedAt).toLocaleString('en-IE')}` : 'Not saved yet'}
        </p>
        <Button variant="primary" size="sm" onClick={save}>
          Save note
        </Button>
      </div>
    </Card>
  );
}
