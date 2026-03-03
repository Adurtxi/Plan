import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { MapPin, Layers, PenTool, CheckCircle2, Maximize, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import { useAppStore } from '../../store';
import { useAddRoutePoint } from '../../hooks/useTripData';
import { useFilteredLocations } from '../../hooks/useFilteredLocations';
import { hapticFeedback } from '../../utils/haptics';
import type { LocationItem } from '../../types';
import { CAT_ICONS, CAT_COLORS } from '../../constants';


const createCustomMarker = (item: LocationItem, isHovered?: boolean, isSelected?: boolean) => {
  const isNecessary = item.priority === 'necessary';
  const color = CAT_COLORS[item.cat] || (isNecessary ? '#2D5A27' : '#C4A484');
  const hasImage = item.images && item.images.length > 0;

  const imgHtml = hasImage
    ? `<img src="${item.images[0].data}" class="w-full h-full object-cover rounded-full absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />`
    : '';

  const titleVisible = item.title ? `<div class="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded shadow-md text-[10px] font-bold whitespace-nowrap pointer-events-none ${isSelected ? 'bg-nature-primary text-white opacity-100 -translate-y-2' : 'bg-white text-gray-800 opacity-0 group-hover:opacity-100'} transition-all">${item.title}</div>` : '';

  const html = `
    <div class="pin-marker group relative ${isHovered || isSelected ? 'scale-125 z-[600]' : 'hover:scale-125 hover:z-[600]'} transition-transform duration-300 ${isNecessary && !isHovered && !isSelected ? 'marker-pulse' : ''}" style="background-color: ${color}; ${isSelected ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px ' + color + ';' : ''}">
      <div class="pin-inner text-white relative overflow-hidden flex items-center justify-center">
        <span class="z-10 group-hover:opacity-0 transition-opacity duration-300">${CAT_ICONS[item.cat]}</span>
        ${imgHtml}
      </div>
      ${titleVisible}
    </div>
  `;
  return L.divIcon({ html, className: 'custom-marker-container', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -45] });
};

