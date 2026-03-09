'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

type Props = {
  reviewId: string;
  existingResponse: string | null;
  respondedAt: string | null;
  onSaved: (response: string, respondedAt: string) => void;
  onDeleted: () => void;
};

/**
 * Inline form for a provider to write, edit, or remove their response to a review.
 * Used by both ProReviewsPanel (provider dashboard) and could be embedded elsewhere.
 * Calls POST /api/reviews/[reviewId]/response and DELETE /api/reviews/[reviewId]/response.
 */
export default function ReviewResponseForm({
  reviewId,
  existingResponse,
  respondedAt,
  onSaved,
  onDeleted,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(existingResponse ?? '');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setError('Response must be at least 10 characters.');
      return;
    }
    setIsPending(true);
    setError('');

    const res = await fetch(`/api/reviews/${reviewId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: trimmed }),
    });

    const payload = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setError((payload as { error?: string }).error ?? 'Could not save response.');
      return;
    }

    const now = new Date().toISOString();
    onSaved(trimmed, now);
    setEditing(false);
  };

  const remove = async () => {
    setIsPending(true);
    const res = await fetch(`/api/reviews/${reviewId}/response`, { method: 'DELETE' });
    setIsPending(false);
    if (!res.ok) return;
    onDeleted();
    setText('');
    setEditing(false);
  };

  const cancel = () => {
    setText(existingResponse ?? '');
    setEditing(false);
    setError('');
  };

  // ── Show existing response (read mode) ─────────────────────────────────────
  if (existingResponse && !editing) {
    return (
      <div
        className="mt-3 rounded-xl px-3 py-3"
        style={{
          border: '1px solid var(--wm-primary-light)',
          background: 'var(--wm-primary-faint)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
            Provider&apos;s Response
          </p>
          {respondedAt ? (
            <span className="shrink-0 text-xs" style={{ color: 'var(--wm-primary-dark)', opacity: 0.6 }}>
              {new Date(respondedAt).toLocaleDateString('en-IE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-primary-dark)' }}>
          {existingResponse}
        </p>
        {/* Edit / Remove actions — only rendered when onSaved/onDeleted callbacks are meaningful */}
        <div className="mt-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText(existingResponse);
              setEditing(true);
            }}
          >
            Edit response
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={remove}
          >
            {isPending ? 'Removing...' : 'Remove'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Reply / Edit form ───────────────────────────────────────────────────────
  if (!existingResponse && !editing) {
    return (
      <div className="mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setText('');
            setEditing(true);
          }}
        >
          Respond to this review
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a professional response (min 10 characters)..."
        maxLength={1000}
        rows={4}
        className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
        style={{
          border: '1px solid var(--wm-border)',
          background: 'var(--wm-surface)',
          color: 'var(--wm-text)',
          resize: 'vertical',
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
          {text.trim().length}/1000
        </span>
      </div>
      {error ? (
        <p className="text-xs" style={{ color: 'var(--wm-destructive)' }}>{error}</p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={isPending || text.trim().length < 10}
          onClick={submit}
        >
          {isPending ? 'Saving...' : existingResponse ? 'Update response' : 'Post response'}
        </Button>
        <Button variant="ghost" size="sm" onClick={cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
