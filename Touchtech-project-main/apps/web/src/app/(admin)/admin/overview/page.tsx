'use client';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stat-card';
import { StatusDonut } from '@/components/charts/status-donut';
import { StatusBars } from '@/components/charts/status-bars';
import { useAdminMetrics } from '@/hooks/use-admin';

export default function AdminOverview() {
  const { data, isLoading } = useAdminMetrics();
  const byStatus = data?.requestsByStatus ?? {};
  const totalActive =
    (byStatus.created ?? 0) + (byStatus.matched ?? 0) + (byStatus.accepted ?? 0) +
    (byStatus.picked_up ?? 0) + (byStatus.in_transit ?? 0);
  const avgLabel = data ? `${Math.round(data.fulfillmentRate * 100)}%` : '—';

  return (
    <>
      <PageHeader title="Overview" description="Live operational snapshot" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active requests" value={totalActive} loading={isLoading} />
        <StatCard label="Active workers" value={data?.activeWorkers ?? 0} loading={isLoading} />
        <StatCard label="Fulfillment rate" value={avgLabel} loading={isLoading} />
        <StatCard
          label="Confirmed"
          value={byStatus.confirmed ?? 0}
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <StatusDonut data={byStatus} loading={isLoading} />
        <StatusBars data={byStatus} loading={isLoading} />
      </div>
    </>
  );
}
