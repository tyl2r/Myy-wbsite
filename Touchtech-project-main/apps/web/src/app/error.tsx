'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Root error boundary. Catches render/runtime errors in the segment tree and
 * offers a recovery path instead of a blank screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this would report to an error tracker (Sentry, etc.).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error occurred. You can retry, or head back and try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
