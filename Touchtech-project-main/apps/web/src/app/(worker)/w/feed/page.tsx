'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Can } from '@/components/auth/can';
import { NearbyRequestCard } from '@/components/worker/nearby-request-card';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useNearbyRequests, useAcceptRequests } from '@/hooks/use-worker';

export default function FeedPage() {
  const { position, error: geoError } = useGeolocation();
  const { data, isLoading, isError } = useNearbyRequests(position);
  const accept = useAcceptRequests();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const onAccept = async () => {
    await accept.mutateAsync([...selected]);
    setSelected(new Set());
  };

  const requests = data ?? [];

  return (
    <>
      <PageHeader
        title="Request feed"
        description={geoError ? `${geoError} — showing area default` : 'Nearby requests on your route'}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState title="Couldn't load the feed" description="Check your connection and retry." />
      ) : requests.length === 0 ? (
        <EmptyState title="No nearby requests" description="New requests appear here automatically." />
      ) : (
        <div className="space-y-3 pb-24">
          {requests.map((r) => (
            <NearbyRequestCard
              key={r.id}
              request={r}
              selected={selected.has(r.id)}
              onToggle={() => toggle(r.id)}
            />
          ))}
        </div>
      )}

      {/* Sticky accept bar: thumb-reachable on mobile. */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <span className="text-sm text-fg">
              {selected.size} selected
            </span>
            <Can capability="batch.accept" fallback={<span className="text-xs text-muted">Not permitted</span>}>
              <Button onClick={onAccept} loading={accept.isPending}>
                Accept into route
              </Button>
            </Can>
          </div>
        </div>
      )}
    </>
  );
}
