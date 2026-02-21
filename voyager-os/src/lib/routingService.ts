import type { LocationItem, TransportSegment } from '../types';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

export async function calculateRoute(
  fromLoc: LocationItem,
  toLoc: LocationItem,
  mode: TransportSegment['mode']
): Promise<{ duration: number; distance: number; polyline: [number, number][] } | null> {
  if (!fromLoc.coords || !toLoc.coords) return null;

  // Polyline coordinates are [lat, lng]
  if (mode === 'flight' || mode === 'transit') {
    // For flight/transit where OSRM can't help, just return a straight line
    return {
      duration: 0,
      distance: 0,
      polyline: [
        [fromLoc.coords.lat, fromLoc.coords.lng],
        [toLoc.coords.lat, toLoc.coords.lng],
      ]
    };
  }

  const osrmMode = mode === 'car' ? 'driving' : 'foot';
  const coords = `${fromLoc.coords.lng},${fromLoc.coords.lat};${toLoc.coords.lng},${toLoc.coords.lat}`;
  const url = `${OSRM_BASE}/${osrmMode}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // geometry.coordinates from GeoJSON are [lng, lat], we need [lat, lng] for Leaflet
      const polyline = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);

      return {
        duration: Math.round(route.duration / 60), // Convert seconds to minutes
        distance: route.distance, // meters
        polyline,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching route from OSRM:', error);
    return null;
  }
}
