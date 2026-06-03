import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, distance, relativeTime } from '@/lib/format';
import type { DeliveryRequest } from '@/types/domain';

/** Compact request row used in dashboard + list views. */
export function RequestCard({ request }: { request: DeliveryRequest }) {
  return (
    <Link href={`/u/requests/${request.id}`} className="block">
      <Card interactive className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">#{request.id}</span>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 truncate text-sm text-fg">
              {request.pickupText} → {request.dropoffText}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium tabular text-fg">{money(request.priceCents)}</p>
            <p className="text-xs text-muted tabular">{distance(request.distanceM)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">{relativeTime(request.createdAt)}</p>
      </Card>
    </Link>
  );
}
