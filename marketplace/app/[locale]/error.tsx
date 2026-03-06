"use client";

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Shell from '@/components/ui/Shell';

export default function LocaleError({ reset }: { reset: () => void }) {
  return (
    <Shell>
      <Card className="mx-auto max-w-md text-center">
        <p className="text-4xl font-bold text-zinc-800 dark:text-zinc-100">500</p>
        <p className="mt-2 text-lg font-semibold text-zinc-700 dark:text-zinc-300">Something went wrong</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
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
