'use client';

import { PageHeader } from '@/components/layout/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useRequests } from '@/hooks/use-requests';
import { money, distance, relativeTime } from '@/lib/format';
import type { DeliveryRequest } from '@/types/domain';

export default function AdminRequests() {
  const { data, isLoading } = useRequests();
  const rows = data ?? [];

  const columns: Column<DeliveryRequest>[] = [
    { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs text-muted">#{r.id}</span> },
    { key: 'route', header: 'Route', render: (r) => <span className="text-fg">{r.pickupText} → {r.dropoffText}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'distance', header: 'Distance', align: 'right', render: (r) => distance(r.distanceM) },
    { key: 'price', header: 'Price', align: 'right', render: (r) => money(r.priceCents) },
    { key: 'created', header: 'Created', align: 'right', render: (r) => relativeTime(r.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Requests" description="All delivery requests across the platform." />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={isLoading} emptyTitle="No requests" />
    </>
  );
}
