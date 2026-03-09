'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { trackFunnelStep, FUNNEL_BOOKING } from '@/lib/analytics/funnel';

type AvailabilityRow = {
  id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
};

type AppointmentRow = {
  id: string;
  job_id: string;
  provider_id: string;
  customer_id: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
};

type Props = {
  jobId: string;
  providerId: string | null;
  isCustomer: boolean;
  isProvider: boolean;
  isAdmin: boolean;
};

type Slot = {
  key: string;
  startIso: string;
  endIso: string;
  label: string;
};

const SLOT_MINUTES = 60;

function toHHMM(value: string) {
  return value.slice(0, 5);
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (total % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function localDateToDow(dateText: string) {
  const [y, m, d] = dateText.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function buildSlotsForDate(dateText: string, availability: AvailabilityRow[]) {
  const dow = localDateToDow(dateText);
  const rows = availability.filter((row) => {
    if (row.is_recurring) return row.day_of_week === dow;
    return row.specific_date === dateText;
  });

  const slots: Slot[] = [];
  for (const row of rows) {
    let cursor = toMinutes(toHHMM(row.start_time));
    const limit = toMinutes(toHHMM(row.end_time));

    while (cursor + SLOT_MINUTES <= limit) {
      const startLocal = `${dateText}T${fromMinutes(cursor)}:00`;
      const endLocal = `${dateText}T${fromMinutes(cursor + SLOT_MINUTES)}:00`;
      const startIso = new Date(startLocal).toISOString();
      const endIso = new Date(endLocal).toISOString();
      slots.push({
        key: `${row.id}-${cursor}`,
        startIso,
        endIso,
        label: `${fromMinutes(cursor)}-${fromMinutes(cursor + SLOT_MINUTES)}`,
      });
      cursor += SLOT_MINUTES;
    }
  }

  return slots;
}

function dublinTodayIsoDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function JobScheduler({ jobId, providerId, isCustomer, isProvider, isAdmin }: Props) {
  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(dublinTodayIsoDate());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const slots = useMemo(
    () => buildSlotsForDate(selectedDate, availability),
    [selectedDate, availability]
  );

  const loadData = async () => {
    if (!providerId) {
      setAvailability([]);
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const [availabilityRes, appointmentsRes] = await Promise.all([
      fetch(`/api/providers/${providerId}/availability`, { cache: 'no-store' }),
      fetch(`/api/jobs/${jobId}/appointments`, { cache: 'no-store' }),
    ]);

    const availabilityPayload = await availabilityRes.json().catch(() => ({}));
    const appointmentsPayload = await appointmentsRes.json().catch(() => ({}));

    setLoading(false);

    if (!availabilityRes.ok) {
      setError(availabilityPayload.error || 'Availability could not be loaded.');
      return;
    }

    if (!appointmentsRes.ok) {
      setError(appointmentsPayload.error || 'Appointments could not be loaded.');
      return;
    }

    setAvailability(availabilityPayload.availability ?? []);
    setAppointments(appointmentsPayload.appointments ?? []);
  };

  useEffect(() => {
    loadData();
    // Fire-and-forget: track booking funnel start when scheduler mounts with a provider
    if (providerId) {
      trackFunnelStep({
        funnelName: FUNNEL_BOOKING,
        stepName: 'booking_started',
        stepNumber: 1,
        metadata: { has_provider: true },
      });
    }
  }, [providerId, jobId]);

  const createAppointment = async () => {
    if (!selectedSlot) {
      setError('Please choose a slot first.');
      return;
    }

    setPending(true);
    setError('');
    setOk('');

    try {
      const response = await fetch(`/api/jobs/${jobId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: selectedSlot.startIso,
          end_time: selectedSlot.endIso,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Appointment could not be created.');
        return;
      }

      setSelectedSlot(null);
      setOk('Appointment booked.');
      // Fire-and-forget: track successful booking submission
      trackFunnelStep({
        funnelName: FUNNEL_BOOKING,
        stepName: 'booking_submitted',
        stepNumber: 3,
      });
      await loadData();
    } finally {
      setPending(false);
    }
  };

  const updateAppointment = async (appointmentId: string, status: 'cancelled' | 'completed') => {
    setPending(true);
    setError('');
    setOk('');

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Appointment update failed.');
        return;
      }

      setOk(status === 'cancelled' ? 'Appointment cancelled.' : 'Appointment completed.');
      await loadData();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3>Appointment Scheduler</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
            Book and manage appointments based on provider availability.
          </p>
        </div>
        <Badge tone="assigned">Scheduling</Badge>
      </div>

      {!providerId ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--wm-muted)' }}>
          A provider must be assigned to this job before scheduling.
        </p>
      ) : null}

      {providerId && (isCustomer || isAdmin) ? (
        <div className="mt-4 rounded-xl p-3" style={{ border: '1px solid var(--wm-border)' }}>
          <p className="text-sm font-medium">Book a new slot</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              min={dublinTodayIsoDate()}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setSelectedSlot(null);
                // Fire-and-forget: track date selection
                trackFunnelStep({
                  funnelName: FUNNEL_BOOKING,
                  stepName: 'date_selected',
                  stepNumber: 2,
                });
              }}
              disabled={pending}
            />
            <Button variant="primary" onClick={createAppointment} disabled={pending || !selectedSlot}>
              Book selected slot
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {slots.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>No slots available for this day.</p>
            ) : (
              slots.map((slot) => (
                <button
                  key={slot.key}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    selectedSlot?.key === slot.key
                      ? 'border-[var(--wm-primary)] bg-[var(--wm-primary-faint)] text-[var(--wm-primary-dark)]'
                      : 'border-[var(--wm-border)] text-[var(--wm-text)]'
                  }`}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={pending}
                >
                  {slot.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">Appointments</p>
        {appointments.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>No appointments yet.</p>
        ) : (
          appointments.map((item) => (
            <div key={item.id} className="rounded-xl p-3" style={{ border: '1px solid var(--wm-border)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {new Date(item.start_time).toLocaleString('en-IE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {' -> '}
                  {new Date(item.end_time).toLocaleString('en-IE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <Badge
                  tone={
                    item.status === 'scheduled'
                      ? 'pending'
                      : item.status === 'completed'
                      ? 'completed'
                      : 'neutral'
                  }
                >
                  {item.status}
                </Badge>
              </div>

              {item.status === 'scheduled' && (isCustomer || isProvider || isAdmin) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateAppointment(item.id, 'cancelled')}
                    disabled={pending}
                  >
                    Cancel
                  </Button>
                  {(isProvider || isCustomer || isAdmin) ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateAppointment(item.id, 'completed')}
                      disabled={pending}
                    >
                      Mark completed
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {loading ? <p className="mt-3 text-sm" style={{ color: 'var(--wm-muted)' }}>Loading schedule...</p> : null}
      {error ? <p className="mt-3 text-sm text-[var(--wm-destructive)]">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm" style={{ color: 'var(--wm-primary)' }}>{ok}</p> : null}
    </Card>
  );
}
