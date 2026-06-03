import { cn } from '@/lib/cn';

/**
 * Shimmer skeleton placeholder. Use to reserve layout for data surfaces so
 * there is no content jump when data arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md bg-elevated',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer before:bg-gradient-to-r',
        'before:from-transparent before:via-black/5 before:to-transparent',
        'dark:before:via-white/5',
        className,
      )}
    />
  );
}

/** Convenience: a vertical stack of line skeletons. */
export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  );
}
