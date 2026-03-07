import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: number | string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accent?: 'primary' | 'amber' | 'blue' | 'navy';
};

const accentTokens = {
  primary: {bg: 'var(--wm-primary-light)', icon: 'var(--wm-primary)', border: 'rgba(0,184,148,0.20)'},
  amber:   {bg: 'var(--wm-amber-light)',   icon: 'var(--wm-amber-dark)', border: 'rgba(245,158,11,0.20)'},
  blue:    {bg: 'var(--wm-blue-soft)',     icon: 'var(--wm-blue)',       border: 'rgba(26,86,219,0.18)'},
  navy:    {bg: 'rgba(12,27,51,0.07)',     icon: 'var(--wm-navy)',       border: 'rgba(12,27,51,0.14)'}
};

const trendClasses = {
  up:      'text-[var(--wm-primary-dark)]',
  down:    'text-[var(--wm-destructive)]',
  neutral: 'text-[var(--wm-muted)]'
};

const trendIcons = {up: '↑', down: '↓', neutral: '→'};

export default function StatCard({ label, value, icon, trend, trendLabel, accent = 'primary' }: StatCardProps) {
  const colors = accentTokens[accent];

  return (
    <article
      className="rounded-2xl border bg-white p-5 dark:bg-zinc-900/80"
      style={{
        borderColor: colors.border,
        boxShadow: 'var(--wm-shadow-md)',
        transition: 'box-shadow var(--wm-transition-slow), transform var(--wm-transition-slow)'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--wm-shadow-xl)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--wm-shadow-md)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-xs font-bold uppercase tracking-wider"
          style={{color: 'var(--wm-muted)', fontFamily: 'var(--wm-font-display)'}}
        >
          {label}
        </p>
        {icon ? (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{backgroundColor: colors.bg, color: colors.icon}}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p
        className="mt-3 text-3xl font-black leading-none tracking-tight"
        style={{fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)'}}
      >
        {value}
      </p>
      {trend && trendLabel ? (
        <p className={`mt-2 text-xs font-semibold ${trendClasses[trend]}`}>
          {trendIcons[trend]} {trendLabel}
        </p>
      ) : null}
    </article>
  );
}
