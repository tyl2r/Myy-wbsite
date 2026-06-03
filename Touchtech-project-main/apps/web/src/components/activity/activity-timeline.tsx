import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/status';

export interface ActivityItem {
  id: string;
  tone: Tone;
  title: string;
  meta?: string;
  timestamp?: string;
  current?: boolean;
}

const dotTone: Record<Tone, string> = {
  info: 'bg-info',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-muted',
};

/**
 * Reusable vertical activity timeline. Used by request/delivery status history,
 * worker activity, and the admin audit view. Pure presentational; callers map
 * their domain events to ActivityItem.
 */
export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              'absolute -left-[22px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-surface',
              dotTone[item.tone],
              item.current && 'animate-pulse',
            )}
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-fg">{item.title}</p>
            {item.timestamp && (
              <time className="shrink-0 font-mono text-xs text-muted tabular">{item.timestamp}</time>
            )}
          </div>
          {item.meta && <p className="text-xs text-muted">{item.meta}</p>}
        </li>
      ))}
    </ol>
  );
}
