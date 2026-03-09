'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { CalendarAppointment, CalendarResponse } from '@/app/api/appointments/calendar/route';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toYYYYMM(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  // YYYY-MM-DD in local calendar, matching how the API groups
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IE', {
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Dublin',
  });
}

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

// ─── Status mapping ───────────────────────────────────────────────────────────

type StatusTone = 'primary' | 'completed' | 'neutral';

function statusTone(status: CalendarAppointment['status']): StatusTone {
  if (status === 'scheduled') return 'primary';
  if (status === 'completed') return 'completed';
  return 'neutral';
}

function statusLabel(status: CalendarAppointment['status']): string {
  if (status === 'scheduled') return 'Upcoming';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
}

function statusColor(status: CalendarAppointment['status']): string {
  if (status === 'scheduled') return 'var(--wm-primary)';
  if (status === 'completed') return 'var(--wm-success, #16a34a)';
  return 'var(--wm-destructive)';
}

// ─── Calendar grid builder ────────────────────────────────────────────────────

/**
 * Returns a 6-row × 7-col grid of Date objects for the given year/month.
 * The grid always starts on Monday (ISO week convention).
 */
function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay  = new Date(year, month, 1);
  // JS: 0=Sun, convert to Mon-based index (Mon=0 … Sun=6)
  const startDow  = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];

  // Pad start
  for (let i = 0; i < startDow; i++) cells.push(null);
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Pad end to complete final row
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  role: 'customer' | 'provider';
};

