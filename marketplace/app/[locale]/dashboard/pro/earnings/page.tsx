'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  Clock,
  Briefcase,
  Wallet,
  ExternalLink,
  Filter,
  ChevronDown,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PaymentStatus = 'authorized' | 'captured' | 'cancelled' | 'refunded';

type PaymentRow = {
  id: string;
  amount_cents: number;
  commission_cents: number;
  status: PaymentStatus;
  created_at: string;
  job_id: string;
  jobs: { title: string; status: string } | { title: string; status: string }[];
  customer: { full_name: string | null } | { full_name: string | null }[];
};

type EarningsSummary = {
  totalEarnedCents: number;
  pendingCents: number;
  thisMonthCents: number;
  completedJobs: number;
};

type DateFilter = 'all' | '7d' | '30d' | '90d' | 'year';
type StatusFilter = 'all' | PaymentStatus;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatEur(cents: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

function getDateCutoff(filter: DateFilter): string | null {
  if (filter === 'all') return null;
  const now = new Date();
  const days = filter === '7d' ? 7 : filter === '30d' ? 30 : filter === '90d' ? 90 : 365;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

const statusConfig: Record<
  PaymentStatus,
  { tone: 'primary' | 'pending' | 'completed' | 'neutral'; label: string; icon: typeof CheckCircle2 }
> = {
  authorized: { tone: 'pending', label: 'Pending', icon: Clock },
  captured: { tone: 'primary', label: 'Captured', icon: CheckCircle2 },
  cancelled: { tone: 'neutral', label: 'Cancelled', icon: XCircle },
  refunded: { tone: 'completed', label: 'Refunded', icon: RotateCcw },
};

function unwrap<T>(val: T | T[]): T {
  return Array.isArray(val) ? val[0] : val;
}

/* ------------------------------------------------------------------ */
/*  Summary Card                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        border: '1px solid var(--wm-border)',
        background: accent ? 'var(--wm-primary-light)' : 'var(--wm-surface)',
      }}
    >
      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--wm-muted)' }}>
        <Icon size={14} />
        {label}
      </div>
      <p
        className="mt-2 text-2xl font-bold"
        style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stripe Connect Status                                              */
/* ------------------------------------------------------------------ */

function StripeConnectBanner({ stripeAccountId }: { stripeAccountId: string | null }) {
  if (stripeAccountId) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3"
        style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
      >
        <div className="flex items-center gap-2.5">
          <CreditCard size={16} style={{ color: 'var(--wm-primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--wm-navy)' }}>
            Stripe Connect is active
          </span>
          <Badge tone="primary" dot>
            Connected
          </Badge>
        </div>
        <a
          href="https://connect.stripe.com/express_login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'var(--wm-primary-dark)' }}
        >
          Manage Stripe dashboard
          <ExternalLink size={13} />
        </a>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3"
      style={{ border: '1px solid var(--wm-amber)', background: 'var(--wm-amber-light)' }}
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle size={16} style={{ color: 'var(--wm-amber-dark)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--wm-amber-dark)' }}>
          Stripe Connect not set up — you need this to receive payouts.
        </span>
      </div>
      <Link
        href="/en/become-provider/apply"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold"
        style={{ background: 'var(--wm-amber)', color: '#fff' }}
      >
        Set up now
        <ExternalLink size={13} />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--wm-surface-alt)' }}
      >
        <Inbox size={28} style={{ color: 'var(--wm-muted)' }} />
      </div>
      <p className="text-base font-semibold" style={{ color: 'var(--wm-navy)' }}>
        No earnings yet
      </p>
      <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--wm-muted)' }}>
        Complete your first job to start earning. Payments will appear here once customers release funds.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Bar                                                         */
/* ------------------------------------------------------------------ */

function FilterBar({
  dateFilter,
  statusFilter,
  onDateChange,
  onStatusChange,
}: {
  dateFilter: DateFilter;
  statusFilter: StatusFilter;
  onDateChange: (v: DateFilter) => void;
  onStatusChange: (v: StatusFilter) => void;
}) {
  const selectStyle: React.CSSProperties = {
    border: '1px solid var(--wm-border)',
    background: 'var(--wm-surface)',
    color: 'var(--wm-foreground)',
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--wm-muted)' }}>
        <Filter size={14} />
        Filters
      </div>

      <div className="relative">
        <select
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value as DateFilter)}
          className="appearance-none rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium"
          style={selectStyle}
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="year">This year</option>
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--wm-muted)' }}
        />
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="appearance-none rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium"
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          <option value="authorized">Pending</option>
          <option value="captured">Captured</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--wm-muted)' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function ProviderEarningsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated.');
      setLoading(false);
      return;
    }

    // Fetch Stripe account status
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .maybeSingle();

    setStripeAccountId(profile?.stripe_account_id ?? null);

    // Build payments query
    let query = supabase
      .from('payments')
      .select(
        'id, amount_cents, commission_cents, status, created_at, job_id, jobs(title, status), customer:profiles!payments_customer_id_fkey(full_name)'
      )
      .eq('pro_id', user.id)
      .order('created_at', { ascending: false });

    const dateCutoff = getDateCutoff(dateFilter);
    if (dateCutoff) {
      query = query.gte('created_at', dateCutoff);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: paymentRows, error: paymentsError } = await query;

    if (paymentsError) {
      setError(paymentsError.message);
      setLoading(false);
      return;
    }

    setPayments((paymentRows as unknown as PaymentRow[]) ?? []);

    // Summary: always computed across all payments (unfiltered)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount_cents, commission_cents, status, created_at')
      .eq('pro_id', user.id);

    const all = allPayments ?? [];
    const { start, end } = getMonthRange();

    const totalEarnedCents = all
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + (p.amount_cents - p.commission_cents), 0);

    const pendingCents = all
      .filter((p) => p.status === 'authorized')
      .reduce((sum, p) => sum + (p.amount_cents - p.commission_cents), 0);

    const thisMonthCents = all
      .filter((p) => p.status === 'captured' && p.created_at >= start && p.created_at <= end)
      .reduce((sum, p) => sum + (p.amount_cents - p.commission_cents), 0);

    const completedJobs = all.filter((p) => p.status === 'captured').length;

    setSummary({ totalEarnedCents, pendingCents, thisMonthCents, completedJobs });
    setLoading(false);
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
        >
          Earnings &amp; Payouts
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
          Track your income, pending payouts, and payment history.
        </p>
      </div>

      {/* Stripe Connect banner */}
      <div className="mb-6">
        {loading ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : (
          <StripeConnectBanner stripeAccountId={stripeAccountId} />
        )}
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryCard
            icon={Wallet}
            label="Total earned"
            value={formatEur(summary.totalEarnedCents)}
            accent
          />
          <SummaryCard icon={Clock} label="Pending payouts" value={formatEur(summary.pendingCents)} />
          <SummaryCard icon={TrendingUp} label="This month" value={formatEur(summary.thisMonthCents)} />
          <SummaryCard icon={Briefcase} label="Completed jobs" value={String(summary.completedJobs)} />
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--wm-destructive-light, #fef2f2)', color: 'var(--wm-destructive)' }}
        >
          {error}
        </div>
      ) : null}

      {/* Filters */}
      <div className="mb-4">
        <FilterBar
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          onDateChange={setDateFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Payments table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
        >
          {/* Desktop table header */}
          <div
            className="hidden grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider sm:grid"
            style={{ color: 'var(--wm-muted)', borderBottom: '1px solid var(--wm-border)' }}
          >
            <span>Job</span>
            <span>Customer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {payments.map((payment) => {
            const job = unwrap(payment.jobs);
            const customer = unwrap(payment.customer);
            const netCents = payment.amount_cents - payment.commission_cents;
            const config = statusConfig[payment.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={payment.id}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-center sm:gap-4"
                style={{ borderBottom: '1px solid var(--wm-border)' }}
              >
                {/* Job title */}
                <div>
                  <Link
                    href={`/en/dashboard/jobs/${payment.job_id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--wm-navy)' }}
                  >
                    {job?.title ?? 'Untitled job'}
                  </Link>
                </div>

                {/* Customer */}
                <div className="text-sm" style={{ color: 'var(--wm-muted)' }}>
                  {customer?.full_name ?? 'Unknown'}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className="text-sm font-semibold" style={{ color: 'var(--wm-navy)' }}>
                    {formatEur(netCents)}
                  </span>
                  {payment.commission_cents > 0 ? (
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--wm-muted)' }}>
                      ({formatEur(payment.amount_cents)} gross)
                    </span>
                  ) : null}
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-1.5">
                  <Badge tone={config.tone} dot>
                    <StatusIcon size={12} className="mr-0.5" />
                    {config.label}
                  </Badge>
                </div>

                {/* Date */}
                <div className="text-right text-xs" style={{ color: 'var(--wm-muted)' }}>
                  {new Date(payment.created_at).toLocaleDateString('en-IE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
