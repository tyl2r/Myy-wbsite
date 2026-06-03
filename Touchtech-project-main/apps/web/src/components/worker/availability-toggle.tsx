'use client';

import { useWorkerProfile, useToggleAvailability } from '@/hooks/use-worker';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

/**
 * Accessible availability switch (role=switch). Optimistic via the hook; the
 * verification state disables it with an explanatory hint when not verified.
 */
export function AvailabilityToggle() {
  const { data: profile, isLoading } = useWorkerProfile();
  const toggle = useToggleAvailability();

  if (isLoading || !profile) return <Skeleton className="h-10 w-44" />;

  const verified = profile.verification === 'verified';
  const on = profile.isAvailable;

  return (
    <div className="flex items-center gap-3">
      <button
        role="switch"
        aria-checked={on}
        aria-label="Toggle availability"
        disabled={!verified}
        onClick={() => toggle.mutate(!on)}
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors disabled:opacity-40',
          on ? 'bg-success' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            on ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
      <div className="text-sm">
        <p className="font-medium text-fg">{on ? 'Available' : 'Offline'}</p>
        {!verified && <p className="text-xs text-warning">Pending verification</p>}
      </div>
    </div>
  );
}
