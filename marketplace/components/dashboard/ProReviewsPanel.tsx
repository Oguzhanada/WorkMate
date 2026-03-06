'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  created_at: string;
};

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-label={`${value} out of 5`}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

export default function ProReviewsPanel({ proId }: { proId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('reviews')
      .select('id,job_id,rating,comment,quality_rating,communication_rating,punctuality_rating,value_rating,provider_response,created_at')
      .eq('pro_id', proId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setReviews((data as Review[] | null) ?? []));
  }, [proId]);

  const submitResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setIsPending(true);
    setError('');
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ provider_response: responseText.trim() })
      .eq('id', reviewId)
      .eq('pro_id', proId);

    setIsPending(false);

    if (updateError) {
      setError(updateError.message || 'Response could not be saved.');
      return;
    }

    setReviews((current) =>
      current.map((r) =>
        r.id === reviewId ? { ...r, provider_response: responseText.trim() } : r
      )
    );
    setRespondingTo(null);
    setResponseText('');
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Your Reviews</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          No reviews yet. Completed jobs will appear here once customers leave feedback.
        </p>
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Your Reviews</p>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {avg.toFixed(1)} avg · {reviews.length} total
        </span>
      </div>

      <div className="mt-3 space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between gap-2">
              <Stars value={review.rating} />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(review.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {review.comment ? (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{review.comment}</p>
            ) : null}

            {(review.quality_rating || review.communication_rating || review.punctuality_rating || review.value_rating) ? (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {review.quality_rating ? <span>Quality: {review.quality_rating}/5</span> : null}
                {review.communication_rating ? <span>Communication: {review.communication_rating}/5</span> : null}
                {review.punctuality_rating ? <span>Punctuality: {review.punctuality_rating}/5</span> : null}
                {review.value_rating ? <span>Value: {review.value_rating}/5</span> : null}
              </div>
            ) : null}

            {review.provider_response ? (
              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Your response</p>
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">{review.provider_response}</p>
              </div>
            ) : respondingTo === review.id ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write a professional response..."
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPending || !responseText.trim()}
                    onClick={() => submitResponse(review.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isPending ? 'Saving...' : 'Post response'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRespondingTo(null); setResponseText(''); }}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setRespondingTo(review.id); setResponseText(''); }}
                className="mt-2 text-xs text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Respond to this review
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
