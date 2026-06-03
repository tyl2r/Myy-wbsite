import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="text-lg font-semibold text-fg">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link href="/">
        <Button>Back to RouteShare</Button>
      </Link>
    </div>
  );
}
