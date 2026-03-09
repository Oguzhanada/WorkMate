"use client";

import Button from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & {digest?: string};
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{margin: 0, fontFamily: 'Poppins, sans-serif', background: 'var(--wm-bg)'}}>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }}
        >
          <section
            style={{
              width: 'min(560px, 100%)',
              background: 'var(--wm-surface)',
              borderRadius: '16px',
              boxShadow: 'var(--wm-shadow-lg)',
              padding: '24px'
            }}
          >
            <h1 style={{marginTop: 0, color: 'var(--wm-navy)'}}>Something went wrong</h1>
            <p style={{color: 'var(--wm-text-default)'}}>An unexpected error occurred. Please try again.</p>
            {error.digest ? <p style={{color: 'var(--wm-muted)'}}>Ref: {error.digest}</p> : null}
            <Button
              variant="primary"
              onClick={() => reset()}
            >
              Retry
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
