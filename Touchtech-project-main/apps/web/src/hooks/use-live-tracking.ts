'use client';

import { useEffect, useRef, useState } from 'react';
import { TrackingSocket, type TrackEvent } from '@/lib/ws/tracking-socket';
import { useAuth } from '@/stores/auth.store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000';

/**
 * Subscribes to live position updates for a request. Positions are kept in
 * local state (not the Query cache) so high-frequency updates re-render only
 * the map, not the whole data tree.
 */
export function useLiveTracking(requestId: string | null) {
  const token = useAuth((s) => s.accessToken);
  const socketRef = useRef<TrackingSocket | null>(null);
  const [position, setPosition] = useState<TrackEvent | null>(null);

  useEffect(() => {
    if (!requestId) return;
    const socket = new TrackingSocket(WS_URL, () => useAuth.getState().accessToken);
    socketRef.current = socket;
    socket.connect();
    socket.subscribe(requestId);
    const off = socket.onUpdate(setPosition);
    return () => {
      off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [requestId]);

  // Re-authenticate the live socket when the access token rotates.
  useEffect(() => {
    socketRef.current?.reauthenticate();
  }, [token]);

  return position;
}