export default function AppointmentCalendar({ role }: Props) {
  const today     = new Date();
  const todayStr  = toDateStr(today);

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [selectedDay, setSelectedDay]   = useState<string | null>(null);

  const monthKey = toYYYYMM(currentMonth);

  const fetchMonth = useCallback(async (month: string, r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/appointments/calendar?month=${encodeURIComponent(month)}&role=${encodeURIComponent(r)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? 'Failed to load calendar');
        setCalendarData(null);
        return;
      }
      const data: CalendarResponse = await res.json();
      setCalendarData(data);
    } catch {
      setError('Network error — please try again');
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMonth(monthKey, role);
    setSelectedDay(null);
  }, [monthKey, role, fetchMonth]);

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(todayStr);
  }

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed
  const grid  = buildCalendarGrid(year, month);

  const monthLabel = currentMonth.toLocaleDateString('en-IE', {
    month: 'long',
    year:  'numeric',
  });

  const days    = calendarData?.days ?? {};
  const dayKeys = selectedDay ? (days[selectedDay] ?? []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            '0.75rem',
        }}
      >
        <h2
          style={{
            fontSize:    '1.1rem',
            fontWeight:  700,
            fontFamily:  'var(--wm-font-display)',
            color:       'var(--wm-navy)',
            margin:      0,
          }}
        >
          {monthLabel}
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            ‹
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={nextMonth}
            aria-label="Next month"
          >
            ›
          </Button>
        </div>
      </div>

      {/* ── Loading / error banner ── */}
      {loading ? (
        <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
          Loading…
        </p>
      ) : null}

      {!loading && error ? (
        <p
          style={{
            color:        'var(--wm-destructive)',
            fontSize:     '0.875rem',
            textAlign:    'center',
            padding:      '0.5rem 0',
          }}
        >
          {error}
        </p>
      ) : null}

      {/* ── Calendar grid ── */}
      {!loading ? (
        <div
          style={{
            border:       '1px solid var(--wm-border)',
            borderRadius: '16px',
            overflow:     'hidden',
          }}
        >
          {/* Day headers */}
          <div
            style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background:          'var(--wm-surface)',
              borderBottom:        '1px solid var(--wm-border)',
            }}
          >
            {DAY_HEADERS.map((h) => (
              <div
                key={h}
                style={{
                  padding:      '0.5rem 0',
                  textAlign:    'center',
                  fontSize:     '0.7rem',
                  fontWeight:   700,
                  color:        'var(--wm-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {grid.map((row, ri) => (
            <div
              key={ri}
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                borderBottom:        ri < grid.length - 1 ? '1px solid var(--wm-border)' : 'none',
              }}
            >
              {row.map((cell, ci) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${ri}-${ci}`}
                      style={{
                        minHeight:  '80px',
                        background: 'var(--wm-surface)',
                        borderRight: ci < 6 ? '1px solid var(--wm-border)' : 'none',
                        opacity:     0.4,
                      }}
                    />
                  );
                }

                const dateStr    = toDateStr(cell);
                const isToday    = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const appts      = days[dateStr] ?? [];
                const hasAppts   = appts.length > 0;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    aria-label={`${cell.getDate()} ${monthLabel}${appts.length > 0 ? `, ${appts.length} appointment${appts.length > 1 ? 's' : ''}` : ''}`}
                    aria-pressed={isSelected}
                    style={{
                      minHeight:    '80px',
                      padding:      '0.4rem',
                      display:      'flex',
                      flexDirection: 'column',
                      gap:          '0.25rem',
                      alignItems:   'flex-start',
                      cursor:       'pointer',
                      border:       'none',
                      borderRight:  ci < 6 ? '1px solid var(--wm-border)' : 'none',
                      background:   isSelected
                        ? 'color-mix(in srgb, var(--wm-primary) 12%, transparent)'
                        : isToday
                        ? 'color-mix(in srgb, var(--wm-primary) 6%, transparent)'
                        : hasAppts
                        ? 'var(--wm-surface)'
                        : 'var(--color-background-secondary)',
                      transition:   'background 0.15s',
                      textAlign:    'left',
                      outline:      isSelected ? '2px solid var(--wm-primary)' : 'none',
                      outlineOffset: '-2px',
                    }}
                  >
                    {/* Date number */}
                    <span
                      style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        width:          '1.5rem',
                        height:         '1.5rem',
                        borderRadius:   '50%',
                        fontSize:       '0.78rem',
                        fontWeight:     isToday ? 700 : 500,
                        background:     isToday ? 'var(--wm-primary)' : 'transparent',
                        color:          isToday ? 'var(--wm-bg)' : 'var(--wm-navy)',
                        flexShrink:     0,
                      }}
                    >
                      {cell.getDate()}
                    </span>

                    {/* Appointment pills — max 2 shown */}
                    {appts.slice(0, 2).map((a) => (
                      <span
                        key={a.id}
                        title={a.other_party_name ?? a.job_title ?? a.status}
                        style={{
                          display:       'block',
                          width:         '100%',
                          padding:       '0.1rem 0.35rem',
                          borderRadius:  '4px',
                          fontSize:      '0.65rem',
                          fontWeight:    600,
                          background:    `color-mix(in srgb, ${statusColor(a.status)} 18%, transparent)`,
                          color:         statusColor(a.status),
                          overflow:      'hidden',
                          textOverflow:  'ellipsis',
                          whiteSpace:    'nowrap',
                          lineHeight:    1.3,
                        }}
                      >
                        {formatTime(a.start_time)}{' '}
                        {a.other_party_name ?? a.job_title ?? statusLabel(a.status)}
                      </span>
                    ))}

                    {/* Overflow indicator */}
                    {appts.length > 2 ? (
                      <span
                        style={{
                          fontSize:  '0.62rem',
                          color:     'var(--wm-muted)',
                          fontWeight: 500,
                        }}
                      >
                        +{appts.length - 2} more
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Selected day panel ── */}
      {selectedDay ? (
        <Card>
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              marginBottom:   '1rem',
              gap:            '0.5rem',
              flexWrap:       'wrap',
            }}
          >
            <h3
              style={{
                fontSize:   '0.95rem',
                fontWeight: 700,
                fontFamily: 'var(--wm-font-display)',
                color:      'var(--wm-navy)',
                margin:     0,
              }}
            >
              {formatFullDate(selectedDay)}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
              aria-label="Close day detail"
            >
              ✕
            </Button>
          </div>

          {dayKeys.length === 0 ? (
            <EmptyState
              title="No appointments"
              description="Nothing scheduled on this day."
              compact
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dayKeys.map((appt) => (
                <AppointmentDetailRow key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

// ─── Detail row sub-component ─────────────────────────────────────────────────

function AppointmentDetailRow({ appt }: { appt: CalendarAppointment }) {
  return (
    <div
      style={{
        display:      'flex',
        flexDirection: 'column',
        gap:          '0.4rem',
        padding:      '0.75rem',
        borderRadius: '12px',
        border:       '1px solid var(--wm-border)',
        background:   'var(--color-background-secondary)',
      }}
    >
      {/* Top row: time + status badge */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '0.6rem',
          flexWrap:    'wrap',
        }}
      >
        <span
          style={{
            fontSize:   '0.8rem',
            fontWeight: 700,
            color:      'var(--wm-navy)',
          }}
        >
          {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
        </span>
        <Badge tone={statusTone(appt.status)} dot>
          {statusLabel(appt.status)}
        </Badge>
      </div>

      {/* Job title */}
      {appt.job_title ? (
        <p
          style={{
            margin:     0,
            fontSize:   '0.82rem',
            fontWeight: 600,
            color:      'var(--wm-foreground)',
          }}
        >
          {appt.job_title}
        </p>
      ) : null}

      {/* Other party */}
      {appt.other_party_name ? (
        <p
          style={{
            margin:   0,
            fontSize: '0.78rem',
            color:    'var(--wm-muted)',
          }}
        >
          With <strong>{appt.other_party_name}</strong>
        </p>
      ) : null}

      {/* Notes */}
      {appt.notes ? (
        <p
          style={{
            margin:      0,
            fontSize:    '0.75rem',
            color:       'var(--wm-muted)',
            fontStyle:   'italic',
            lineHeight:  1.5,
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
            display:    'inline-flex',
            alignItems: 'center',
            gap:        '0.35rem',
            fontSize:   '0.75rem',
            fontWeight: 600,
            color:      'var(--wm-primary)',
            textDecoration: 'none',
          }}
        >
          <span aria-hidden="true">📹</span>
          Join video call
        </a>
      ) : null}
    </div>
  );
}
