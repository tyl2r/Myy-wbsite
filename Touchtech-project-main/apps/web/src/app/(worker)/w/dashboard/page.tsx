'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stat-card';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AvailabilityToggle } from '@/components/worker/availability-toggle';
import { useMyBatches } from '@/hooks/use-worker';

export default function WorkerDashboard() {
  const { data: batches, isLoading } = useMyBatches();
  const active = (batches ?? []).filter((b) => b.status === 'active');

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your shift at a glance"
        action={<AvailabilityToggle />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active routes" value={active.length} loading={isLoading} />
        <StatCard label="Stops remaining" value={active.reduce((n, b) => n + b.stopOrder.length, 0)} loading={isLoading} />
        <StatCard label="Completed today" value={(batches ?? []).filter((b) => b.status === 'completed').length} loading={isLoading} />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Active route</h3>
          <Link href="/w/feed">
            <Button variant="secondary" size="sm">Find work</Button>
          </Link>
        </div>
        {active.length === 0 ? (
          <EmptyState
            title="No active route"
            description="Accept nearby requests to build a route."
            action={
              <Link href="/w/feed">
                <Button>Open request feed</Button>
              </Link>
            }
          />
        ) : (
          <Card>
            <CardBody>
              <p className="text-sm text-fg">
                {active.length} active {active.length === 1 ? 'route' : 'routes'} ·{' '}
                <Link href="/w/deliveries" className="text-brand hover:underline">
                  manage deliveries
                </Link>
              </p>
            </CardBody>
          </Card>
        )}
      </section>
    </>
  );
}
