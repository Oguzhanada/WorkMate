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
      <span className="w-36 text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
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
                : 'text-zinc-300 dark:text-zinc-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 ? (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">{LABELS[value]}</span>
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800/60 dark:bg-emerald-950/40">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          Review submitted — thank you!
        </p>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
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
    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-950/30">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Leave a review for {proName}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
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
        className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        rows={3}
      />

      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || rating === 0}
          onClick={submit}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          {isPending ? 'Submitting...' : 'Submit review'}
        </button>
        {rating === 0 ? (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Select a rating to continue</span>
        ) : null}
      </div>
    </div>
  );
}
