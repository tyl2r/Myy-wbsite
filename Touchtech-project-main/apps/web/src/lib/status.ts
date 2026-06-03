import type { RequestStatus } from '@/types/domain';

export type Tone = 'info' | 'brand' | 'success' | 'warning' | 'danger' | 'muted';

/** Single source of truth mapping a request status to a visual tone + label. */
export const STATUS_META: Record<RequestStatus, { tone: Tone; label: string }> = {
  created: { tone: 'info', label: 'Created' },
  matched: { tone: 'info', label: 'Matched' },
  accepted: { tone: 'brand', label: 'Accepted' },
  picked_up: { tone: 'brand', label: 'Picked up' },
  in_transit: { tone: 'brand', label: 'In transit' },
  delivered: { tone: 'success', label: 'Delivered' },
  confirmed: { tone: 'success', label: 'Confirmed' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
  failed: { tone: 'danger', label: 'Failed' },
};
