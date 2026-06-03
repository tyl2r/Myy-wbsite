'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { RequestCard } from '@/components/requests/request-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequests } from '@/hooks/use-requests';
import { cn } from '@/lib/cn';
import type { RequestStatus } from '@/types/domain';

const FILTERS: { label: string; value?: RequestStatus }[] = [
  { label: 'All' },
  { label: 'In transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function RequestsPage() {
  const [filter, setFilter] = useState<RequestStatus | undefined>(undefined);
  const { data, isLoading } = useRequests(filter);
  const requests = data ?? [];

  return (
    <>
      <PageHeader title="My requests" description="Every delivery you've created." />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              filter === f.value
                ? 'border-brand bg-brand-subtle text-brand'
                : 'border-border text-muted hover:text-fg',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState title="Nothing here" description="No requests match this filter." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </>
  );
}
