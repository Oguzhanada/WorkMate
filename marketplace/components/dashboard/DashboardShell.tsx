'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import type { DashboardWidgetRow } from '@/components/dashboard/widget-types';
import {
  getAllowedWidgetTypes,
  getWidgetLabel,
  type DashboardMode,
  type WidgetType,
} from '@/lib/dashboard/widgets';

type Props = {
  mode: DashboardMode;
  title: string;
  description: string;
};

export default function DashboardShell({ mode, title, description }: Props) {
  const [widgets, setWidgets] = useState<DashboardWidgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const allowed = useMemo(() => getAllowedWidgetTypes(mode), [mode]);

  const loadWidgets = async () => {
    setLoading(true);
    setError('');

    const response = await fetch(`/api/user/dashboard/widgets?mode=${mode}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));

    setLoading(false);
    if (!response.ok) {
      setError(payload.error || 'Widgets could not be loaded.');
      return;
    }

    const sorted = (payload.widgets ?? []).sort((a: DashboardWidgetRow, b: DashboardWidgetRow) => {
      const ay = a.position?.y ?? 0;
      const by = b.position?.y ?? 0;
      return ay - by;
    });

    setWidgets(sorted);
  };

  useEffect(() => {
    void loadWidgets();
  }, [mode]);

  const savePositions = async (nextWidgets: DashboardWidgetRow[]) => {
    setWidgets(nextWidgets);
    setSaving(true);
    setError('');

    try {
      await Promise.all(
        nextWidgets.map((widget, index) =>
          fetch(`/api/user/dashboard/widgets/${widget.id}?mode=${mode}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position: {
                ...(widget.position ?? { x: 0, y: index, w: 6, h: 2 }),
                y: index,
              },
            }),
          })
        )
      );
      setOk('Widget layout saved.');
    } catch {
      setError('Widget layout could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const addWidget = async (widgetType: WidgetType) => {
    setSaving(true);
    setError('');
    setOk('');

    const response = await fetch(`/api/user/dashboard/widgets?mode=${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_type: widgetType,
        position: { x: 0, y: widgets.length, w: 6, h: 2 },
        settings: {},
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || 'Widget could not be added.');
      return;
    }

    setOk('Widget added.');
    await loadWidgets();
  };

  const removeWidget = async (widgetId: string) => {
    setSaving(true);
    setError('');
    setOk('');

    const response = await fetch(`/api/user/dashboard/widgets/${widgetId}?mode=${mode}`, {
      method: 'DELETE',
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(payload.error || 'Widget could not be removed.');
      return;
    }

    setOk('Widget removed.');
    await loadWidgets();
  };

  const addableTypes = allowed.filter(
    (widgetType) => !widgets.some((widget) => widget.widget_type === widgetType)
  );

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadWidgets} disabled={loading || saving}>
            Refresh
          </Button>
          {addableTypes.map((widgetType) => (
            <Button
              key={widgetType}
              size="sm"
              variant="ghost"
              onClick={() => addWidget(widgetType)}
              disabled={saving}
            >
              Add {getWidgetLabel(widgetType)}
            </Button>
          ))}
        </div>

        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {ok ? <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{ok}</p> : null}
      </div>

      {loading ? <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading dashboard...</p> : null}
      {!loading ? (
        <WidgetGrid widgets={widgets} onReorder={savePositions} onRemove={removeWidget} disabled={saving} />
      ) : null}
    </section>
  );
}
