import { cn } from '@/lib/cn';

/**
 * Tiny inline-SVG icon set (no icon-library dependency). Each key renders a
 * 1.5px stroke glyph inheriting currentColor. Keeps the bundle lean and the
 * visual language consistent.
 */
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  package: <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" />,
  inbox: <path d="M3 12h5l2 3h4l2-3h5M5 5h14v14H5z" />,
  route: <path d="M6 19a3 3 0 100-6 3 3 0 000 6zM18 11a3 3 0 100-6 3 3 0 000 6zM6 13V8h12" />,
  gauge: <path d="M12 14l4-4M3 12a9 9 0 1118 0" />,
  radio: <path d="M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M5 19a9 9 0 010-14M19 5a9 9 0 010 14" />,
  users: <path d="M16 19v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8" />,
  truck: <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7M7 18a2 2 0 100-4 2 2 0 000 4zM17 18a2 2 0 100-4 2 2 0 000 4z" />,
  search: <path d="M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z" />,
  bell: <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />,
  sun: <path d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4 4l1.5 1.5M18.5 18.5L20 20M1 12h2M21 12h2M4 20l1.5-1.5M18.5 5.5L20 4" />,
  moon: <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-5 w-5', className)}
      aria-hidden
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
