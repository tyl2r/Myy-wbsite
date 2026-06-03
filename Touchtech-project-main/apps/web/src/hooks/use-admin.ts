'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/keys';
import { useToast } from '@/components/ui/toast';
import type { AdminMetrics, AdminUserRow, LivePosition } from '@/types/domain';

export function useAdminMetrics() {
  return useQuery({
    queryKey: queryKeys.admin.metrics,
    queryFn: async () => {
      const { data } = await api.get<AdminMetrics>('/admin/metrics');
      return data;
    },
    refetchInterval: 30_000,
  });
}

/**
 * Cursor-paginated user list with an optional role filter. Uses an infinite
 * query so the table can "load more" without refetching prior pages, keeping
 * it responsive on large datasets.
 */
export function useAdminUsers(role?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.admin.users(role),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, meta } = await api.get<AdminUserRow[]>('/admin/users', {
        query: { role, cursor: pageParam, limit: 25 },
      });
      return { rows: data, nextCursor: meta?.nextCursor ?? null };
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useLiveSnapshot() {
  return useQuery({
    queryKey: queryKeys.admin.live,
    queryFn: async () => {
      const { data } = await api.get<LivePosition[]>('/admin/live');
      return data;
    },
    refetchInterval: 10_000,
  });
}

export function useSetUserStatus(role?: string) {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'suspended' }) => {
      const { data } = await api.patch(`/admin/users/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      toast('success', 'User status updated');
      qc.invalidateQueries({ queryKey: queryKeys.admin.users(role) });
    },
    onError: () => toast('danger', 'Could not update user'),
  });
}

export function useVerifyWorker() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);
  return useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'verified' | 'rejected' }) => {
      const { data } = await api.patch(`/admin/workers/${id}/verification`, { decision });
      return data;
    },
    onSuccess: (_d, v) => {
      toast('success', `Worker ${v.decision}`);
      qc.invalidateQueries({ queryKey: queryKeys.admin.users('worker') });
    },
    onError: () => toast('danger', 'Could not update verification'),
  });
}