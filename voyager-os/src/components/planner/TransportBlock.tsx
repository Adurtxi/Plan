import { memo, useState, useEffect } from 'react';
import { Navigation2, Car, Train, Map, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store';
import type { LocationItem, TransportSegment } from '../../types';
import { calculateRoute } from '../../lib/routingService';

interface TransportBlockProps {
  fromLoc: LocationItem;
  toLoc: LocationItem;
}

export const TransportBlock = memo(({ fromLoc, toLoc }: TransportBlockProps) => {
  const { transports, addTransport, addToast } = useAppStore();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [hasAttemptedAutoCalc, setHasAttemptedAutoCalc] = useState(false);

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

      await addTransport({
        id: transportId,
        fromLocationId: fromLoc.id,
        toLocationId: toLoc.id,
        mode: selectedMode,
        durationCalculated: result?.duration,
        distance: result?.distance,
        polyline: result?.polyline,
      });
    } catch (error) {
      console.error('Failed to calculate route', error);
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
      addToast(
        autoMode === 'car' ? `Ruta en coche 🚗 (${(dist / 1000).toFixed(1)}km)` : `Ruta andando 🚶 (${Math.round(dist)}m)`,
        'info'
      );
    }
  }, [segment, fromLoc.coords, toLoc.coords, isCalculating, hasAttemptedAutoCalc]);

  return (
    <div className="flex items-center justify-center -my-2 z-10 relative group">
      <div className="absolute left-1/2 -top-4 bottom-0 w-[2px] bg-gray-200 group-hover:bg-nature-primary/50 transition-colors -z-10" />

      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={isCalculating}
          className="bg-white border text-gray-500 border-gray-200 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm hover:border-nature-primary hover:text-nature-primary hover:shadow-md transition-all disabled:opacity-50"
        >
          {isCalculating ? <Loader2 size={10} className="animate-spin" /> : (
            <>
              {(!duration || mode === 'walk') && <Map size={10} />}
              {duration && mode === 'car' && <Car size={10} />}
              {duration && mode === 'transit' && <Train size={10} />}
              {duration && mode === 'flight' && <Navigation2 size={10} className="rotate-45" />}
            </>
          )}
          <span>{duration ? `${duration} min${mode === 'transit' ? ' (manual)' : ''}` : null}</span>
        </button>

        {showOptions && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-2 z-40 animate-fade-in-up">
            <button onClick={() => handleCalculate('walk')} className="p-2 w-16 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-nature-primary transition-colors flex flex-col items-center gap-1"><Map size={16} /><span className="text-[9px] font-bold uppercase tracking-wider">Andar</span></button>
            <button onClick={() => handleCalculate('car')} className="p-2 w-16 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-nature-primary transition-colors flex flex-col items-center gap-1"><Car size={16} /><span className="text-[9px] font-bold uppercase tracking-wider">Coche</span></button>
            <button onClick={() => {
              const mins = prompt('¿Cuántos minutos en transporte público? (Aprox)', '15');
              if (mins && !isNaN(parseInt(mins))) {
                addTransport({ id: transportId, fromLocationId: fromLoc.id, toLocationId: toLoc.id, mode: 'transit', durationOverride: parseInt(mins) });
              }
              setShowOptions(false);
            }} className="p-2 w-16 hover:bg-gray-50 rounded-lg text-gray-600 hover:text-nature-primary transition-colors flex flex-col items-center gap-1"><Train size={16} /><span className="text-[9px] font-bold uppercase tracking-wider">Bus</span></button>
          </div>
        )}
      </div>
    </div>
  );
});

TransportBlock.displayName = 'TransportBlock';
