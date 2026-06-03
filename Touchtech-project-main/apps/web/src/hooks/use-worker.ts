'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/keys';
import { useToast } from '@/components/ui/toast';
import type { Batch, NearbyRequest, WorkerProfile } from '@/types/domain';

const WORKER_PROFILE_KEY = ['worker', 'profile'] as const;

export function useWorkerProfile() {
  return useQuery({
    queryKey: WORKER_PROFILE_KEY,
    queryFn: async () => {
      const { data } = await api.get<WorkerProfile>('/workers/me');
      return data;
    },
  });
}

/**
 * Availability toggle with an optimistic switch: the UI flips immediately and
 * rolls back if the server rejects (e.g. unverified worker).
 */
export function useToggleAvailability() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);

  return useMutation({
    mutationFn: async (isAvailable: boolean) => {
      const { data } = await api.patch<WorkerProfile>('/workers/me/availability', {
        isAvailable,
      });
      return data;
    },
    onMutate: async (isAvailable) => {
      await qc.cancelQueries({ queryKey: WORKER_PROFILE_KEY });
      const previous = qc.getQueryData<WorkerProfile>(WORKER_PROFILE_KEY);
      qc.setQueryData<WorkerProfile>(WORKER_PROFILE_KEY, (old) =>
        old ? { ...old, isAvailable } : old,
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(WORKER_PROFILE_KEY, ctx.previous);
      toast('danger', 'Could not change availability. Are you verified?');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: WORKER_PROFILE_KEY }),
  });
}

export function useNearbyRequests(center: { lat: number; lng: number } | null) {
  return useQuery({
    enabled: !!center,
    queryKey: center ? queryKeys.batches.nearby(center.lat, center.lng) : ['batches', 'nearby', 'idle'],
    queryFn: async () => {
      const { data } = await api.get<NearbyRequest[]>('/batches/nearby', {
        query: { lat: center!.lat, lng: center!.lng, radius: 5000 },
      });
      return data;
    },
    // Feed refreshes periodically so workers see new nearby work.
    refetchInterval: 20_000,
  });
}

export function useMyBatches() {
  return useQuery({
    queryKey: queryKeys.batches.mine,
    queryFn: async () => {
      const { data } = await api.get<Batch[]>('/batches/me');
      return data;
    },
  });
}

/** Accept one or more compatible requests into a batch. */
export function useAcceptRequests() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);

  return useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { data } = await api.post<{ batchId: string }>('/batches', { requestIds });
      return data;
    },
    onSuccess: () => {
      toast('success', 'Requests accepted into your route');
      qc.invalidateQueries({ queryKey: queryKeys.batches.mine });
      qc.invalidateQueries({ queryKey: ['batches', 'nearby'] });
    },
    onError: () => toast('danger', 'Some requests are no longer available'),
  });
}
