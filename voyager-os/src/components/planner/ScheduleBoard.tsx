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
}

const BoardColumn = ({ day, isDimmed, locations, handleEdit }: BoardColumnProps) => {
  const [activeVariant, setActiveVariant] = useState<string>('default');
  const { isOver, setNodeRef } = useDroppable({ id: `col-${day}::${activeVariant}` });
  const [additionalVariants, setAdditionalVariants] = useState<string[]>([]);

  // Discover unique variants for this day, ensure 'default' is always there
  const dayVariants = useMemo(() => {
    const vars = new Set([...locations.map(l => l.variantId || 'default'), ...additionalVariants, 'default']);
    return Array.from(vars).sort();
  }, [locations, additionalVariants]);

  const filteredLocations = locations.filter(l => (l.variantId || 'default') === activeVariant);

  return (
    <div className={`flex-none w-[340px] flex flex-col h-full bg-white border border-gray-100 rounded-[32px] overflow-hidden group shadow-sm transition-all hover:shadow-md ${isDimmed ? 'opacity-40' : ''}`}>
      <div className="p-5 pb-3 border-b border-gray-50 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <span className="font-serif text-2xl text-nature-primary font-medium">{day}</span>
          <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Itinerario</span>
        </div>

        {/* Variants Tabs */}
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
          {/* Quick add variant button  */}
          <button onClick={() => {
            const newVar = prompt('Nombre de la nueva variante: (ej. option-B, Lluvia, etc)');
            if (newVar) { setAdditionalVariants(prev => [...prev, newVar]); setActiveVariant(newVar); }
          }} className="px-3 text-gray-400 hover:text-nature-primary transition-colors">+</button>
        </div>
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/30' : 'bg-gray-50/30'} flex flex-col gap-3 transition-colors relative`}>
        <SortableContext items={filteredLocations.map(l => l.id.toString())}>
          {filteredLocations.map((item, index) => (
            <div key={item.id} className="relative flex flex-col gap-3">
              <SortableCard item={item} onClick={() => handleEdit(item.id)} />
              {/* Inject Transport Block between items */}
              {index < filteredLocations.length - 1 && (
                <TransportBlock mode="transit" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${item.coords?.lat},${item.coords?.lng}&destination=${filteredLocations[index + 1].coords?.lat},${filteredLocations[index + 1].coords?.lng}&travelmode=transit`, '_blank')} />
              )}
            </div>
          ))}
        </SortableContext>

        {filteredLocations.length === 0 && (
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
}

export const ScheduleBoard = ({ handleEdit }: ScheduleBoardProps) => {
  const { locations, filterDay } = useAppStore();

  return (
    <div className="h-[50%] overflow-x-auto p-6 bg-nature-bg custom-scroll">
      <div className="flex gap-6 h-full min-w-max pb-4">
        {DAYS.map(day => (
          <BoardColumn
            key={day}
            day={day}
            isDimmed={filterDay !== 'all' && filterDay !== day}
            locations={locations.filter(l => l.day === day)}
            handleEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  );
};
