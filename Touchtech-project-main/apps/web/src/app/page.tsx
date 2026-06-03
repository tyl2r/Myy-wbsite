'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';
import { Spinner } from '@/components/ui/spinner';

/** Routes to the role landing page once the session is resolved. */
const LANDING: Record<string, string> = {
  user: '/u/dashboard',
  worker: '/w/dashboard',
  admin: '/admin/overview',
};

export default function Home() {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const role = useAuth((s) => s.user?.role);

  useEffect(() => {
    if (status === 'authenticated' && role) router.replace(LANDING[role]);
    else if (status === 'unauthenticated') router.replace('/login');
  }, [status, role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-6 w-6 text-brand" />
    </div>
  );
}
