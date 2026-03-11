'use client';

import ErrorBoundaryPage from '@/components/ui/ErrorBoundaryPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Could not load service information"
      description="Service page could not be loaded."
    />
  );
}
