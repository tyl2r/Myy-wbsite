/**
 * Map configuration. The tile/style source is environment-configurable so the
 * app is not locked to any provider. With no env set, a free demo raster style
 * is used so maps still render in development and CI without a token.
 */
export const MAP_CONFIG = {
  styleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
    'https://demotiles.maplibre.org/style.json',
  defaultCenter: {
    lng: Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? 18.0686),
    lat: Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? 59.3293),
  },
  defaultZoom: Number(process.env.NEXT_PUBLIC_MAP_ZOOM ?? 11),
} as const;

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  /** Visual role: where the marker sits in the delivery lifecycle. */
  kind: 'pickup' | 'dropoff' | 'worker';
}
