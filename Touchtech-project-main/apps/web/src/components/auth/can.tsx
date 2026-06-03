'use client';

import { usePermissions } from '@/hooks/use-permissions';
import type { Capability } from '@/lib/permissions';

/**
 * Declarative permission gate. Renders children only if the current role holds
 * the capability; otherwise renders an optional fallback. Keeps role logic out
 * of feature components.
 */
export function Can({
  capability,
  fallback = null,
  children,
}: {
  capability: Capability;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can } = usePermissions();
  return <>{can(capability) ? children : fallback}</>;
}
