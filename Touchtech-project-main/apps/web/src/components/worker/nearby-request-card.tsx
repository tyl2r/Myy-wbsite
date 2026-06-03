'use client';

import { Card } from '@/components/ui/card';
import { distance } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { NearbyRequest } from '@/types/domain';

/**
 * Tappable nearby-request card for the worker feed. Large hit area, selection
 * state for batch-accept. Designed mobile-first for one-handed use on the road.
 */
export function NearbyRequestCard({
  request,
  selected,
  onToggle,
}: {
  request: NearbyRequest;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      interactive
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
      className={cn(
        'cursor-pointer p-4 transition-colors',
        selected && 'border-brand ring-1 ring-brand',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">#{request.id}</span>
        <span className="text-sm font-medium tabular text-fg">{distance(request.distance_m)} away</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-fg">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
        <span className="font-mono text-xs">
          {request.pickup_lat.toFixed(3)}, {request.pickup_lng.toFixed(3)}
        </span>
        <span className="text-muted">→</span>
        <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
        <span className="font-mono text-xs">
          {request.dropoff_lat.toFixed(3)}, {request.dropoff_lng.toFixed(3)}
        </span>
      </div>
    </Card>
  );
}
