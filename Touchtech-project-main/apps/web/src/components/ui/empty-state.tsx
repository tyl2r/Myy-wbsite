import { cn } from '@/lib/cn';

interface EmptyStateProps {
  /** Inline SVG illustration or icon node. */
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty-state system. Every list/table/feed renders this when it has
 * no data, with a clear next action rather than a blank panel.
 */
export function EmptyState({ illustration, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 text-muted">{illustration ?? <DefaultGlyph />}</div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function DefaultGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="6" y="12" width="36" height="24" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <path d="M6 18l18 10 18-10" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    </svg>
  );
}
