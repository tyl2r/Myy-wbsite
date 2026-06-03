'use client';

import { use } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Can } from '@/components/auth/can';
import { ActivityTimeline, type ActivityItem } from '@/components/activity/activity-timeline';
import { MapPanel } from '@/components/map/map-panel';
import { useRequest, useCancelRequest } from '@/hooks/use-requests';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { money, distance, relativeTime } from '@/lib/format';
import { STATUS_META } from '@/lib/status';

const LIVE_STATUSES = ['accepted', 'picked_up', 'in_transit'];

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: request, isLoading, isError } = useRequest(id);
  const cancel = useCancelRequest();
  // Subscribe to live position only while the delivery is in motion.
  const trackable = !!request && LIVE_STATUSES.includes(request.status);
  const position = useLiveTracking(trackable ? id : null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError || !request) {
    return <EmptyState title="Request not found" description="It may have been removed." />;
  }

  const cancellable = ['created', 'matched'].includes(request.status);
  const timeline: ActivityItem[] = [
    { id: 'created', tone: 'info', title: 'Request created', timestamp: relativeTime(request.createdAt) },
    {
      id: 'now',
      tone: STATUS_META[request.status].tone,
      title: STATUS_META[request.status].label,
      current: true,
    },
  ];

  return (
    <>
      <PageHeader
        title={`Request #${request.id}`}
        action={
          cancellable ? (
            <Can capability="request.cancel">
              <Button
                variant="danger"
                loading={cancel.isPending}
                onClick={() => cancel.mutate(request.id)}
              >
                Cancel request
              </Button>
            </Can>
          ) : undefined
        }
      />

      {trackable && (
        <Card className="mb-6 overflow-hidden">
          <div className="h-72">
            <MapPanel
              className="h-full w-full"
              markers={position ? [{ id: 'worker', kind: 'worker', lat: position.lat, lng: position.lng }] : []}
              follow={position ? { lat: position.lat, lng: position.lng } : null}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={request.status} />
              <span className="text-xs text-muted">{relativeTime(request.createdAt)}</span>
            </div>
            <div className="text-sm">
              <p className="text-fg">{request.pickupText}</p>
              <p className="my-1 text-muted">↓</p>
              <p className="text-fg">{request.dropoffText}</p>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Recipient</dt>
                <dd className="text-fg">{request.recipientName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Distance</dt>
                <dd className="tabular text-fg">{distance(request.distanceM)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Price</dt>
                <dd className="tabular text-fg">{money(request.priceCents)}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-4 text-sm font-semibold text-fg">Activity</h3>
            <ActivityTimeline items={timeline} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
