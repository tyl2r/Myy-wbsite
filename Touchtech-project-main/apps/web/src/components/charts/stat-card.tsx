import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

export function StatCard({
  label,
  value,
  hint,
  loading,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tabular text-fg">{value}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}
