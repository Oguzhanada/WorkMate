"use client";

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Shell from '@/components/ui/Shell';

export default function LocaleError({ reset }: { reset: () => void }) {
  return (
    <Shell>
      <Card className="mx-auto max-w-md text-center">
        <p className="text-4xl font-bold" style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}>500</p>
        <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--wm-text)' }}>Something went wrong</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
          This page could not be loaded. Please try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" href="/">
            Go home
          </Button>
        </div>
      </Card>
    </Shell>
  );
}
