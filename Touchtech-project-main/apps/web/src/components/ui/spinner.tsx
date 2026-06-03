import { cn } from '@/lib/cn';

/** Minimal accessible spinner; announce loading via aria-label on the parent. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}
