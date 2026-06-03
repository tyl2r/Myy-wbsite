import { RequestStatus } from '@prisma/client';
import { InvalidTransitionError } from '../../common/errors/domain.error';

/**
 * The legal request lifecycle, expressed as an adjacency map. Centralizing it
 * here keeps transition rules in one auditable place instead of scattered
 * `if (status === ...)` checks across services.
 */
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  created: ['matched', 'cancelled'],
  matched: ['accepted', 'created', 'cancelled'],
  accepted: ['picked_up', 'cancelled', 'failed'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: ['confirmed', 'failed'],
  confirmed: [],
  cancelled: [],
  failed: [],
};

/** Statuses from which a customer may still cancel without worker impact. */
export const USER_CANCELLABLE: RequestStatus[] = ['created', 'matched'];

export function canTransition(
  from: RequestStatus,
  to: RequestStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: RequestStatus,
  to: RequestStatus,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(
      `Cannot move request from "${from}" to "${to}"`,
      { from, to },
    );
  }
}
