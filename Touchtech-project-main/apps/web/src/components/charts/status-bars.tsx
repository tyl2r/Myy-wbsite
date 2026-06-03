'use client';

import dynamic from 'next/dynamic';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_META } from '@/lib/status';
import type { RequestStatus } from '@/types/domain';

const BarChart = dynamic(() => import('recharts').then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false },
);

export function StatusBars({
  data,
  loading,
}: {
  data: Record<string, number>;
  loading?: boolean;
}) {
  const rows = Object.entries(data).map(([status, value]) => ({
    label: STATUS_META[status as RequestStatus]?.label ?? status,
    value,
  }));

  return (
    <Card>
      <CardBody>
        <CardTitle>Volume by stage</CardTitle>
        {loading ? (
          <Skeleton className="mt-4 h-56" />
        ) : (
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(25 95% 53%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
