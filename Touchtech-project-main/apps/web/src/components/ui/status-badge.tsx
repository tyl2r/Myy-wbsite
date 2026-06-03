import { Badge } from './badge';
import { STATUS_META } from '@/lib/status';
import type { RequestStatus } from '@/types/domain';

/** Lifecycle status pill, driven by the shared STATUS_META map. */
export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
