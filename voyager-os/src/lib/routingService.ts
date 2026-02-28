import type { LocationItem, TransportSegment } from '../types';

const PROFILE_MAP: Record<TransportSegment['mode'], { base: string, profile: string }> = {
  car: { base: 'https://routing.openstreetmap.de/routed-car', profile: 'driving' },
  bike: { base: 'https://routing.openstreetmap.de/routed-bike', profile: 'bicycle' },
  walk: { base: 'https://routing.openstreetmap.de/routed-foot', profile: 'foot' },
  transit: { base: '', profile: '' },
  flight: { base: '', profile: '' },
  manual: { base: '', profile: '' }
};

export async function calculateRoute(
  fromLoc: LocationItem,
  toLoc: LocationItem,
  mode: TransportSegment['mode']
): Promise<{ duration: number; distance: number; polyline: [number, number][] } | null> {
  if (!fromLoc.coords || !toLoc.coords) return null;

  if (mode === 'flight' || mode === 'transit' || mode === 'manual') {
    return {
      duration: 0,
      distance: 0,
      polyline: [
        [fromLoc.coords.lat, fromLoc.coords.lng],
        [toLoc.coords.lat, toLoc.coords.lng],
      ]
    };
  }

  const config = PROFILE_MAP[mode] || PROFILE_MAP.car;
  const coords = `${fromLoc.coords.lng},${fromLoc.coords.lat};${toLoc.coords.lng},${toLoc.coords.lat}`;
  const url = `${config.base}/route/v1/${config.profile}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM API error: ${res.status}`);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const polyline = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

      return {
        duration: Math.round(route.duration / 60),
        distance: route.distance,
        polyline,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${mode} route:`, error);
    return null;
  }
}
