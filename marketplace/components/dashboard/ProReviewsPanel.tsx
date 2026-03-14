'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

type Review = {
  id: string;
  job_id: string;
  rating: number;
  comment: string | null;
  quality_rating: number | null;
  communication_rating: number | null;
  punctuality_rating: number | null;
  value_rating: number | null;
  provider_response: string | null;
  provider_responded_at: string | null;
  created_at: string;
};

function Stars({ value }: { value: number }) {
  return (
    <span style={{ color: 'var(--wm-amber)' }} aria-label={`${value} out of 5`}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

type ReviewCardProps = {
  review: Review;
  onUpdated: (id: string, response: string | null, respondedAt: string | null) => void;
};

/**
 * Per-review card with inline response composer.
 * Handles its own editing/pending state independently to avoid shared state clashes
 * when multiple reviews are visible at once.
 */
function ReviewCard({ review, onUpdated }: ReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.provider_response ?? '');
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

    const res = await fetch(`/api/reviews/${review.id}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: trimmed }),
    });

    const payload = await res.json().catch(() => ({}));
    setIsPending(false);

    if (!res.ok) {
      setError((payload as { error?: string }).error ?? 'Response could not be saved.');
      return;
    }

    const now = new Date().toISOString();
    onUpdated(review.id, trimmed, now);
    setEditing(false);
  };

  const remove = async () => {
    setIsPending(true);
    const res = await fetch(`/api/reviews/${review.id}/response`, { method: 'DELETE' });
    setIsPending(false);
    if (!res.ok) return;
    onUpdated(review.id, null, null);
    setText('');
    setEditing(false);
  };

  const startEdit = (current: string) => {
    setText(current);
    setError('');
    setEditing(true);
  };

  const cancel = () => {
    setText(review.provider_response ?? '');
    setError('');
    setEditing(false);
  };

  return (
    <div
      className="rounded-xl p-3"
      style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-bg)' }}
    >
      {/* ── Review header ── */}
      <div className="flex items-center justify-between gap-2">
        <Stars value={review.rating} />
        <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
          {new Date(review.created_at).toLocaleDateString('en-IE', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
      </div>

      {/* ── Review comment ── */}
      {review.comment ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--wm-text)' }}>{review.comment}</p>
      ) : null}

      {/* ── Dimension ratings ── */}
      {(review.quality_rating || review.communication_rating || review.punctuality_rating || review.value_rating) ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
          {review.quality_rating ? <span>Quality: {review.quality_rating}/5</span> : null}
          {review.communication_rating ? <span>Communication: {review.communication_rating}/5</span> : null}
          {review.punctuality_rating ? <span>Punctuality: {review.punctuality_rating}/5</span> : null}
          {review.value_rating ? <span>Value: {review.value_rating}/5</span> : null}
        </div>
      ) : null}

      {/* ── Response section ── */}
      {editing ? (
        /* Edit / compose mode */
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a professional response (min 10 characters)..."
            maxLength={1000}
            rows={3}
            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
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
              {isPending ? 'Saving...' : review.provider_response ? 'Update response' : 'Post response'}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : review.provider_response ? (
        /* Existing response — read mode */
        <div
          className="mt-3 rounded-lg px-3 py-2"
          style={{ border: '1px solid var(--wm-primary-light)', background: 'var(--wm-primary-faint)' }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
              Your response
            </p>
            {review.provider_responded_at ? (
              <span className="shrink-0 text-xs" style={{ color: 'var(--wm-primary-dark)', opacity: 0.6 }}>
                {new Date(review.provider_responded_at).toLocaleDateString('en-IE', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--wm-primary-dark)' }}>
            {review.provider_response}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(review.provider_response!)}
            >
              Edit
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
      ) : (
        /* No response yet — CTA */
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startEdit('')}
          >
            Respond to this review
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ProReviewsPanel({ proId }: { proId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('reviews')
      .select(
        'id,job_id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,provider_response,provider_responded_at,created_at'
      )
      .eq('pro_id', proId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: { data: Review[] | null }) => setReviews(data ?? []));
  }, [proId]);

  const handleUpdated = (id: string, response: string | null, respondedAt: string | null) => {
    setReviews((current) =>
      current.map((r) =>
        r.id === id
          ? { ...r, provider_response: response, provider_responded_at: respondedAt }
          : r
      )
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl p-4" style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-bg)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>Your Reviews</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
          No reviews yet. Completed jobs will appear here once customers leave feedback.
        </p>
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', boxShadow: 'var(--wm-shadow-sm)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>Your Reviews</p>
        <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
          {avg.toFixed(1)} avg · {reviews.length} total
        </span>
      </div>

      <div className="mt-3 space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} onUpdated={handleUpdated} />
        ))}
      </div>
    </div>
  );
}
