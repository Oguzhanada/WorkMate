'use client';

import { useEffect, useState, useCallback } from 'react';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import AlertBanner from '@/components/ui/AlertBanner';
import type { DetailedHealthResponse, HealthCheckResult, ServiceStatus } from '@/lib/monitoring/health-checks';

const REFRESH_INTERVAL_MS = 60_000;

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; tone: 'completed' | 'amber' | 'pending' | 'neutral'; dot: string }
> = {
  healthy: { label: 'Healthy', tone: 'completed', dot: 'var(--wm-primary)' },
  degraded: { label: 'Degraded', tone: 'amber', dot: 'var(--wm-amber)' },
  down: { label: 'Down', tone: 'pending', dot: 'var(--wm-destructive)' },
  disabled: { label: 'Disabled', tone: 'neutral', dot: 'var(--wm-subtle)' },
};

const DASHBOARD_LINKS: Record<string, { label: string; url: string }> = {
  Supabase: { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard' },
  Stripe: { label: 'Stripe Dashboard', url: 'https://dashboard.stripe.com' },
  Resend: { label: 'Resend Dashboard', url: 'https://resend.com' },
  Anthropic: { label: 'Anthropic Console', url: 'https://console.anthropic.com' },
  Sentry: { label: 'Sentry Dashboard', url: 'https://sentry.io' },
  IdealPostcodes: { label: 'IdealPostcodes Dashboard', url: 'https://ideal-postcodes.co.uk/dashboard' },
  Vercel: { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
};

function ServiceCard({ service }: { service: HealthCheckResult }) {
  const config = STATUS_CONFIG[service.status];
  const link = DASHBOARD_LINKS[service.name];

  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border p-5"
      style={{
        borderColor: 'var(--wm-border)',
        background: 'var(--wm-surface)',
        boxShadow: 'var(--wm-shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: config.dot,
              boxShadow: service.status === 'healthy' ? `0 0 0 0 ${config.dot}` : undefined,
              animation: service.status === 'healthy' ? 'statusPulse 2s infinite' : undefined,
            }}
          />
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--wm-text-strong)', fontFamily: 'var(--wm-font-display)' }}
          >
            {service.name}
          </h3>
        </div>
        <Badge tone={config.tone}>{config.label}</Badge>
      </div>

      {/* Details */}
      <div className="space-y-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
        {service.status !== 'disabled' && (
          <p>
            Latency: <strong style={{ color: 'var(--wm-text-default)' }}>{service.latency_ms}ms</strong>
          </p>
        )}
        <p>
          Last check:{' '}
          <span style={{ color: 'var(--wm-text-default)' }}>
            {new Date(service.checked_at).toLocaleTimeString()}
          </span>
        </p>
        {service.message && (
          <p
            className="mt-1 rounded-lg px-3 py-2 text-xs"
            style={{
              background: service.status === 'down' ? 'var(--wm-destructive-light)' : 'var(--wm-surface-alt)',
              color: service.status === 'down' ? 'var(--wm-destructive)' : 'var(--wm-muted)',
            }}
          >
            {service.message}
          </p>
        )}
      </div>

      {/* External link */}
      {link && (
        <Button
          href={link.url}
          external
          variant="ghost"
          size="sm"
          className="mt-auto"
          rightIcon={<span aria-hidden="true">&rarr;</span>}
        >
          {link.label}
        </Button>
      )}
    </div>
  );
}

export default function AdminStatusPage() {
  const [data, setData] = useState<DetailedHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async (fresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/health?detailed=true${fresh ? '&fresh=true' : ''}`;
      const res = await fetch(url);

      if (res.status === 401 || res.status === 403) {
        setError('You do not have permission to view this page.');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Still show service data if available (503 with detailed payload)
        if (body.services) {
          setData(body as DetailedHealthResponse);
          return;
        }
        setError(body.message || body.error || `Request failed (${res.status})`);
        return;
      }

      setData(await res.json());
    } catch {
      setError('Failed to reach health endpoint');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallConfig = data ? STATUS_CONFIG[data.status] : null;

  return (
    <Shell>
      <PageHeader
        title="Service Status"
        description="Real-time health overview of all platform integrations."
      />

      {/* Toolbar */}
      <div
        className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3"
        style={{
          borderColor: 'var(--wm-border)',
          background: 'var(--wm-surface)',
          boxShadow: 'var(--wm-shadow-xs)',
        }}
      >
        <div className="flex items-center gap-3">
          {overallConfig && (
            <>
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{
                  backgroundColor: overallConfig.dot,
                  animation: data?.status === 'healthy' ? 'statusPulse 2s infinite' : undefined,
                }}
              />
              <span className="text-sm font-semibold" style={{ color: 'var(--wm-text-default)' }}>
                {overallConfig.label === 'Healthy' ? 'All Systems Operational' : `Overall: ${overallConfig.label}`}
              </span>
            </>
          )}
          {data && (
            <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
              Updated {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--wm-subtle)' }}>
            Auto-refreshes every 60s
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchHealth(true)}
            disabled={loading}
          >
            {loading ? 'Checking\u2026' : 'Refresh Now'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6">
          <AlertBanner
            variant="error"
            title="Health check failed"
            description={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Service grid */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      )}

      {/* Loading skeleton on first load */}
      {loading && !data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl"
              style={{ background: 'var(--wm-surface-alt)' }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes statusPulse {
          0%   { box-shadow: 0 0 0 0 rgba(22,155,98,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(22,155,98,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,155,98,0); }
        }
      `}</style>
    </Shell>
  );
}
