import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Card({ title, subtitle, children, actions }: CardProps) {
  return (
    <article
      style={{
        background: 'var(--cd-bg-primary)',
        border: '1px solid var(--cd-border-default)',
        borderRadius: 'var(--cd-radius-lg)',
        boxShadow: 'var(--cd-shadow-md)',
        padding: 'var(--cd-space-4)',
        display: 'grid',
        gap: 'var(--cd-space-3)',
      }}
    >
      {(title || subtitle) ? (
        <header style={{ display: 'grid', gap: 4 }}>
          {title ? (
            <h3
              style={{
                margin: 0,
                color: 'var(--cd-text-primary)',
                fontFamily: 'var(--cd-font-heading)',
                fontSize: 'var(--cd-font-size-lg)',
                lineHeight: 1.25,
              }}
            >
              {title}
            </h3>
          ) : null}
          {subtitle ? (
            <p style={{ margin: 0, color: 'var(--cd-text-secondary)', fontSize: 'var(--cd-font-size-sm)' }}>
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}

      <div>{children}</div>

      {actions ? <footer>{actions}</footer> : null}
    </article>
  );
}

export default Card;
