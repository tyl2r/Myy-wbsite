'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';
import { Spinner } from '@/components/ui/spinner';
import type { Role } from '@/types/domain';

const LANDING: Record<Role, string> = {
  user: '/u/dashboard',
  worker: '/w/dashboard',
  admin: '/admin/overview',
};

/**
 * Route-level role protection. Wrap a role segment's children so the URL itself
 * is gated, not just the UI actions inside it:
 *  - while the session is resolving -> spinner
 *  - signed out -> redirect to /login
 *  - signed in with the wrong role -> redirect to that role's own landing
 *
 * This is the COARSE gate (which screens a role may open). Fine-grained action
 * permissions remain the job of <Can> / usePermissions inside components, so
 * the two layers compose: routing decides reachability, capabilities decide
 * what you can do once there.
 */
export function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const role = useAuth((s) => s.user?.role);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated' && role && !allow.includes(role)) {
      router.replace(LANDING[role]);
    }
  }, [status, role, allow, router]);

  if (status !== 'authenticated' || !role || !allow.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
