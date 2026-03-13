'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Design tokens (admin content area palette) ────────────────────────────────
const T = {
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardRadius: '14px',
  cardShadow: '0 1px 3px rgba(0,0,0,0.07)',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  emerald: '#169B62',
  emeraldBg: 'rgba(22,155,98,0.10)',
  navy: '#1B2A4A',
  amber: '#d97706',
  amberBg: 'rgba(217,119,6,0.10)',
  sky: '#0284c7',
  skyBg: 'rgba(2,132,199,0.10)',
  headerBg: '#f8fafc',
} as const;

type CalendarEvent = {
  date: string; // YYYY-MM-DD
  label: string;
  color?: string;
};

type Props = {
  events?: CalendarEvent[];
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function AdminCalendar({ events = [] }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cells = buildCalendarGrid(year, month);

  // Build event index: date -> events[]
  const eventMap: Record<string, CalendarEvent[]> = {};
  for (const evt of events) {
    if (!eventMap[evt.date]) eventMap[evt.date] = [];
    eventMap[evt.date].push(evt);
  }

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div
      style={{
        background: T.cardBg,
        border: `1.5px solid ${T.cardBorder}`,
        borderRadius: T.cardRadius,
        boxShadow: T.cardShadow,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: `1px solid ${T.border}`,
          background: T.headerBg,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            border: `1px solid ${T.border}`,
            background: T.cardBg,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.muted,
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>

        <h3
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 700,
            color: T.text,
          }}
        >
          {MONTHS[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            border: `1px solid ${T.border}`,
            background: T.cardBg,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.muted,
          }}
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Weekday headers ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '8px 12px 4px',
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: T.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '4px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '0 12px 12px',
          gap: '2px',
        }}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const isoDate = toISO(year, month, day);
          const isToday = isoDate === todayISO;
          const dayEvents = eventMap[isoDate] ?? [];

          return (
            <div
              key={isoDate}
              style={{
                borderRadius: '8px',
                padding: '4px 3px 3px',
                minHeight: '36px',
                background: isToday ? T.emerald : 'transparent',
                position: 'relative',
                cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                transition: 'background 0.12s',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  fontWeight: isToday ? 800 : 400,
                  color: isToday ? '#fff' : T.text,
                  textAlign: 'center',
                  lineHeight: '16px',
                }}
              >
                {day}
              </p>
              {/* Event dots */}
              {dayEvents.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '2px',
                    marginTop: '2px',
                    flexWrap: 'wrap',
                  }}
                >
                  {dayEvents.slice(0, 3).map((evt, j) => (
                    <div
                      key={j}
                      title={evt.label}
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: isToday ? '#fff' : (evt.color ?? T.sky),
                        flexShrink: 0,
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span
                      style={{
                        fontSize: '8px',
                        color: isToday ? '#fff' : T.muted,
                        lineHeight: '5px',
                      }}
                    >
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend / quick stats ── */}
      <div
        style={{
          borderTop: `1px solid ${T.border}`,
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: T.emerald,
            }}
          />
          <span style={{ fontSize: '10px', color: T.muted }}>Today</span>
        </div>
        {events.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: T.sky,
              }}
            />
            <span style={{ fontSize: '10px', color: T.muted }}>
              {events.length} event{events.length !== 1 ? 's' : ''} this month
            </span>
          </div>
        )}
        {events.length === 0 && (
          <span style={{ fontSize: '10px', color: T.muted }}>
            No events this month
          </span>
        )}
      </div>
    </div>
  );
}
