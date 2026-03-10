import { ReactNode } from 'react';

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
};

/**
 * Consistent section card for profile tab content.
 * Uses WorkMate design tokens exclusively.
 */
export default function ProfileSection({ id, title, subtitle, badge, children }: Props) {
  return (
    <section
      id={id}
      className="rounded-2xl p-6"
      style={{
        background: 'var(--wm-surface)',
        border: '1px solid var(--wm-border)',
        boxShadow: 'var(--wm-shadow-md)',
      }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className="m-0 text-base font-bold"
            style={{
              fontFamily: 'var(--wm-font-display)',
              color: 'var(--wm-navy)',
              letterSpacing: '-0.015em',
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {badge}
      </div>
      <div
        className="h-px w-full"
        style={{ background: 'var(--wm-border)', marginBottom: 20 }}
      />
      {children}
    </section>
  );
}
