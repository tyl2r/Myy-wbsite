'use client';

import { useEffect, useState } from 'react';

interface GeoState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
}

/**
 * Watches the device position for the worker feed/tracking. Falls back to a
 * city-center default if permission is denied so the feed is never empty in
 * a demo context.
 */
export function useGeolocation(fallback = { lat: 59.3293, lng: 18.0686 }): GeoState {
  const [state, setState] = useState<GeoState>({ position: null, error: null, loading: true });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ position: fallback, error: 'Geolocation unavailable', loading: false });
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      () => setState({ position: fallback, error: 'Location permission denied', loading: false }),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // fallback is a stable literal; intentionally run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
