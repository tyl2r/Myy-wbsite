import type { Role } from '@/types/domain';

/**
 * Capability-based permissions. UI actions check a capability, never a raw
 * role string, so adding a role or moving a capability is a one-line change.
 */
export type Capability =
  | 'request.create'
  | 'request.cancel'
  | 'request.confirm'
  | 'batch.accept'
  | 'worker.toggleAvailability'
  | 'admin.manageUsers'
  | 'admin.verifyWorkers'
  | 'admin.viewLiveOps';

const MATRIX: Record<Role, Capability[]> = {
  user: ['request.create', 'request.cancel', 'request.confirm'],
  worker: ['batch.accept', 'worker.toggleAvailability'],
  admin: [
    'request.create',
    'request.cancel',
    'request.confirm',
    'admin.manageUsers',
    'admin.verifyWorkers',
    'admin.viewLiveOps',
  ],
};

export function can(role: Role | undefined, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[role].includes(capability);
}
