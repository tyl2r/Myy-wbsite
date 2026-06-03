import { describe, it, expect } from 'vitest';
import { queryKeys } from './keys';

describe('queryKeys factory', () => {
  it('produces stable, distinct keys per resource', () => {
    expect(queryKeys.me).toEqual(['me']);
    expect(queryKeys.requests.list('created')).toEqual(['requests', 'list', 'created']);
    expect(queryKeys.requests.list()).toEqual(['requests', 'list', 'all']);
    expect(queryKeys.requests.detail('42')).toEqual(['requests', 'detail', '42']);
  });

  it('differentiates admin user lists by role', () => {
    expect(queryKeys.admin.users('worker')).not.toEqual(queryKeys.admin.users('user'));
  });
});
