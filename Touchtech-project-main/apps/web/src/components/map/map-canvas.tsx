'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MlMap, type Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG, type MapMarker } from '@/lib/map/config';

const MARKER_COLOR: Record<MapMarker['kind'], string> = {
  pickup: '#16A34A',
  dropoff: '#F97316',
  worker: '#0EA5E9',
};

interface MapCanvasProps {
  markers?: MapMarker[];
  /** Optional ordered route line drawn beneath the markers. */
  route?: { lng: number; lat: number }[];
  /** Recenter on this point when it changes (e.g., live worker position). */
  follow?: { lng: number; lat: number } | null;
  className?: string;
}

/**
 * Imperative MapLibre wrapper. The map instance is created once; markers and
 * the route line are reconciled on prop changes without re-creating the map.
 * The component is the only place that imports maplibre + its CSS, so the heavy
 * dependency stays out of every other bundle. Rendered via next/dynamic with
 * ssr:false by callers, so it never executes during SSR/build.
 */
export function MapCanvas({ markers = [], route, follow, className }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const loadedRef = useRef(false);

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_CONFIG.styleUrl,
      center: [MAP_CONFIG.defaultCenter.lng, MAP_CONFIG.defaultCenter.lat],
      zoom: MAP_CONFIG.defaultZoom,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      loadedRef.current = true;
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Reconcile markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = markers.map((mk) => {
      const el = document.createElement('div');
      el.style.cssText = `width:14px;height:14px;border-radius:9999px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);background:${MARKER_COLOR[mk.kind]}`;
      el.setAttribute('aria-label', `${mk.kind} marker`);
      return new maplibregl.Marker({ element: el }).setLngLat([mk.lng, mk.lat]).addTo(map);
    });
  }, [markers]);

  // Draw / update the route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const data = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: (route ?? []).map((p) => [p.lng, p.lat]),
      },
    };
    const src = map.getSource('route') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data);
    } else if (route && route.length > 1) {
      map.addSource('route', { type: 'geojson', data });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#F97316', 'line-width': 3, 'line-opacity': 0.8 },
      });
    }
  }, [route]);

  // Follow a moving point (e.g., live worker).
  useEffect(() => {
    if (follow && mapRef.current) {
      mapRef.current.easeTo({ center: [follow.lng, follow.lat], duration: 600 });
    }
  }, [follow]);

  return <div ref={containerRef} className={className} role="application" aria-label="Map" />;
}
