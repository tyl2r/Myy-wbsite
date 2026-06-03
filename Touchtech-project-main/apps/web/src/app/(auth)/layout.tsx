/**
 * Auth layout: a centered form on mobile, a two-column split on desktop with a
 * branded side panel. No app shell here (unauthenticated context).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 items-center justify-center px-6 py-12">{children}</div>
      <div className="relative hidden flex-1 overflow-hidden border-l border-border bg-elevated lg:block">
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <blockquote className="max-w-md text-lg font-medium text-fg">
            “Route-aware batching means fewer empty miles and faster drop-offs.”
          </blockquote>
          <p className="mt-2 text-sm text-muted">The RouteShare dispatch platform</p>
        </div>
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />
      </div>
    </div>
  );
}
