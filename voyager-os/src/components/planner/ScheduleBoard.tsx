import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableCard } from '../ui/SortableCard';
import { TransportBlock } from './TransportBlock';
import { useAppStore } from '../../store';
import { DAYS } from '../../constants';
import type { LocationItem } from '../../types';

interface BoardColumnProps {
  day: string;
  isDimmed: boolean;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
  movingItemId: number | null;
  setMovingItemId: (id: number | null) => void;
}

const BoardColumn = ({ day, isDimmed, locations, handleEdit, movingItemId, setMovingItemId }: BoardColumnProps) => {
  const [activeVariant, setActiveVariant] = useState<string>('default');
  const { isOver, setNodeRef } = useDroppable({ id: `col-${day}::${activeVariant}` });
  const [additionalVariants, setAdditionalVariants] = useState<string[]>([]);
  const { updateLocationDay } = useAppStore();

  const dayVariants = useMemo(() => {
    const vars = new Set([...locations.map(l => l.variantId || 'default'), ...additionalVariants, 'default']);
    return Array.from(vars).sort();
  }, [locations, additionalVariants]);

  const filteredLocations = locations.filter(l => (l.variantId || 'default') === activeVariant);

  const handleMoveHere = () => {
    if (movingItemId) {
      updateLocationDay(movingItemId, day, activeVariant);
      setMovingItemId(null);
    }
  };

  return (
    <div className={`flex-none w-[340px] flex flex-col h-full bg-white border ${movingItemId ? 'border-nature-accent ring-2 ring-nature-accent/50' : 'border-gray-100'} rounded-[32px] overflow-hidden group shadow-sm transition-all hover:shadow-md ${isDimmed && !movingItemId ? 'opacity-40' : ''}`}>
      <div className="p-5 pb-3 border-b border-gray-50 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <span className="font-serif text-2xl text-nature-primary font-medium">{day}</span>
          <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Itinerario</span>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl">
          {dayVariants.map(v => (
            <button
              key={v}
              onClick={() => setActiveVariant(v)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeVariant === v ? 'bg-white text-nature-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {v === 'default' ? 'Ruta 1' : v.replace('option-', 'Ruta ')}
            </button>
          ))}
          <button onClick={() => {
            const newVar = prompt('Nombre de la nueva variante: (ej. option-B, Lluvia, etc)');
            if (newVar) { setAdditionalVariants(prev => [...prev, newVar]); setActiveVariant(newVar); }
          }} className="px-3 text-gray-400 hover:text-nature-primary transition-colors">+</button>
        </div>
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/30' : 'bg-gray-50/30'} flex flex-col gap-3 transition-colors relative`}>
        {movingItemId && (
          <button onClick={handleMoveHere} className="w-full py-3 bg-nature-accent/10 border-2 border-dashed border-nature-accent/50 text-nature-accent rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-nature-accent hover:text-white transition-all">
            Mover Aquí
          </button>
        )}

        <SortableContext items={filteredLocations.map(l => l.id.toString())}>
          {(() => {
            const clusters: LocationItem[][] = [];
            let currentCluster: LocationItem[] = [];

            filteredLocations.forEach((loc) => {
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
            if (currentCluster.length > 0) Object.freeze(clusters.push(currentCluster));

            return clusters.map((cluster, cIndex) => (
              <div key={`cluster-${cIndex}`} className="relative flex flex-col gap-3">
                {/* Visual Cluster Container if more than 1 item */}
                <div className={`flex flex-col gap-2 ${cluster.length > 1 ? 'bg-black/5 p-2 rounded-3xl border border-black/5 relative' : ''}`}>
                  {cluster.length > 1 && (
                    <div className="absolute -left-2 top-4 bottom-4 w-1 bg-nature-accent/30 rounded-full" />
                  )}
                  {cluster.map((item) => (
                    <SortableCard
                      key={item.id}
                      item={item}
                      onClick={() => handleEdit(item.id)}
                      onMoveClick={() => setMovingItemId(movingItemId === item.id ? null : item.id)}
                      isMoving={movingItemId === item.id}
                    />
                  ))}
                </div>

                {/* Transport block between clusters */}
                {cIndex < clusters.length - 1 && (
                  <TransportBlock fromLoc={cluster[cluster.length - 1]} toLoc={clusters[cIndex + 1][0]} />
                )}
              </div>
            ));
          })()}
        </SortableContext>

        {filteredLocations.length === 0 && !movingItemId && (
          <div className="m-auto text-center space-y-2 opacity-50">
            <p className="text-xs text-gray-500 font-medium">Arrastra actividades aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ScheduleBoardProps {
  handleEdit: (id: number) => void;
  viewMode?: 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
}

export const ScheduleBoard = ({ handleEdit, viewMode }: ScheduleBoardProps) => {
  const { locations, filterDay } = useAppStore();
  const [movingItemId, setMovingItemId] = useState<number | null>(null);

  // If clicking outside when moving, cancel
  const handleBgClick = (e: React.MouseEvent) => {
    if (movingItemId && e.target === e.currentTarget) {
      setMovingItemId(null);
    }
  };

  const displayDays = useMemo(() => {
    if (viewMode === 'split-vertical') {
      return filterDay !== 'all' ? [filterDay] : [];
    }
    return DAYS;
  }, [viewMode, filterDay]);

  return (
    <div className="h-full w-full overflow-x-auto p-6 pb-12 bg-nature-bg custom-scroll transition-colors relative" onClick={handleBgClick}>
      {movingItemId && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-nature-accent text-white px-6 py-2 rounded-full font-bold shadow-lg animate-fade-in z-50">Selecciona el día donde quieres mover la actividad</div>}

      {viewMode === 'split-vertical' && filterDay === 'all' ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
          <div className="w-16 h-16 rounded-full bg-nature-primary/10 flex items-center justify-center mb-4 text-nature-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <p className="font-serif text-xl text-nature-primary font-bold mb-2">Selecciona un día</p>
          <p className="text-sm text-gray-500 max-w-xs">Elige un día en el filtro del mapa para ver su itinerario aquí.</p>
        </div>
      ) : (
        <div className="flex gap-6 h-full min-w-max pb-4">
          {displayDays.map(day => (
            <BoardColumn
              key={day}
              day={day}
              isDimmed={filterDay !== 'all' && filterDay !== day}
              locations={locations.filter(l => l.day === day)}
              handleEdit={handleEdit}
              movingItemId={movingItemId}
              setMovingItemId={setMovingItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
