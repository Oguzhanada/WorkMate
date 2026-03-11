'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
};

export default function ErrorBoundaryPage({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
}: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'var(--wm-destructive)', opacity: 0.1 }}
        aria-hidden
      />
      <div
        className="mb-2 flex h-14 w-14 -mt-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'var(--wm-primary-light)', color: 'var(--wm-primary)' }}
        aria-hidden
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2
        className="mt-4 text-xl font-bold"
        style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
      >
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
        {description}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs font-mono" style={{ color: 'var(--wm-subtle)' }}>
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="primary" onClick={reset} size="md">
          Try again
        </Button>
        <Button variant="ghost" href="/" size="md">
          Go home
        </Button>
      </div>
    </main>
  );
}
