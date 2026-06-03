'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stat-card';
import { Button } from '@/components/ui/button';
import { RequestCard } from '@/components/requests/request-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequests } from '@/hooks/use-requests';
import { money } from '@/lib/format';

export default function UserDashboard() {
  const { data, isLoading } = useRequests();
  const requests = data ?? [];
  const active = requests.filter((r) =>
    ['created', 'matched', 'accepted', 'picked_up', 'in_transit'].includes(r.status),
  ).length;
  const delivered = requests.filter((r) => ['delivered', 'confirmed'].includes(r.status)).length;
  const spent = requests.reduce((sum, r) => sum + r.priceCents, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your delivery activity at a glance"
        action={
          <Link href="/u/requests/new">
            <Button>+ New request</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active" value={active} loading={isLoading} />
        <StatCard label="Delivered" value={delivered} loading={isLoading} />
        <StatCard label="Total spent" value={money(spent)} loading={isLoading} />
      </div>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-fg">Recent requests</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Create your first delivery request to get started."
            action={
              <Link href="/u/requests/new">
                <Button>Create a request</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