const MapUpdater = ({ locations, reframeTrigger }: { locations: LocationItem[], reframeTrigger: number }) => {
  const map = useMap();
  const { isDrawingRouteFor, reframeMapCoordinates, setReframeMapCoordinates } = useAppStore();
  const locationsRef = useRef(locations);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  // Handle zooming to manual coordinates (from Lightbox)
  useEffect(() => {
    if (reframeMapCoordinates) {
      map.flyTo([reframeMapCoordinates.lat, reframeMapCoordinates.lng], 18, { duration: 0.8 });
      // Limpiar después de iniciar el vuelo, usando un pequeño timeout para que react procese
      setTimeout(() => setReframeMapCoordinates(null), 100);
    }
  }, [reframeMapCoordinates, map, setReframeMapCoordinates]);

  // Handle reframe trigger (View all)
  useEffect(() => {
    if (reframeTrigger > 0) {
      const visibleLocations = locationsRef.current.filter(loc => loc.coords);
      if (visibleLocations.length > 0 && !isDrawingRouteFor) {
        const bounds = L.latLngBounds(visibleLocations.map(loc => [loc.coords!.lat, loc.coords!.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [reframeTrigger, map, isDrawingRouteFor]);



  // Handle initial load - fit bounds once if there are locations
  const initialFitRef = useRef(false);
  useEffect(() => {
    if (!initialFitRef.current && locations.length > 0) {
      initialFitRef.current = true;
      // If we are about to reframe, don't auto-fit bounds, let the flyTo take over
      if (!reframeMapCoordinates) {
        const visibleLocations = locations.filter(loc => loc.coords);
        if (visibleLocations.length > 0) {
          const bounds = L.latLngBounds(visibleLocations.map(loc => [loc.coords!.lat, loc.coords!.lng] as [number, number]));
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [locations, map, reframeMapCoordinates]);

  return null;
};

const MapCenterOnMeUpdater = ({ trigger }: { trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      hapticFeedback.medium();
      map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
    }
  }, [trigger, map]);
  return null;
};

const MapClickHandler = ({ onMapClick, isAddMode, isDrawingMode, onDrawClick }: { onMapClick: (lat: number, lng: number) => void, isAddMode: boolean, isDrawingMode: boolean, onDrawClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (isDrawingMode) {
        onDrawClick(e.latlng.lat, e.latlng.lng);
      } else if (isAddMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Component to handle automatic map resizing when the container changes shape
const MapResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    const container = map.getContainer();
    if (container) resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map]);
  return null;
};

interface MapViewProps {
  routePolylines: React.ReactNode;
  setIsFormPanelOpen: (isOpen: boolean) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isAddMode: boolean;
  setIsAddMode: (mode: boolean) => void;
}

// Internal component to forcefully override the cursor on the Leaflet container
const MapCursorHandler = ({ isAddMode, isDrawingMode }: { isAddMode: boolean, isDrawingMode: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (container) {
      if (isAddMode || isDrawingMode) {
        container.classList.add('crosshair-cursor-override');
        // Fallback direct style override
        container.style.setProperty('cursor', 'crosshair', 'important');
      } else {
        container.classList.remove('crosshair-cursor-override');
        container.style.removeProperty('cursor');
      }
    }
  }, [map, isAddMode, isDrawingMode]);
  return null;
};

export const MapView = ({ routePolylines, setIsFormPanelOpen, onMapClick, isAddMode, setIsAddMode }: MapViewProps) => {
  const { selectedLocationId, setSelectedLocationId, isDrawingRouteFor, setDrawingRouteFor } = useAppStore();
  const { mutate: addRoutePoint } = useAddRoutePoint();
  const filteredLocations = useFilteredLocations();
  const [mapType, setMapType] = useState<'m' | 's'>('m'); // 'm' for Map, 's' for Satellite
  const [tempMarker, setTempMarker] = useState<{ lat: number, lng: number } | null>(null);
  const [reframeTrigger, setReframeTrigger] = useState(0);
  const [centerMeTrigger, setCenterMeTrigger] = useState(0);

  // Clear temp marker when exiting add mode
  useEffect(() => {
    if (!isAddMode) setTempMarker(null);
  }, [isAddMode]);

  return (
    <div className="h-full w-full relative z-10 border-b border-gray-200 shadow-sm">
      <MapContainer className={isAddMode ? 'add-mode-active' : ''} center={[40.416, -3.703]} zoom={3} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <MapResizeHandler />
        <MapCursorHandler isAddMode={isAddMode} isDrawingMode={!!isDrawingRouteFor} />
        <TileLayer url={`https://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}&hl=es`} subdomains={['mt0', 'mt1', 'mt2', 'mt3']} attribution="&copy; Google" maxZoom={20} />
        <MapUpdater locations={filteredLocations} reframeTrigger={reframeTrigger} />
        <MapCenterOnMeUpdater trigger={centerMeTrigger} />
        {<MapClickHandler isAddMode={isAddMode} isDrawingMode={!!isDrawingRouteFor} onDrawClick={(lat, lng) => {
          if (isDrawingRouteFor) addRoutePoint({ transportId: isDrawingRouteFor, lat, lng });
        }} onMapClick={(lat, lng) => {
          if (!onMapClick) return;
          setTempMarker({ lat, lng });
          onMapClick(lat, lng);
        }} />}
        {routePolylines}
        {filteredLocations.filter(l => l.coords).map(loc => (
          <Marker key={loc.id} position={[loc.coords!.lat, loc.coords!.lng]} icon={createCustomMarker(loc, false, loc.id === selectedLocationId)} eventHandlers={{ click: () => setSelectedLocationId(loc.id) }}>
            <Popup className="font-sans font-bold text-[#333]">{loc.title || loc.notes?.split("\n")[0] || "Ubicación"}</Popup>
          </Marker>
        ))}
        {tempMarker && (
          <Marker position={[tempMarker.lat, tempMarker.lng]} icon={L.divIcon({ html: '<div class="w-4 h-4 rounded-full bg-nature-accent border-2 border-white shadow-md animate-pulse"></div>', className: 'custom-temp-marker', iconSize: [16, 16], iconAnchor: [8, 8] })} />
        )}
      </MapContainer>

      {isDrawingRouteFor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-nature-accent text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center justify-between gap-4 w-[90%] md:w-auto">
          <div className="flex items-center gap-2">
            <PenTool size={16} className="shrink-0" /> <span className="text-sm">Añadiendo puntos...</span>
          </div>
          <button onClick={() => setDrawingRouteFor(null)} className="shrink-0 flex items-center gap-1.5 bg-bg-surface text-nature-accent hover:bg-bg-surface-elevated px-3 py-1.5 rounded-full text-xs font-bold transition-colors">
            <CheckCircle2 size={14} /> Listo
          </button>
        </div>
      )}

      {isAddMode && !isDrawingRouteFor && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-nature-primary text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2">
          <MapPin size={16} /> Clica en el mapa para añadir destino
          <button onClick={() => setIsAddMode(false)} className="ml-2 hover:bg-white/20 p-1 rounded-full"><MapPin size={14} className="rotate-45" /></button>
        </div>
      )}

      <div className="absolute top-6 right-6 z-[400] flex flex-col gap-2">
        <button onClick={() => setCenterMeTrigger(prev => prev + 1)} className="bg-bg-surface/90 backdrop-blur text-nature-primary hover:bg-bg-surface p-3 rounded-full shadow-lg transition-colors border border-border-strong" title="Centrar en mí">
          <LocateFixed size={20} />
        </button>
        <button onClick={() => setReframeTrigger(prev => prev + 1)} className="bg-bg-surface/90 backdrop-blur text-nature-primary hover:bg-bg-surface p-3 rounded-full shadow-lg transition-colors border border-border-strong" title="Reencuadrar Mapa (Ver todo)">
          <Maximize size={20} />
        </button>
        <button onClick={() => setIsAddMode(!isAddMode)} className={`p-3 rounded-full shadow-lg transition-colors border ${isAddMode ? 'bg-nature-primary text-white border-nature-primary' : 'bg-bg-surface/90 backdrop-blur text-nature-primary hover:bg-bg-surface border-border-strong'}`} title="Añadir Destino en Mapa">
          <MapPin size={20} />
        </button>
        <button onClick={() => setMapType(prev => prev === 'm' ? 's' : 'm')} className="bg-bg-surface/90 backdrop-blur text-nature-primary hover:bg-bg-surface p-3 rounded-full shadow-lg transition-colors border border-border-strong" title="Cambiar Vista">
          {mapType === 'm' ? <Layers size={20} /> : <MapPin size={20} />}
        </button>
        <button onClick={() => setIsFormPanelOpen(true)} className="md:hidden bg-nature-primary text-white p-3 rounded-full shadow-lg"><MapPin size={20} /></button>
      </div>


      <div className="absolute bottom-6 left-6 z-[400] bg-bg-surface/80 backdrop-blur px-4 py-2 rounded-full border border-border-strong text-[10px] text-text-secondary shadow-sm pointer-events-none flex gap-4">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-nature-primary"></span>Esencial</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-nature-accent"></span>Opcional</div>
      </div>
    </div>
  );
};
