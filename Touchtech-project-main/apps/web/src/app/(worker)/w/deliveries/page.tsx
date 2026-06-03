'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyBatches } from '@/hooks/use-worker';

export default function DeliveriesPage() {
  const { data: batches, isLoading } = useMyBatches();

  if (isLoading) {
    return (
      <>
        <PageHeader title="My deliveries" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </>
    );
  }

  const active = (batches ?? []).filter((b) => b.status === 'active');

  return (
    <>
      <PageHeader title="My deliveries" description="Your route, stop by stop." />
      {active.length === 0 ? (
        <EmptyState title="No active deliveries" description="Accept requests from the feed to build a route." />
      ) : (
        <div className="space-y-4">
          {active.map((batch) => (
            <Card key={batch.id}>
              <CardBody>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-fg">Route #{batch.id}</h3>
                  <Badge tone="brand" dot>Active</Badge>
                </div>
                <ol className="space-y-2">
                  {batch.stopOrder.map((stop, i) => (
                    <li key={`${stop.requestId}-${stop.type}`} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-elevated font-mono text-xs text-muted">
                        {i + 1}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${stop.type === 'pickup' ? 'bg-success' : 'bg-brand'}`}
                        aria-hidden
                      />
                      <span className="capitalize text-fg">{stop.type}</span>
                      <span className="font-mono text-xs text-muted">#{stop.requestId}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
