'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * SSR-safe entry point for the map. MapCanvas touches `window`/`document` and
 * imports MapLibre + its CSS, so it must never render on the server or during
 * the build's static evaluation. This wrapper enforces ssr:false in one place.
 */
export const MapPanel = dynamic(
  () => import('./map-canvas').then((m) => m.MapCanvas),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);
