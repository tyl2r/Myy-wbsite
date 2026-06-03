'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/keys';
import { usePermissions } from '@/hooks/use-permissions';
import type { CommandEntry } from '@/components/command/command-palette';
import type { AdminUserRow, DeliveryRequest } from '@/types/domain';

/**
 * Builds dynamic, role-aware command-palette entries from data already in the
 * Query cache, so opening the palette is instant and does not refetch. Entity
 * types are gated by capability: a user searches their requests; an admin will
 * additionally search users/workers (wired in the admin stage).
 */
export function useCommandSearch(): CommandEntry[] {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [entries, setEntries] = useState<CommandEntry[]>([]);

  // Recompute when cached requests change.
  useEffect(() => {
    const build = () => {
      const next: CommandEntry[] = [];
      const requests =
        qc.getQueryData<DeliveryRequest[]>(queryKeys.requests.list()) ?? [];
      for (const r of requests.slice(0, 50)) {
        next.push({
          id: `req-${r.id}`,
          label: `Request #${r.id} — ${r.dropoffText}`,
          group: 'Requests',
          href: `/u/requests/${r.id}`,
          icon: 'package',
        });
      }
      // Workers: surface active deliveries (batches) as quick destinations.
      if (can('batch.accept')) {
        const batches =
          qc.getQueryData<{ id: string; status: string }[]>(queryKeys.batches.mine) ?? [];
        for (const b of batches.filter((b) => b.status === 'active').slice(0, 25)) {
          next.push({
            id: `batch-${b.id}`,
            label: `Active route #${b.id}`,
            group: 'Deliveries',
            href: '/w/deliveries',
            icon: 'route',
          });
        }
      }
      // Admin: users and workers from the paginated cache.
      if (can('admin.manageUsers')) {
        const users =
          qc.getQueryData<{ pages: { rows: AdminUserRow[] }[] }>(queryKeys.admin.users())
            ?.pages.flatMap((p) => p.rows) ?? [];
        for (const u of users.slice(0, 40)) {
          next.push({
            id: `user-${u.id}`,
            label: `${u.fullName} (${u.role})`,
            group: u.role === 'worker' ? 'Workers' : 'Users',
            href: u.role === 'worker' ? '/admin/workers' : '/admin/users',
            icon: u.role === 'worker' ? 'truck' : 'users',
          });
        }
      }
      setEntries(next);
    };
    build();
    const unsub = qc.getQueryCache().subscribe(build);
    return unsub;
  }, [qc, can]);

  return useMemo(() => entries, [entries]);
}
