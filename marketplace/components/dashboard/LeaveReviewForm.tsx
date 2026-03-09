'use client';

import { useState } from 'react';

type Props = {
  jobId: string;
  proName: string;
  onSubmitted?: () => void;
};

const LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs" style={{ color: 'var(--wm-muted)' }}>{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className={`text-xl transition-colors ${
              star <= (hovered || value)
                ? 'text-amber-400'
                : 'text-[var(--wm-border)]'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 ? (
        <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>{LABELS[value]}</span>
      ) : null}
    </div>
  );
}

export default function LeaveReviewForm({ jobId, proName, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl px-4 py-4" style={{ border: '1px solid var(--wm-primary-light)', background: 'var(--wm-primary-faint)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
          Review submitted — thank you!
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--wm-primary-dark)' }}>
          Your feedback helps other customers find quality providers.
        </p>
      </div>
    );
  }

  const submit = async () => {
    if (rating === 0) {
      setError('Please select an overall rating.');
      return;
    }

    setIsPending(true);
    setError('');

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        rating,
        comment: comment.trim() || undefined,
        quality_rating: qualityRating || undefined,
        communication_rating: communicationRating || undefined,
        punctuality_rating: punctualityRating || undefined,
        value_rating: valueRating || undefined,
      }),
    });

    const payload = await response.json();
    setIsPending(false);

    if (!response.ok) {
      setError(payload.error || 'Review could not be submitted.');
      return;
    }

    setSubmitted(true);
    onSubmitted?.();
  };

  return (
    <div className="rounded-2xl p-4" style={{ border: '1px solid var(--wm-amber-light)', background: 'var(--wm-amber-faint)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>
        Leave a review for {proName}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--wm-muted)' }}>
        Your review is public and helps the WorkMate community.
      </p>

      <div className="mt-4 space-y-2">
        <StarRow label="Overall" value={rating} onChange={setRating} />
        <StarRow label="Quality of work" value={qualityRating} onChange={setQualityRating} />
        <StarRow label="Communication" value={communicationRating} onChange={setCommunicationRating} />
        <StarRow label="Punctuality" value={punctualityRating} onChange={setPunctualityRating} />
        <StarRow label="Value for money" value={valueRating} onChange={setValueRating} />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Describe your experience (optional)"
        maxLength={2000}
        className="mt-4 w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)', color: 'var(--wm-text)' }}
        rows={3}
      />

      {error ? (
        <p className="mt-2 text-xs text-[var(--wm-destructive)]">{error}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || rating === 0}
          onClick={submit}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--wm-amber)' }}
        >
          {isPending ? 'Submitting...' : 'Submit review'}
        </button>
        {rating === 0 ? (
          <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>Select a rating to continue</span>
        ) : null}
      </div>
    </div>
  );
}
