import { describe, it, expect } from 'vitest';
import { money, distance, relativeTime } from './format';

describe('formatters', () => {
  it('formats money from cents', () => {
    expect(money(740)).toBe('$7.40');
    expect(money(0)).toBe('$0.00');
  });

  it('formats distance with m/km switch', () => {
    expect(distance(850)).toBe('850 m');
    expect(distance(3100)).toBe('3.1 km');
    expect(distance(null)).toBe('—');
  });

  it('formats relative time', () => {
    expect(relativeTime(new Date().toISOString())).toBe('just now');
    expect(relativeTime(new Date(Date.now() - 5 * 60000).toISOString())).toBe('5m ago');
  });
});
