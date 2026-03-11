'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Save, CheckCircle2 } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import type { NotificationPrefs } from '@/app/api/user/notification-prefs/route';

/* ------------------------------------------------------------------ */
/*  Toggle row                                                          */
/* ------------------------------------------------------------------ */

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-4 py-3"
      style={{ borderBottom: '1px solid var(--wm-border)' }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--wm-navy)' }}>{label}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--wm-muted)' }}>{description}</p>
      </div>
      <div className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="h-5 w-9 rounded-full transition-colors"
          style={{
            background: checked ? 'var(--wm-primary)' : 'var(--wm-border)',
          }}
        >
          <div
            className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: checked ? 'translateX(16px)' : 'translateX(2px)' }}
          />
        </div>
      </div>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                          */
/* ------------------------------------------------------------------ */

const PREF_CONFIG: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  {
    key: 'email_new_quote',
    label: 'New quote received',
    description: 'Email when a provider submits a quote on your job.',
  },
  {
    key: 'email_quote_accepted',
    label: 'Quote accepted',
    description: 'Email when a customer accepts your quote.',
  },
  {
    key: 'email_payment_released',
    label: 'Payment released',
    description: 'Email when a customer releases payment for a completed job.',
  },
  {
    key: 'email_job_approved',
    label: 'Job approved',
    description: 'Email when your job post is approved and goes live.',
  },
  {
    key: 'email_task_alert_match',
    label: 'Task alert match',
    description: 'Email when a new job matches one of your task alerts.',
  },
  {
    key: 'email_review_received',
    label: 'Review received',
    description: 'Email when a customer leaves a review on your profile.',
  },
  {
    key: 'email_marketing',
    label: 'Product news and tips',
    description: 'Occasional emails about new features and platform updates.',
  },
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function NotificationPrefsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/user/notification-prefs');
      if (res.ok) {
        const body = await res.json() as { prefs: NotificationPrefs };
        setPrefs(body.prefs);
      }
    } catch {
      // silently fail — user sees last known state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChange = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveState('idle');
  };

  const handleSave = async () => {
    if (!prefs) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/user/notification-prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      setSaveState(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveState('idle'), 3000);
    } catch {
      setSaveState('error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div
      className="rounded-2xl"
      style={{ border: '1px solid var(--wm-border)', background: 'var(--wm-surface)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--wm-border)' }}
      >
        <Bell size={16} style={{ color: 'var(--wm-primary)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--wm-navy)' }}>
          Email notifications
        </h3>
      </div>

      {/* Toggles */}
      <div className="px-5">
        {PREF_CONFIG.map(({ key, label, description }) => (
          <ToggleRow
            key={key}
            label={label}
            description={description}
            checked={prefs[key]}
            onChange={(v) => handleChange(key, v)}
          />
        ))}
      </div>

      {/* Save button */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderTop: '1px solid var(--wm-border)' }}
      >
        {saveState === 'saved' && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--wm-primary)' }}>
            <CheckCircle2 size={14} />
            Preferences saved
          </span>
        )}
        {saveState === 'error' && (
          <span className="text-sm" style={{ color: 'var(--wm-destructive)' }}>
            Failed to save — please try again
          </span>
        )}
        {(saveState === 'idle' || saveState === 'saving') && <span />}

        <Button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          size="sm"
          leftIcon={<Save size={14} />}
        >
          {saveState === 'saving' ? 'Saving…' : 'Save preferences'}
        </Button>
      </div>
    </div>
  );
}
