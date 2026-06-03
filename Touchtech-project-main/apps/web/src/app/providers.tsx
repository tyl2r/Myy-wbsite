'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ToastRegion } from '@/components/ui/toast';
import { bindAuthToClient, useAuth } from '@/stores/auth.store';

async function startMocks(): Promise<void> {
  if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per app instance; defaults tuned for a live ops dashboard.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bindAuthToClient();
    void startMocks()
      .then(() => useAuth.getState().bootstrap())
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        {ready ? children : null}
        <ToastRegion />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
