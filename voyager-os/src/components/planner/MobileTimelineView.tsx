import { useMemo, useState } from 'react';
import { useAppStore } from '../../store';
import { MapPin, Clock, CheckCircle2, Car, Plane, SkipForward } from 'lucide-react';
import { CAT_ICONS } from '../../constants';
import { TransportBlock } from './TransportBlock';
import type { LocationItem } from '../../types';

export const MobileTimelineView = () => {
  const { locations } = useAppStore();
  const [skippedTasks, setSkippedTasks] = useState<Set<number>>(new Set());

  const todayLocations = useMemo(() => {
    // For the sake of the demo, we pick the first day that has locations, or simply filter "Lunes"
    // In a real app we would match Date.now() with the assigned dates
    const day = locations.find(l => l.day !== 'unassigned')?.day || 'Lunes';
    return locations.filter(l => l.day === day && (l.variantId || 'default') === 'default');
  }, [locations]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col custom-scroll">
      <header className="bg-white px-6 pt-12 pb-6 border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-3xl font-serif text-nature-primary">Hoy</h1>
        <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">{todayLocations[0]?.day || 'Itinerario'}</p>
      </header>

      <div className="flex-1 p-6 relative">
        {/* The 'You are here' pulse line (simulated) */}
        <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-nature-primary/20 z-10 flex items-center">
          <div className="w-2 h-2 rounded-full bg-nature-primary ml-2 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-nature-primary absolute left-2" />
        </div>

        <div className="space-y-6 relative border-l-2 border-gray-200 ml-4 pb-12">
          {todayLocations.length === 0 && (
            <p className="pl-6 text-gray-400 text-sm">No hay actividades planeadas para hoy.</p>
          )}

          {(() => {
            const clusters: LocationItem[][] = [];
            let currentCluster: LocationItem[] = [];

            todayLocations.forEach((loc) => {
              if (currentCluster.length === 0) {
                currentCluster.push(loc);
              } else {
                const prev = currentCluster[currentCluster.length - 1];
                if (loc.slot && loc.slot === prev.slot) {
                  currentCluster.push(loc);
                } else {
                  clusters.push(currentCluster);
                  currentCluster = [loc];
                }
              }
            });
            if (currentCluster.length > 0) clusters.push(currentCluster);

            return clusters.map((cluster, cIndex) => (
              <div key={`cluster-${cIndex}`} className="relative pl-6 group mb-6">
                {/* Timeline dot */}
                <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-gray-50 bg-white ${cIndex === 0 ? 'border-nature-primary/30' : 'border-gray-200'}`} />

                <div className={`flex flex-col gap-4 ${cluster.length > 1 ? 'bg-black/5 p-3 rounded-3xl border border-black/5' : ''}`}>
                  {cluster.map((loc) => (
                    <div key={loc.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-opacity duration-500 ${skippedTasks.has(loc.id) ? 'opacity-40 grayscale' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl bg-gray-50 p-2 rounded-xl">{CAT_ICONS[loc.cat]}</span>
                          <div>
                            <h3 className={`font-bold text-base leading-tight ${skippedTasks.has(loc.id) ? 'text-gray-400 line-through' : 'text-nature-text'}`}>{loc.title || loc.notes.split('\n')[0] || 'Ubicación'}</h3>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                              <Clock size={10} />
                              {loc.datetime ? new Date(loc.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : loc.slot || 'S/H'}
                            </div>
                          </div>
                        </div>
                        {loc.reservationStatus === 'booked' && <CheckCircle2 size={16} className="text-green-500" />}
                      </div>

                      {/* Highly Actionable Mobile Buttons */}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => window.open(loc.link || `https://maps.google.com/?q=${loc.coords?.lat},${loc.coords?.lng}`, '_blank')} className="flex-1 bg-nature-mint/30 hover:bg-nature-mint/50 transition-colors text-nature-primary text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <MapPin size={14} /> Mapa
                        </button>
                        {loc.cat === 'flight' ? (
                          <button className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                            <Plane size={14} /> PNR
                          </button>
                        ) : (
                          <>
                            <button className="flex-[2] bg-gray-900 text-white hover:bg-gray-800 transition-colors text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                              <Car size={14} /> Uber
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSkippedTasks(prev => {
                                const n = new Set(prev);
                                if (n.has(loc.id)) n.delete(loc.id); else n.add(loc.id);
                                return n;
                              });
                            }} className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[10px] uppercase tracking-wider font-bold py-2.5 rounded-xl flex items-center justify-center gap-1">
                              <SkipForward size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Transport Block between clusters */}
                {cIndex < clusters.length - 1 && (
                  <div className="py-2 ml-4">
                    <TransportBlock fromLoc={cluster[cluster.length - 1]} toLoc={clusters[cIndex + 1][0]} />
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
