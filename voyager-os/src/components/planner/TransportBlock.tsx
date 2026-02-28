import { memo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Navigation2, Car, Train, Map, Loader2, Bike, PenTool } from 'lucide-react';
import { useAppStore } from '../../store';
import type { LocationItem, TransportSegment } from '../../types';
import { calculateRoute } from '../../lib/routingService';

interface TransportBlockProps {
  fromLoc: LocationItem;
  toLoc: LocationItem;
}

export const TransportBlock = memo(({ fromLoc, toLoc }: TransportBlockProps) => {
  const { transports, addTransport, addToast, setDrawingRouteFor, isDrawingRouteFor } = useAppStore();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [hasAttemptedAutoCalc, setHasAttemptedAutoCalc] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, spaceAbove: 0, spaceBelow: 0 });

  const transportId = `${fromLoc.id}-${toLoc.id}`;
  const segment = transports.find(t => t.id === transportId);

  const mode = segment?.mode || 'walk';
  const duration = segment?.durationCalculated || segment?.durationOverride;

  // Haversine distance in meters between two coords
  const haversineDistance = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  const handleCalculate = async (selectedMode: TransportSegment['mode']) => {
    setIsCalculating(true);
    setShowOptions(false);

    try {
      const result = await calculateRoute(fromLoc, toLoc, selectedMode);

      if (!result) {
        addToast(`No se pudo calcular la ruta ${selectedMode === 'car' ? 'en coche' : selectedMode === 'bike' ? 'en bici' : 'andando'}. Usando línea recta.`, 'info');
      }

      await addTransport({
        id: transportId,
        fromLocationId: fromLoc.id,
        toLocationId: toLoc.id,
        mode: selectedMode,
        durationCalculated: result?.duration || 0,
        distance: result?.distance || 0,
        polyline: result?.polyline || [[fromLoc.coords!.lat, fromLoc.coords!.lng], [toLoc.coords!.lat, toLoc.coords!.lng]],
      });
    } catch (error) {
      console.error('Failed to calculate route', error);
      addToast('Error de conexión al calcular la ruta.', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (!segment && fromLoc.coords && toLoc.coords && !isCalculating && !hasAttemptedAutoCalc) {
      setHasAttemptedAutoCalc(true);
      const dist = haversineDistance(fromLoc.coords, toLoc.coords);
      const autoMode = dist > 3000 ? 'car' : 'walk';
      handleCalculate(autoMode);
    }
  }, [segment, fromLoc.coords, toLoc.coords, isCalculating, hasAttemptedAutoCalc]);

  const toggleOptions = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.top,
        left: rect.left + rect.width / 2,
        spaceAbove: rect.top,
        spaceBelow: window.innerHeight - rect.bottom
      });
    }
    setShowOptions(!showOptions);
  };

  return (
    <div className={`flex items-center justify-center -my-2 relative group ${showOptions ? 'z-[100]' : 'z-10'}`}>
      <div className="absolute left-1/2 -top-4 bottom-0 w-[2px] bg-gray-200 group-hover:bg-nature-primary/50 transition-colors -z-10" />

      <div className="relative">
        <button
          ref={buttonRef}
          onClick={toggleOptions}
          disabled={isCalculating}
          className="bg-white border text-gray-500 border-gray-200 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm hover:border-nature-primary hover:text-nature-primary hover:shadow-md transition-all disabled:opacity-50"
        >
          {isCalculating ? <Loader2 size={10} className="animate-spin" /> : (
            <>
              {(!duration || mode === 'walk') && <Map size={10} />}
              {duration && mode === 'car' && <Car size={10} />}
              {duration && mode === 'transit' && <Train size={10} />}
              {duration && mode === 'bike' && <Bike size={10} />}
              {mode === 'manual' && <PenTool size={10} />}
              {duration && mode === 'flight' && <Navigation2 size={10} className="rotate-45" />}
            </>
          )}
          <span>{mode === 'manual' ? (isDrawingRouteFor === transportId ? 'Dibujando...' : 'Manual') : (duration ? `${duration} min${mode === 'transit' ? ' (manual)' : ''}` : null)}</span>
        </button>

        {showOptions && createPortal(
          <div
            className={`fixed z-[9999] -translate-x-1/2 animate-fade-in-up ${menuPos.spaceAbove < 300 && menuPos.spaceBelow > 300 ? 'translate-y-2' : '-translate-y-[calc(100%+8px)]'}`}
            style={{
              top: menuPos.spaceAbove < 300 && menuPos.spaceBelow > 300 ? menuPos.top + 24 : menuPos.top,
              left: menuPos.left
            }}
          >
            <div className="bg-white dark:bg-nature-surface rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-nature-border p-1.5 min-w-[200px] flex flex-col gap-0.5 overflow-hidden ring-1 ring-black/5">
              <div className="px-3 py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100/50 mb-1">
                Modo de Transporte
              </div>

              <button onClick={() => handleCalculate('walk')} className="w-full px-3 py-2.5 hover:bg-nature-primary hover:text-white rounded-xl text-gray-600 transition-all flex items-center gap-3 group/btn">
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover/btn:bg-white/20 flex items-center justify-center transition-colors">
                  <Map size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold leading-none">Persona</span>
                  <span className="text-[9px] opacity-60 font-medium">Caminando</span>
                </div>
              </button>

              <button onClick={() => handleCalculate('bike')} className="w-full px-3 py-2.5 hover:bg-nature-primary hover:text-white rounded-xl text-gray-600 transition-all flex items-center gap-3 group/btn">
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover/btn:bg-white/20 flex items-center justify-center transition-colors">
                  <Bike size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold leading-none">Bicicleta</span>
                  <span className="text-[9px] opacity-60 font-medium">Carril bici</span>
                </div>
              </button>

              <button onClick={() => handleCalculate('car')} className="w-full px-3 py-2.5 hover:bg-nature-primary hover:text-white rounded-xl text-gray-600 transition-all flex items-center gap-3 group/btn">
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover/btn:bg-white/20 flex items-center justify-center transition-colors">
                  <Car size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold leading-none">Coche / Taxi</span>
                  <span className="text-[9px] opacity-60 font-medium">Ruta rápida</span>
                </div>
              </button>

              <button onClick={() => {
                const mins = prompt('¿Cuántos minutos en transporte público? (Aprox)', '15');
                if (mins && !isNaN(parseInt(mins))) {
                  addTransport({ id: transportId, fromLocationId: fromLoc.id, toLocationId: toLoc.id, mode: 'transit', durationOverride: parseInt(mins) });
                }
                setShowOptions(false);
              }} className="w-full px-3 py-2.5 hover:bg-nature-primary hover:text-white rounded-xl text-gray-600 transition-all flex items-center gap-3 group/btn">
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover/btn:bg-white/20 flex items-center justify-center transition-colors">
                  <Train size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold leading-none">Autobús / Tren</span>
                  <span className="text-[9px] opacity-60 font-medium">Tiempo manual</span>
                </div>
              </button>

              <div className="h-px bg-gray-100/50 my-1 mx-2" />

              <button onClick={() => {
                addTransport({ id: transportId, fromLocationId: fromLoc.id, toLocationId: toLoc.id, mode: 'manual', durationCalculated: 0, distance: 0, polyline: [] });
                setDrawingRouteFor(transportId);
                setShowOptions(false);
                addToast('Modo dibujo: Clica en el mapa para añadir puntos. Al terminar, cierra este aviso o cambia a otro modo.', 'info');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="w-full px-3 py-3 bg-nature-accent/10 hover:bg-nature-accent text-nature-accent hover:text-white rounded-xl transition-all flex items-center gap-3 group/btn">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm group-hover/btn:bg-white/20 flex items-center justify-center transition-colors">
                  <PenTool size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Trazado Manual</span>
                  <span className="text-[9px] opacity-70 font-medium">Dibujar en el mapa</span>
                </div>
              </button>
            </div>

            {/* Click outside to close */}
            <div className="fixed inset-0 -z-10" onClick={() => setShowOptions(false)} />
          </div>,
          document.body
        )}
      </div>
    </div>
  );
});

TransportBlock.displayName = 'TransportBlock';
