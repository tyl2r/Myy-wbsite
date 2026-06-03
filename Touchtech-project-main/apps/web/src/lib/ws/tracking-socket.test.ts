import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal fake socket capturing handlers and emits.
const handlers: Record<string, (arg: unknown) => void> = {};
const emit = vi.fn();
const disconnect = vi.fn(() => fakeSocket);
const connect = vi.fn(() => fakeSocket);
const fakeSocket = {
  on: (event: string, cb: (arg: unknown) => void) => {
    handlers[event] = cb;
  },
  emit,
  disconnect,
  connect,
  auth: {} as Record<string, unknown>,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}));

import { TrackingSocket } from './tracking-socket';

describe('TrackingSocket', () => {
  beforeEach(() => {
    emit.mockClear();
    disconnect.mockClear();
    connect.mockClear();
  });

  it('replays subscriptions on (re)connect', () => {
    const ts = new TrackingSocket('http://x', () => 'tok');
    ts.connect();
    ts.subscribe('req-1');
    ts.subscribe('req-2');

    emit.mockClear();
    handlers['connect']?.(undefined); // simulate reconnect

    const rooms = emit.mock.calls.filter((c) => c[0] === 'track:subscribe').map((c) => (c[1] as { requestId: string }).requestId);
    expect(rooms).toEqual(expect.arrayContaining(['req-1', 'req-2']));
  });

  it('fans out location updates to listeners', () => {
    const ts = new TrackingSocket('http://x', () => 'tok');
    ts.connect();
    const received: unknown[] = [];
    ts.onUpdate((e) => received.push(e));

    handlers['location:update']?.({ workerId: '7', batchId: '1', lat: 1, lng: 2, at: 0 });
    expect(received).toHaveLength(1);
  });

  it('reauthenticate swaps the token and reconnects', () => {
    let token = 'old';
    const ts = new TrackingSocket('http://x', () => token);
    ts.connect();
    token = 'new';
    ts.reauthenticate();

    expect(fakeSocket.auth).toEqual({ token: 'new' });
    expect(disconnect).toHaveBeenCalled();
    expect(connect).toHaveBeenCalled();
  });
});
