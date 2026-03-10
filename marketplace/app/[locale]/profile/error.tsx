'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center"
    >
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: 'var(--wm-danger-faint, rgba(239, 68, 68, 0.08))',
        }}
      >
        <AlertTriangle
          className="h-8 w-8"
          style={{ color: 'var(--wm-danger, #ef4444)' }}
        />
      </div>

      <h2
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
      >
        Something went wrong loading your profile
      </h2>

      <p
        className="mt-2 text-sm leading-relaxed"
        style={{ color: 'var(--wm-muted)' }}
      >
        We could not load your profile information. This is usually temporary —
        please try refreshing the page.
      </p>

      <div className="mt-6 flex gap-3">
        <Button variant="primary" onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button variant="secondary" href="/">
          <Home className="mr-2 h-4 w-4" />
          Go home
        </Button>
      </div>
    </div>
  );
}
