import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import { useAppStore } from '../../store';
import type { LocationItem } from '../../types';
import { CAT_ICONS, DAYS } from '../../constants';

const createCustomMarker = (item: LocationItem) => {
  const isNecessary = item.priority === 'necessary';
  const color = isNecessary ? '#2D5A27' : '#C4A484';
  const html = `<div class="pin-marker ${isNecessary ? 'marker-pulse' : ''}" style="background-color: ${color};"><div class="pin-inner text-white">${CAT_ICONS[item.cat]}</div></div>`;
  return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -45] });
};

const MapUpdater = ({ locations, filterDay }: { locations: LocationItem[], filterDay: string }) => {
  const map = useMap();
  useEffect(() => {
    const visibleLocations = locations.filter(loc => loc.coords && loc.day !== 'unassigned' && (filterDay === 'all' || loc.day === filterDay));
    if (visibleLocations.length > 0) {
      const bounds = L.latLngBounds(visibleLocations.map(loc => [loc.coords!.lat, loc.coords!.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, filterDay, map]);
  return null;
};

interface MapViewProps {
  routePolylines: React.ReactNode;
  setIsFormPanelOpen: (isOpen: boolean) => void;
}

export const MapView = ({ routePolylines, setIsFormPanelOpen }: MapViewProps) => {
  const { locations, filterDay, setFilterDay, setSelectedLocationId } = useAppStore();

  return (
    <div className="h-[55%] w-full relative z-10 border-b border-gray-200 shadow-sm">
      <MapContainer center={[40.416, -3.703]} zoom={3} style={{ height: '100%', width: '100%', filter: 'grayscale(0.2)' }} zoomControl={false}>
        <TileLayer url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es" subdomains={['mt0', 'mt1', 'mt2', 'mt3']} attribution="&copy; Google" maxZoom={20} />
        <MapUpdater locations={locations} filterDay={filterDay} />
        {routePolylines}
        {locations.filter(l => l.coords && l.day !== 'unassigned' && (filterDay === 'all' || l.day === filterDay)).map(loc => (
          <Marker key={loc.id} position={[loc.coords!.lat, loc.coords!.lng]} icon={createCustomMarker(loc)} eventHandlers={{ click: () => setSelectedLocationId(loc.id) }}>
            <Popup className="font-serif font-bold text-[#333]">{loc.notes.split("\n")[0] || "Ubicación"}</Popup>
          </Marker>
        ))}
      </MapContainer>

      <button onClick={() => setIsFormPanelOpen(true)} className="md:hidden absolute top-6 right-6 z-[400] bg-nature-primary text-white p-3 rounded-full shadow-lg"><MapPin size={24} /></button>

      <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg flex flex-col gap-1 border border-white">
        <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase text-center mb-1">Filtrar Día</span>
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="bg-transparent text-nature-primary font-serif font-bold text-sm outline-none cursor-pointer text-center">
          <option value="all">Ver Todo</option>
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="absolute bottom-6 left-6 z-[400] bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-white text-[10px] text-gray-600 shadow-sm pointer-events-none flex gap-4">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-nature-primary"></span>Esencial</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-nature-accent"></span>Opcional</div>
      </div>
    </div>
  );
};
