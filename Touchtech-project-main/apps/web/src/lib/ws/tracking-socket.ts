'use client';

import { io, type Socket } from 'socket.io-client';

/**
 * Resilient tracking socket wrapper.
 *
 * Resilience features:
 *  - connects to the /tracking namespace with the current access token
 *  - automatic reconnection with exponential backoff (handled by socket.io)
 *  - re-authenticates after a token refresh by updating auth + reconnecting
 *  - replays room subscriptions after every (re)connect so a dropped
 *    connection transparently restores live updates
 */
export interface TrackEvent {
  workerId: string;
  batchId: string;
  lat: number;
  lng: number;
  at: number;
}

type Listener = (e: TrackEvent) => void;

export class TrackingSocket {
  private socket: Socket | null = null;
  private readonly rooms = new Set<string>();
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly url: string,
    private getToken: () => string | null,
  ) {}

  connect(): void {
    if (this.socket) return;
    this.socket = io(`${this.url}/tracking`, {
      transports: ['websocket'],
      auth: { token: this.getToken() ?? '' },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    // Replay subscriptions on every successful (re)connect.
    this.socket.on('connect', () => {
      for (const room of this.rooms) {
        this.socket?.emit('track:subscribe', { requestId: room });
      }
    });

    this.socket.on('location:update', (e: TrackEvent) => {
      for (const l of this.listeners) l(e);
    });
  }

  /** Called after a token refresh: update credentials and force a reconnect. */
  reauthenticate(): void {
    if (!this.socket) return;
    this.socket.auth = { token: this.getToken() ?? '' };
    this.socket.disconnect().connect();
  }

  subscribe(requestId: string): void {
    this.rooms.add(requestId);
    this.socket?.emit('track:subscribe', { requestId });
  }

  unsubscribe(requestId: string): void {
    this.rooms.delete(requestId);
  }

  onUpdate(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.rooms.clear();
    this.listeners.clear();
  }
}
