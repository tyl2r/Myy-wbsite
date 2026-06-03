'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MapPanel } from '@/components/map/map-panel';
import { useLiveSnapshot } from '@/hooks/use-admin';

export default function AdminLive() {
  const { data, isLoading } = useLiveSnapshot();
  const positions = data ?? [];
  const markers = positions.map((p) => ({
    id: p.batch_id,
    kind: 'worker' as const,
    lat: p.lat,
    lng: p.lng,
  }));

  return (
    <>
      <PageHeader title="Live operations" description="Active routes across the field, in real time." />
      {isLoading ? (
        <Skeleton className="h-[60vh]" />
      ) : positions.length === 0 ? (
        <EmptyState title="No active routes" description="Live positions appear here while deliveries are in progress." />
      ) : (
        <Card className="overflow-hidden">
          <div className="h-[60vh]">
            <MapPanel className="h-full w-full" markers={markers} />
          </div>
        </Card>
      )}
    </>
  );
}
