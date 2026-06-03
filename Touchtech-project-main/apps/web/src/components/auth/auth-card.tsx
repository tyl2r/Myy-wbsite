import Link from 'next/link';

/**
 * Shared auth shell: brand mark, title/subtitle, the form slot, and a footer
 * link. Keeps login/register/recovery visually identical and on-brand.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="h-7 w-7 rounded-md bg-brand" aria-hidden />
        <span className="text-lg font-semibold tracking-tight">RouteShare</span>
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
    </div>
  );
}
