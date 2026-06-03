'use client';

import { useAuth } from '@/stores/auth.store';
import { can, type Capability } from '@/lib/permissions';

/** Hook form of the permissions check, bound to the current session role. */
export function usePermissions() {
  const role = useAuth((s) => s.user?.role);
  return {
    can: (capability: Capability) => can(role, capability),
    role,
  };
}
