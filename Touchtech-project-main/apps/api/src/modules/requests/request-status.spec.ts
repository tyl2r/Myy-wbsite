import { canTransition, assertTransition } from './request-status';
import { InvalidTransitionError } from '../../common/errors/domain.error';

describe('request status machine', () => {
  it('allows the happy-path lifecycle', () => {
    expect(canTransition('created', 'matched')).toBe(true);
    expect(canTransition('matched', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'picked_up')).toBe(true);
    expect(canTransition('picked_up', 'in_transit')).toBe(true);
    expect(canTransition('in_transit', 'delivered')).toBe(true);
    expect(canTransition('delivered', 'confirmed')).toBe(true);
  });

  it('forbids skipping states', () => {
    expect(canTransition('created', 'delivered')).toBe(false);
    expect(canTransition('accepted', 'confirmed')).toBe(false);
  });

  it('treats terminal states as dead ends', () => {
    expect(canTransition('confirmed', 'created')).toBe(false);
    expect(canTransition('cancelled', 'matched')).toBe(false);
    expect(canTransition('failed', 'in_transit')).toBe(false);
  });

  it('throws InvalidTransitionError on illegal moves', () => {
    expect(() => assertTransition('created', 'confirmed')).toThrow(
      InvalidTransitionError,
    );
  });
});
