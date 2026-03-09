'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import AppointmentCalendar from '@/components/appointments/AppointmentCalendar';

// ─── Types ────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  video_link: string | null;
  notes: string | null;
  jobs: { title: string } | null;
  provider: { full_name: string } | null;
  customer: { full_name: string } | null;
  provider_id: string;
  customer_id: string;
};

type ViewMode = 'list' | 'calendar';

type Props = {
  role: 'customer' | 'provider';
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IE', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
    timeZone: 'Europe/Dublin',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IE', {
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: 'Europe/Dublin',
  });
}

type StatusTone = 'primary' | 'completed' | 'neutral';

function statusTone(status: Appointment['status']): StatusTone {
  if (status === 'scheduled') return 'primary';
  if (status === 'completed') return 'completed';
  return 'neutral';
}

function statusLabel(status: Appointment['status']): string {
  if (status === 'scheduled') return 'Upcoming';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AppointmentsView({ role }: Props) {
  const [view, setView]               = useState<ViewMode>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/appointments');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? 'Failed to load appointments');
          return;
        }
        const data = await res.json();
        setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      } catch {
        setError('Network error — please try again');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── View toggle ── */}
      <div
        style={{
          display:     'inline-flex',
          borderRadius: '12px',
          border:      '1px solid var(--wm-border)',
          overflow:    'hidden',
          alignSelf:   'flex-start',
        }}
      >
        <ToggleTab
          label="List"
          active={view === 'list'}
          onClick={() => setView('list')}
        />
        <ToggleTab
          label="Calendar"
          active={view === 'calendar'}
          onClick={() => setView('calendar')}
        />
      </div>

      {/* ── Calendar view ── */}
      {view === 'calendar' ? (
        <AppointmentCalendar role={role} />
      ) : null}

      {/* ── List view ── */}
      {view === 'list' ? (
        <>
          {loading ? <Skeleton lines={4} height="h-20" /> : null}

          {!loading && error ? (
            <p style={{ color: 'var(--wm-destructive)', fontSize: '0.875rem' }}>{error}</p>
          ) : null}

          {!loading && !error && appointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon />}
              title="No appointments yet"
              description="Booked appointments with providers will appear here."
            />
          ) : null}

          {!loading && !error && appointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {appointments.map((appt) => {
                const otherParty =
                  appt.provider_id === appt.customer_id
                    ? null
                    : role === 'provider'
                    ? appt.customer
                    : appt.provider;

                return (
                  <Card key={appt.id}>
                    <div
                      style={{
                        display:     'flex',
                        flexWrap:    'wrap',
                        gap:         '0.75rem',
                        alignItems:  'flex-start',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Left: info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {/* Date / time */}
                        <p
                          style={{
                            margin:     0,
                            fontSize:   '0.85rem',
                            fontWeight: 700,
                            color:      'var(--wm-navy)',
                          }}
                        >
                          {formatDateTime(appt.start_time)} – {formatTime(appt.end_time)}
                        </p>

                        {/* Job title */}
                        {appt.jobs?.title ? (
                          <p
                            style={{
                              margin:   0,
                              fontSize: '0.82rem',
                              color:    'var(--wm-foreground)',
                              fontWeight: 600,
                            }}
                          >
                            {appt.jobs.title}
                          </p>
                        ) : null}

                        {/* Other party */}
                        {otherParty?.full_name ? (
                          <p
                            style={{
                              margin:   0,
                              fontSize: '0.78rem',
                              color:    'var(--wm-muted)',
                            }}
                          >
                            With <strong>{otherParty.full_name}</strong>
                          </p>
                        ) : null}

                        {/* Notes */}
                        {appt.notes ? (
                          <p
                            style={{
                              margin:    0,
                              fontSize:  '0.75rem',
                              color:     'var(--wm-muted)',
                              fontStyle: 'italic',
                            }}
                          >
                            {appt.notes}
                          </p>
                        ) : null}

                        {/* Video link */}
                        {appt.video_link ? (
                          <a
                            href={appt.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize:       '0.75rem',
                              fontWeight:     600,
                              color:          'var(--wm-primary)',
                              textDecoration: 'none',
                              display:        'inline-flex',
                              alignItems:     'center',
                              gap:            '0.3rem',
                            }}
                          >
                            <span aria-hidden="true">📹</span>
                            Join video call
                          </a>
                        ) : null}
                      </div>

                      {/* Right: status badge */}
                      <Badge tone={statusTone(appt.status)} dot>
                        {statusLabel(appt.status)}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// ─── Toggle tab ───────────────────────────────────────────────────────────────

function ToggleTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding:         '0.45rem 1.1rem',
        fontSize:        '0.8rem',
        fontWeight:      active ? 700 : 500,
        cursor:          'pointer',
        border:          'none',
        background:      active ? 'var(--wm-primary)' : 'transparent',
        color:           active ? '#ffffff' : 'var(--wm-muted)',
        transition:      'background 0.15s, color 0.15s',
        outline:         'none',
      }}
    >
      {label}
    </button>
  );
}

// ─── Calendar icon ────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
