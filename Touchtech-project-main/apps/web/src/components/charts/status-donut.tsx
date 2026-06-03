'use client';

import dynamic from 'next/dynamic';
import { Card, CardBody, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_META } from '@/lib/status';
import type { RequestStatus } from '@/types/domain';

// Lazy-load Recharts so it never ships in the initial bundle.
const PieChart = dynamic(() => import('recharts').then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then((m) => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false },
);

const TONE_HSL: Record<string, string> = {
  info: 'hsl(199 89% 48%)',
  brand: 'hsl(25 95% 53%)',
  success: 'hsl(142 71% 36%)',
  warning: 'hsl(32 95% 44%)',
  danger: 'hsl(0 72% 51%)',
  muted: 'hsl(25 5% 60%)',
};

export function StatusDonut({
  data,
  loading,
}: {
  data: Record<string, number>;
  loading?: boolean;
}) {
  const entries = Object.entries(data).map(([status, value]) => ({
    status,
    value,
    fill: TONE_HSL[STATUS_META[status as RequestStatus]?.tone ?? 'muted'],
  }));

  return (
    <Card>
      <CardBody>
        <CardTitle>Requests by status</CardTitle>
        {loading ? (
          <Skeleton className="mt-4 h-56" />
        ) : (
          <div
            className="mt-4 h-56"
            role="img"
            aria-label={`Requests by status: ${entries.map((e) => `${e.status} ${e.value}`).join(', ')}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={entries} dataKey="value" nameKey="status" innerRadius={56} outerRadius={84} paddingAngle={2}>
                  {entries.map((e) => (
                    <Cell key={e.status} fill={e.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
