'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type AvailabilityRow = {
  id: string;
  provider_id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  created_at: string;
};

type Props = {
  providerId: string;
};

const dayOptions = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

function formatHHMM(time: string) {
  return time.slice(0, 5);
}

export default function ProviderAvailability({ providerId }: Props) {
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const [isRecurring, setIsRecurring] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [specificDate, setSpecificDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const weeklyRows = useMemo(() => rows.filter((item) => item.is_recurring), [rows]);
  const oneTimeRows = useMemo(() => rows.filter((item) => !item.is_recurring), [rows]);

  const loadRows = async () => {
    setLoading(true);
    setError('');
    const response = await fetch(`/api/providers/${providerId}/availability`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(payload.error || 'Availability could not be loaded.');
      return;
    }

    setRows(payload.availability ?? []);
  };

  useEffect(() => {
    loadRows();
  }, [providerId]);

  const createRow = async () => {
    setPending(true);
    setError('');
    setOk('');

    try {
      const response = await fetch(`/api/providers/${providerId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_recurring: isRecurring,
          day_of_week: isRecurring ? Number(dayOfWeek) : null,
          specific_date: isRecurring ? null : specificDate || null,
          start_time: startTime,
          end_time: endTime,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Availability could not be added.');
        return;
      }

      setOk('Availability added.');
      if (!isRecurring) {
        setSpecificDate('');
      }
      await loadRows();
    } finally {
      setPending(false);
    }
  };

  const removeRow = async (id: string) => {
    setPending(true);
    setError('');
    setOk('');

    try {
      const response = await fetch(`/api/providers/${providerId}/availability?id=${id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'Availability could not be removed.');
        return;
      }

      setOk('Availability removed.');
      await loadRows();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="rounded-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3>Provider Availability</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Set your weekly and one-time slots for appointment booking.
          </p>
        </div>
        <Badge tone="assigned">Scheduler</Badge>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={isRecurring ? 'primary' : 'secondary'}
            onClick={() => setIsRecurring(true)}
            disabled={pending}
          >
            Weekly recurring
          </Button>
          <Button
            size="sm"
            variant={!isRecurring ? 'primary' : 'secondary'}
            onClick={() => setIsRecurring(false)}
            disabled={pending}
          >
            One-time date
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          {isRecurring ? (
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(event.target.value)}
              disabled={pending}
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={specificDate}
              onChange={(event) => setSpecificDate(event.target.value)}
              disabled={pending}
            />
          )}

          <input
            type="time"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            disabled={pending}
          />
          <input
            type="time"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            disabled={pending}
          />

          <Button variant="primary" onClick={createRow} disabled={pending}>
            Add slot
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-sm font-semibold">Weekly recurring</p>
          <div className="mt-2 space-y-2">
            {weeklyRows.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No weekly slots yet.</p>
            ) : (
              weeklyRows.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
                  <p className="text-sm">
                    {dayOptions.find((option) => option.value === slot.day_of_week)?.label ?? 'Day'}
                    {' '}
                    {formatHHMM(slot.start_time)}-{formatHHMM(slot.end_time)}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => removeRow(slot.id)} disabled={pending}>
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-sm font-semibold">One-time dates</p>
          <div className="mt-2 space-y-2">
            {oneTimeRows.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No one-time slots yet.</p>
            ) : (
              oneTimeRows.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
                  <p className="text-sm">
                    {slot.specific_date} {formatHHMM(slot.start_time)}-{formatHHMM(slot.end_time)}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => removeRow(slot.id)} disabled={pending}>
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loading ? <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Loading availability...</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {ok ? <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{ok}</p> : null}
    </Card>
  );
}
