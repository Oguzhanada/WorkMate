'use client';

import Badge from '@/components/ui/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

type JobStatus = 'open' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type JobStatusTimelineProps = {
  jobId: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  offers?: { count: number };
  appointmentAt?: string | null;
};

// ─── Status badge (compact, for list views) ──────────────────────────────────

type StatusBadgeTone = 'open' | 'pending' | 'completed' | 'neutral' | 'amber' | 'navy';

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; tone: StatusBadgeTone; dot: boolean }
> = {
  open:        { label: 'Open',        tone: 'open',      dot: true },
  quoted:      { label: 'Quoted',      tone: 'pending',   dot: true },
  accepted:    { label: 'Accepted',    tone: 'amber',     dot: true },
  in_progress: { label: 'In Progress', tone: 'navy',      dot: true },
  completed:   { label: 'Completed',   tone: 'completed', dot: true },
  cancelled:   { label: 'Cancelled',   tone: 'neutral',   dot: false },
  expired:     { label: 'Expired',     tone: 'neutral',   dot: false },
  closed:      { label: 'Closed',      tone: 'neutral',   dot: false },
};

export function JobStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE_CONFIG[status] ?? { label: status, tone: 'neutral' as const, dot: false };
  return (
    <Badge tone={cfg.tone} dot={cfg.dot}>
      {cfg.label}
    </Badge>
  );
}

// ─── Timeline step definition ─────────────────────────────────────────────────

type StepState = 'done' | 'current' | 'pending';

type TimelineStep = {
  key: string;
  label: string;
  subtitle?: string;
  state: StepState;
  isCurrent: boolean;
};

function buildSteps(
  status: string,
  createdAt: string,
  offers?: { count: number },
  appointmentAt?: string | null
): TimelineStep[] {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });

  const jobStatus = status as JobStatus;

  // Define the ordered set of non-cancelled statuses
  const ORDER: JobStatus[] = ['open', 'quoted', 'accepted', 'in_progress', 'completed'];
  const currentIdx = ORDER.indexOf(jobStatus);
  const isCancelled = jobStatus === 'cancelled';

  function stepState(targetIdx: number): StepState {
    if (isCancelled) return 'pending'; // all pending visual for cancelled (handled specially)
    if (currentIdx > targetIdx) return 'done';
    if (currentIdx === targetIdx) return 'current';
    return 'pending';
  }

  // Step 1 — Job Posted (always done)
  const step1: TimelineStep = {
    key: 'posted',
    label: 'Job Posted',
    subtitle: fmt(createdAt),
    state: 'done',
    isCurrent: false,
  };

  // Step 2 — Offers Received (done when quoted or beyond, or when offers.count > 0)
  const hasOffers = (offers?.count ?? 0) > 0;
  const offersReached = currentIdx >= ORDER.indexOf('quoted') || hasOffers;
  const step2: TimelineStep = {
    key: 'offers',
    label: 'Offers Received',
    subtitle: hasOffers
      ? `${offers!.count} offer${offers!.count !== 1 ? 's' : ''}`
      : offersReached
      ? 'Offers in'
      : 'Waiting for offers',
    state: isCancelled
      ? 'pending'
      : offersReached
      ? currentIdx === ORDER.indexOf('quoted')
        ? 'current'
        : 'done'
      : 'pending',
    isCurrent: !isCancelled && currentIdx === ORDER.indexOf('quoted'),
  };

  // Step 3 — Provider Selected / In Progress
  const providerReached = currentIdx >= ORDER.indexOf('accepted');
  const step3: TimelineStep = {
    key: 'accepted',
    label: jobStatus === 'in_progress' || jobStatus === 'completed' ? 'Work In Progress' : 'Provider Selected',
    subtitle:
      jobStatus === 'in_progress'
        ? 'Work underway'
        : jobStatus === 'completed'
        ? 'Work completed'
        : providerReached
        ? 'Provider confirmed'
        : 'Awaiting selection',
    state: isCancelled
      ? 'pending'
      : stepState(ORDER.indexOf('accepted')),
    isCurrent: !isCancelled && (currentIdx === ORDER.indexOf('accepted') || currentIdx === ORDER.indexOf('in_progress')),
  };

  // Step 4 — Appointment Scheduled
  const apptDone = !!appointmentAt;
  const apptReachable = currentIdx >= ORDER.indexOf('accepted');
  const step4: TimelineStep = {
    key: 'appointment',
    label: 'Appointment Scheduled',
    subtitle: apptDone
      ? fmt(appointmentAt!)
      : apptReachable
      ? 'Not yet scheduled'
      : 'After provider selection',
    state: isCancelled ? 'pending' : apptDone ? 'done' : 'pending',
    isCurrent: false,
  };

  // Step 5 — Completed
  const step5: TimelineStep = {
    key: 'completed',
    label: 'Job Completed',
    subtitle: jobStatus === 'completed' ? 'Done' : 'Pending completion',
    state: isCancelled
      ? 'pending'
      : stepState(ORDER.indexOf('completed')),
    isCurrent: !isCancelled && currentIdx === ORDER.indexOf('completed'),
  };

  return [step1, step2, step3, step4, step5];
}

