'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
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

function getLocaleRoot(pathname: string) {
  const match = pathname.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)(?:\/|$)/);
  if (!match?.[1]) return '/';
  return `/${match[1]}`;
}

export default function DashboardShell({ mode, title, description }: Props) {
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);
  const [widgets, setWidgets] = useState<DashboardWidgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allowed = useMemo(() => getAllowedWidgetTypes(mode), [mode]);

  const loadWidgets = async () => {
    setLoading(true);

    const response = await fetch(`/api/user/dashboard/widgets?mode=${mode}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));

    setLoading(false);
    if (!response.ok) {
      toast.error(payload.error || 'Widgets could not be loaded.');
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
      toast.success('Widget layout saved.');
    } catch {
      toast.error('Widget layout could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const addWidget = async (widgetType: WidgetType) => {
    setSaving(true);

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
      toast.error(payload.error || 'Widget could not be added.');
      return;
    }

    toast.success('Widget added.');
    await loadWidgets();
  };

  const removeWidget = async (widgetId: string) => {
    setSaving(true);

    const response = await fetch(`/api/user/dashboard/widgets/${widgetId}?mode=${mode}`, {
      method: 'DELETE',
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error || 'Widget could not be removed.');
      return;
    }

    toast.success('Widget removed.');
    await loadWidgets();
  };

  const addableTypes = allowed.filter(
    (widgetType) => !widgets.some((widget) => widget.widget_type === widgetType)
  );

  return (
    <section className="space-y-4">
      <div
        className="rounded-[1.6rem] p-8"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          border: '1px solid var(--wm-border)',
          boxShadow: 'var(--wm-shadow-lg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--wm-font-display)', color: '#0f172a', letterSpacing: '-0.03em' }}
            >
              {title}
            </h1>
            <p className="mt-1 text-base" style={{ color: '#475569' }}>{description}</p>
          </div>
          {mode === 'customer' ? (
            <Button href={`${localeRoot}/post-job`} variant="navy" size="md">
              + Post a Job
            </Button>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={loadWidgets} disabled={loading || saving} loading={loading}>
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
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-6"
              style={{
                border: '1px solid var(--wm-border)',
                background: 'rgba(255, 255, 255, 0.5)',
                boxShadow: 'var(--wm-shadow-xs)',
              }}
            >
              <Skeleton lines={1} height="h-4" className="w-1/3" />
              <div className="mt-4">
                <Skeleton lines={3} height="h-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <WidgetGrid widgets={widgets} onReorder={savePositions} onRemove={removeWidget} disabled={saving} />
      )}
    </section>
  );
}
