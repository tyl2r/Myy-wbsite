'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/keys';
import { useToast } from '@/components/ui/toast';
import type { DeliveryRequest, RequestStatus } from '@/types/domain';

export function useRequests(status?: RequestStatus) {
  return useQuery({
    queryKey: queryKeys.requests.list(status),
    queryFn: async () => {
      const { data } = await api.get<DeliveryRequest[]>('/requests', {
        query: { status },
      });
      return data;
    },
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.requests.detail(id),
    queryFn: async () => {
      const { data } = await api.get<DeliveryRequest>(`/requests/${id}`);
      return data;
    },
  });
}

export interface CreateRequestInput {
  pickup: { lat: number; lng: number };
  pickupText: string;
  dropoff: { lat: number; lng: number };
  dropoffText: string;
  recipientName: string;
  recipientPhone?: string;
  packageSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  notes?: string;
}

/**
 * Optimistic create: the new request appears immediately with a temporary id,
 * then reconciles with the server response. On error it rolls back and toasts.
 */
export function useCreateRequest() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);

  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const { data } = await api.post<DeliveryRequest>('/requests', input);
      return data;
    },
    onMutate: async (input) => {
      const key = queryKeys.requests.list();
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<DeliveryRequest[]>(key);
      const optimistic: DeliveryRequest = {
        id: `temp-${Date.now()}`,
        status: 'created',
        pickupText: input.pickupText,
        dropoffText: input.dropoffText,
        recipientName: input.recipientName,
        packageSize: input.packageSize,
        priceCents: 0,
        distanceM: null,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<DeliveryRequest[]>(key, (old) => [optimistic, ...(old ?? [])]);
      return { previous, key };
    },
    onError: (_err, _input, ctx) => {
      if (ctx) qc.setQueryData(ctx.key, ctx.previous);
      toast('danger', 'Could not create request. Please try again.');
    },
    onSuccess: () => toast('success', 'Delivery request created'),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.requests.all }),
  });
}

/** Optimistic cancel: flips status to cancelled on detail + list immediately. */
export function useCancelRequest() {
  const qc = useQueryClient();
  const toast = useToast((s) => s.push);

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<DeliveryRequest>(`/requests/${id}/cancel`);
      return data;
    },
    onMutate: async (id) => {
      const detailKey = queryKeys.requests.detail(id);
      await qc.cancelQueries({ queryKey: detailKey });
      const previous = qc.getQueryData<DeliveryRequest>(detailKey);
      qc.setQueryData<DeliveryRequest>(detailKey, (old) =>
        old ? { ...old, status: 'cancelled' as RequestStatus } : old,
      );
      return { previous, detailKey };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.detailKey, ctx.previous);
      toast('danger', 'Could not cancel request.');
    },
    onSettled: (_d, _e, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.requests.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.requests.all });
    },
  });
}
