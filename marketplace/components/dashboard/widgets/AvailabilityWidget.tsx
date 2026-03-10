'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

// 0 = Sunday … 6 = Saturday (matches DB day_of_week)
const DAY_LABELS: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

// Ordered Mon–Sun for the UI grid
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

type DayConfig = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

function buildDefaults(): DayConfig[] {
  return ORDERED_DAYS.map((day) => ({
    day_of_week: day,
    start_time: '09:00',
    end_time: '18:00',
    is_available: day >= 1 && day <= 5, // Mon–Fri available by default
  }));
}

function mergeSaved(saved: DayConfig[]): DayConfig[] {
  const base = buildDefaults();
  return base.map((def) => {
    const found = saved.find((s) => s.day_of_week === def.day_of_week);
    return found ? { ...def, ...found } : def;
  });
}

export default function AvailabilityWidget() {
  const [days, setDays] = useState<DayConfig[]>(buildDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/profile/availability')
      .then((res) => res.json())
      .then((payload: { availability?: DayConfig[] }) => {
        if (payload.availability && payload.availability.length > 0) {
          setDays(mergeSaved(payload.availability));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleDay(dayOfWeek: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.day_of_week === dayOfWeek ? { ...d, is_available: !d.is_available } : d
      )
    );
    setSavedAt(null);
  }

  function updateTime(dayOfWeek: number, field: 'start_time' | 'end_time', value: string) {
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, [field]: value } : d))
    );
    setSavedAt(null);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/profile/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(days),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? 'Failed to save schedule');
      } else {
        setSavedAt(new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', margin: 0 }}>
        Loading schedule…
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '6rem 3rem 1fr auto 1fr',
          gap: '0.5rem',
          alignItems: 'center',
          paddingBottom: '0.35rem',
          borderBottom: '1px solid var(--wm-border)',
          marginBottom: '0.25rem',
        }}
      >
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Day
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
          On
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          From
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
          –
        </span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--wm-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Until
        </span>
      </div>

      {/* Day rows */}
      {days.map((day) => {
        const dim = !day.is_available;
        return (
          <div
            key={day.day_of_week}
            style={{
              display: 'grid',
              gridTemplateColumns: '6rem 3rem 1fr auto 1fr',
              gap: '0.5rem',
              alignItems: 'center',
              opacity: dim ? 0.45 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {/* Day name */}
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--wm-foreground)',
                whiteSpace: 'nowrap',
              }}
            >
              {DAY_LABELS[day.day_of_week]}
            </span>

            {/* Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                role="switch"
                aria-checked={day.is_available}
                onClick={() => toggleDay(day.day_of_week)}
                style={{
                  width: '2.25rem',
                  height: '1.25rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  background: day.is_available
                    ? 'var(--wm-primary)'
                    : 'var(--wm-border)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                aria-label={`${day.is_available ? 'Disable' : 'Enable'} ${DAY_LABELS[day.day_of_week]}`}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '0.125rem',
                    left: day.is_available ? 'calc(100% - 1.125rem)' : '0.125rem',
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    background: 'var(--wm-bg)',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>

            {/* Start time */}
            <input
              type="time"
              value={day.start_time}
              disabled={dim}
              onChange={(e) => updateTime(day.day_of_week, 'start_time', e.target.value)}
              style={{
                width: '100%',
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--wm-border)',
                background: dim ? 'var(--wm-surface)' : 'var(--wm-background)',
                color: 'var(--wm-foreground)',
                fontSize: '0.82rem',
                cursor: dim ? 'not-allowed' : 'text',
              }}
              aria-label={`${DAY_LABELS[day.day_of_week]} start time`}
            />

            {/* Separator */}
            <span style={{ textAlign: 'center', color: 'var(--wm-muted)', fontSize: '0.75rem' }}>
              –
            </span>

            {/* End time */}
            <input
              type="time"
              value={day.end_time}
              disabled={dim}
              onChange={(e) => updateTime(day.day_of_week, 'end_time', e.target.value)}
              style={{
                width: '100%',
                padding: '0.3rem 0.5rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--wm-border)',
                background: dim ? 'var(--wm-surface)' : 'var(--wm-background)',
                color: 'var(--wm-foreground)',
                fontSize: '0.82rem',
                cursor: dim ? 'not-allowed' : 'text',
              }}
              aria-label={`${DAY_LABELS[day.day_of_week]} end time`}
            />
          </div>
        );
      })}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '0.75rem',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        {error ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--wm-error, #dc2626)' }}>{error}</span>
        ) : savedAt ? (
          <span style={{ fontSize: '0.78rem', color: 'var(--wm-success, #16a34a)' }}>
            Saved at {savedAt}
          </span>
        ) : (
          <span />
        )}
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
        >
          {saving ? 'Saving…' : 'Save Schedule'}
        </Button>
      </div>
    </div>
  );
}
