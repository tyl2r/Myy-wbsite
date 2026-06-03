import { describe, it, expect } from 'vitest';
import { can } from './permissions';

describe('permissions matrix', () => {
  it('grants users request capabilities but not admin ones', () => {
    expect(can('user', 'request.create')).toBe(true);
    expect(can('user', 'admin.manageUsers')).toBe(false);
  });

  it('grants workers acceptance + availability only', () => {
    expect(can('worker', 'batch.accept')).toBe(true);
    expect(can('worker', 'worker.toggleAvailability')).toBe(true);
    expect(can('worker', 'request.create')).toBe(false);
  });

  it('grants admins management capabilities', () => {
    expect(can('admin', 'admin.manageUsers')).toBe(true);
    expect(can('admin', 'admin.verifyWorkers')).toBe(true);
    expect(can('admin', 'admin.viewLiveOps')).toBe(true);
  });

  it('denies everything when role is undefined', () => {
    expect(can(undefined, 'request.create')).toBe(false);
  });
});
