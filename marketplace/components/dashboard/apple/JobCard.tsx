"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import OfferRankingBadge from '@/components/offers/OfferRankingBadge';
import JobPhotoUploader from '@/components/dashboard/JobPhotoUploader';
import JobMessagePanel from '@/components/dashboard/JobMessagePanel';
import JobStatusUpdater from '@/components/dashboard/JobStatusUpdater';
import QuoteActions from '@/components/dashboard/QuoteActions';
import DisputeButton from '@/components/disputes/DisputeButton';
import CustomerReleaseWarning from '@/components/payments/CustomerReleaseWarning';
import AutoReleaseCountdown from '@/components/payments/AutoReleaseCountdown';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import LeaveReviewForm from '@/components/dashboard/LeaveReviewForm';
import type { CustomerDashboardData, CustomerJob, CustomerQuote } from '@/lib/queries/customer-dashboard';

type JobCardProps = {
  job: CustomerJob;
  quotes: CustomerQuote[];
  customerId: string;
  locale: string;
  data: Pick<
    CustomerDashboardData,
    'proNameById' | 'proVerificationById' | 'stripeAccountByProId' | 'paymentByQuoteId' | 'reviewStatsByPro' | 'completedByPro' | 'portfolio' | 'reviewedJobIds'
  >;
};

function statusTone(status: string, reviewStatus: string | null): 'open' | 'pending' | 'completed' | 'assigned' | 'neutral' {
  if (reviewStatus === 'pending_review') return 'pending';
  if (status === 'open') return 'open';
  if (status === 'completed') return 'completed';
  if (status === 'accepted') return 'assigned';
  return 'neutral';
}

export default function JobCard({ job, quotes, customerId, locale, data }: JobCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ scale: 1.01 }}
      className="rounded-3xl border border-zinc-200/70 bg-white/95 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{job.title}</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Budget: {job.budget_range} • Eircode: {job.eircode}
          </p>
        </div>
        <Badge tone={statusTone(job.status, job.review_status)}>
          {job.review_status === 'pending_review' ? 'Pending review' : job.status}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
        {job.job_mode === 'direct_request' ? (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:ring-indigo-800">Direct Request</span>
        ) : null}
        {job.job_mode === 'quick_hire' ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-800">Quick Hire</span>
        ) : null}
      </div>

      {(job.status === 'accepted' || job.status === 'in_progress') ? (
        <div className="mt-4">
          <Link
            href={`/${locale}/jobs/${job.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
          >
            Open Workspace
          </Link>
        </div>
      ) : null}

      <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Add Photos</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Upload reference photos to improve quote quality.
        </p>
        <div className="mt-3">
          <JobPhotoUploader
            jobId={job.id}
            customerId={customerId}
            initialPhotoUrls={Array.isArray(job.photo_urls) ? job.photo_urls : []}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/45">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Public Discussion</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Keep scope and timeline clear for all providers.</p>
        <div className="mt-3">
          <JobMessagePanel jobId={job.id} visibility="public" title="Public job discussion" />
        </div>
      </div>

      {job.status === 'completed' && job.accepted_quote_id && !data.reviewedJobIds.has(job.id) ? (
        <div className="mt-5">
          <LeaveReviewForm
            jobId={job.id}
            proName={data.proNameById.get(
              quotes.find((q) => q.id === job.accepted_quote_id)?.pro_id ?? ''
            ) ?? 'the professional'}
          />
        </div>
      ) : null}
      {job.status === 'completed' ? <div className="mt-4"><CustomerReleaseWarning /></div> : null}
      <div className="mt-4">
        <AutoReleaseCountdown autoReleaseAt={job.auto_release_at ?? null} />
      </div>
      <div className="mt-4">
        <JobStatusUpdater jobId={job.id} initialStatus={job.status} />
      </div>
      {job.status === 'completed' ? <div className="mt-3"><DisputeButton jobId={job.id} /></div> : null}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Quotes ({quotes.length})</h4>
        {quotes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No quotes yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {quotes.map((quote, index) => {
              const isTopOffer = index === 0 && (quote.ranking_score ?? 0) > 0;
              const proName = data.proNameById.get(quote.pro_id) ?? 'Professional';
              const verification = data.proVerificationById.get(quote.pro_id) ?? 'none';
              const reviews = data.reviewStatsByPro.get(quote.pro_id) ?? { count: 0, avg: 0 };
              const completed = data.completedByPro.get(quote.pro_id) ?? 0;
              return (
                <motion.div
                  key={quote.id}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                  className="h-full"
                >
                  <Card className="h-full rounded-2xl border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
                  {isTopOffer ? <OfferRankingBadge score={quote.ranking_score!} /> : null}
                  <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{proName}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Quote: EUR {(quote.quote_amount_cents / 100).toFixed(2)} • {quote.status}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Rating: {reviews.count > 0 ? `${reviews.avg.toFixed(1)} / 5 (${reviews.count})` : 'No reviews'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Completed jobs: {completed}+</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Duration: {quote.estimated_duration ?? '-'}</p>
                  {verification !== 'approved' ? (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                      Provider ID is not verified yet.
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <QuoteActions
                      jobId={job.id}
                      jobStatus={job.status}
                      quoteId={quote.id}
                      quoteStatus={quote.status}
                      quoteAmountCents={quote.quote_amount_cents}
                      proId={quote.pro_id}
                      customerId={customerId}
                      connectedAccountId={data.stripeAccountByProId.get(quote.pro_id) ?? null}
                      isAcceptedQuote={job.accepted_quote_id === quote.id}
                      payment={data.paymentByQuoteId.get(quote.id) ?? null}
                    />
                  </div>
                  <div className="mt-3">
                    <JobMessagePanel
                      jobId={job.id}
                      quoteId={quote.id}
                      receiverId={quote.pro_id}
                      visibility="private"
                      title="Message provider"
                    />
                  </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.article>
  );
}