// ─── Step circle indicator ────────────────────────────────────────────────────

function StepCircle({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--wm-primary)',
          color: 'var(--wm-background)',
          flexShrink: 0,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        ✓
      </span>
    );
  }

  if (state === 'current') {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--wm-primary)',
          flexShrink: 0,
          animation: 'wm-pulse 2s ease-in-out infinite',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--wm-background)',
          }}
        />
      </span>
    );
  }

  // pending
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2px solid var(--wm-border)',
        background: 'var(--color-background-secondary)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--wm-subtle)',
        }}
      />
    </span>
  );
}

// ─── Connector line between steps ────────────────────────────────────────────

function Connector({ done }: { done: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 2,
        minHeight: 28,
        marginLeft: 13, // center under 28px circle
        borderLeft: done
          ? '2px solid var(--wm-primary)'
          : '2px dashed var(--wm-border)',
        transition: 'border-color 300ms ease',
      }}
    />
  );
}

// ─── Main timeline component ──────────────────────────────────────────────────

export default function JobStatusTimeline({
  status,
  createdAt,
  offers,
  appointmentAt,
}: JobStatusTimelineProps) {
  const steps = buildSteps(status, createdAt, offers, appointmentAt);
  const isCancelled = status === 'cancelled';

  return (
    <section aria-label="Job status timeline">
      {/* Inline keyframe for pulse animation — avoids an extra CSS file */}
      <style>{`
        @keyframes wm-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--wm-primary-rgb, 16,185,129), 0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(var(--wm-primary-rgb, 16,185,129), 0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Job Status</h2>
        {isCancelled ? (
          <Badge tone="neutral">Cancelled</Badge>
        ) : null}
      </div>

      {isCancelled ? (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: 'var(--color-background-secondary)',
            border: '1px solid var(--wm-border)',
            color: 'var(--wm-muted)',
            fontSize: '0.875rem',
          }}
        >
          This job has been cancelled and is no longer active.
        </div>
      ) : (
        <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const connectorDone = step.state === 'done';

            return (
              <div key={step.key} role="listitem">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {/* Circle */}
                  <StepCircle state={step.state} />

                  {/* Step content */}
                  <div style={{ paddingBottom: isLast ? 0 : 4, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: step.isCurrent ? 700 : 500,
                          color: step.state === 'done'
                            ? 'var(--wm-text)'
                            : step.isCurrent
                            ? 'var(--wm-primary)'
                            : 'var(--wm-muted)',
                          transition: 'color 200ms ease',
                        }}
                      >
                        {step.label}
                      </span>
                      {step.isCurrent ? (
                        <Badge tone="open" dot>Current</Badge>
                      ) : null}
                    </div>
                    {step.subtitle ? (
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: '0.75rem',
                          color: 'var(--wm-subtle)',
                        }}
                      >
                        {step.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Connector to next step */}
                {!isLast ? <Connector done={connectorDone} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
