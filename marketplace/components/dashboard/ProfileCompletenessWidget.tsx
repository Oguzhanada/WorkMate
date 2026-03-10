'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import ProgressBar from '@/components/ui/ProgressBar';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

type CheckResult = {
  key: string;
  label: string;
  points: number;
  complete: boolean;
  href: string;
};

type CompletenessData = {
  score: number;
  maxScore: number;
  percentage: number;
  checks: CheckResult[];
};

export default function ProfileCompletenessWidget() {
  const [data, setData] = useState<CompletenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();
  const localeRoot = getLocaleRoot(pathname ?? '/');

  useEffect(() => {
    fetch('/api/profile/completeness')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json() as Promise<CompletenessData>;
      })
      .then((payload) => setData(payload))
      .catch(() => setError('Could not load profile completeness.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', margin: 0 }}>
        Loading profile score...
      </p>
    );
  }

  if (error || !data) {
    return (
      <p style={{ color: 'var(--wm-danger, #dc2626)', fontSize: '0.875rem', margin: 0 }}>
        {error || 'No data available.'}
      </p>
    );
  }

  const { percentage, score, maxScore, checks } = data;

  const scoreColor =
    percentage >= 80
      ? 'var(--wm-success, #16a34a)'
      : percentage >= 50
        ? 'var(--wm-warning, #d97706)'
        : 'var(--wm-danger, #dc2626)';

  const incomplete = checks.filter((c) => !c.complete);
  const complete = checks.filter((c) => c.complete);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Score headline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 800,
              color: scoreColor,
              lineHeight: 1,
              fontFamily: 'var(--wm-font-display, inherit)',
            }}
          >
            {percentage}%
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--wm-muted)', fontWeight: 600 }}>
            Profile complete
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--wm-muted)' }}>
            Score
          </p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--wm-foreground)' }}>
            {score} / {maxScore}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={score} max={maxScore} />

      {/* Incomplete items */}
      {incomplete.length > 0 ? (
        <div>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--wm-muted)',
            }}
          >
            To-do
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {incomplete.map((check) => (
              <li key={check.key}>
                <Link
                  href={withLocalePrefix(localeRoot, check.href)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    border: '1px solid var(--wm-border)',
                    background: 'var(--wm-surface)',
                    transition: 'var(--wm-transition-spring, 0.2s ease)',
                  }}
                >
                  <Circle
                    size={15}
                    style={{ color: 'var(--wm-muted)', flexShrink: 0 }}
                    aria-hidden="true"
                  />
                  <span style={{ fontSize: '0.83rem', color: 'var(--wm-foreground)', flex: 1 }}>
                    {check.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--wm-primary-dark)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    +{check.points} pts
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Completed items */}
      {complete.length > 0 ? (
        <div>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--wm-muted)',
            }}
          >
            Completed
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {complete.map((check) => (
              <li
                key={check.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.5rem',
                }}
              >
                <CheckCircle2
                  size={15}
                  style={{ color: 'var(--wm-success, #16a34a)', flexShrink: 0 }}
                  aria-hidden="true"
                />
                <span style={{ fontSize: '0.83rem', color: 'var(--wm-muted)' }}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
