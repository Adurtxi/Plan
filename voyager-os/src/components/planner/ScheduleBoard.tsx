import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableCard } from '../ui/SortableCard';
import { TransportBlock } from './TransportBlock';
import { useAppStore } from '../../store';
import { DAYS } from '../../constants';
import type { LocationItem } from '../../types';

interface BoardColumnProps {
  dayId: string; // The internal id (e.g. 'day-1', '2024-05-01')
  dayLabel: string; // The display label (e.g. 'Día 1', 'Lunes 15')
  isDimmed: boolean;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
  handleCardClick: (id: number) => void;
  handleAddNewToDay?: (day: string, variantId: string) => void;
  handleAddFreeTimeToDay?: (day: string, variantId: string) => void;
  movingItemId: number | null;
  setMovingItemId: (id: number | null) => void;
}

const GroupContainer = ({ groupId, items, handleEdit, handleCardClick, setMovingItemId, movingItemId }: { groupId: string, items: LocationItem[], handleEdit: any, handleCardClick: any, setMovingItemId: any, movingItemId: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${groupId}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const { ungroupLocationGroup, groupWithNext } = useAppStore();

  return (
    <div ref={setNodeRef} style={style} className="bg-white/60 border-2 border-dashed border-gray-200/60 rounded-[24px] p-2 pt-8 pb-3 relative group/container mt-4 mb-2 shadow-sm transition-all hover:bg-white/80">
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-3 left-4 bg-gray-50 text-gray-500 hover:text-nature-primary text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-gray-200 cursor-grab active:cursor-grabbing hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
      >
        <span className="opacity-50">⣿</span> Paquete Visible
      </div>

      <button onClick={() => ungroupLocationGroup(groupId)} className="absolute -top-3 right-4 bg-white text-gray-400 hover:text-red-500 hover:border-red-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-gray-100 opacity-0 group-hover/container:opacity-100 transition-all shadow-sm z-20">
        Desagrupar
      </button>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const nextItem = index < items.length - 1 ? items[index + 1] : null;
          return (
            <div key={item.id} className="relative z-10 w-full outline-none">
              <SortableCard
                item={item}
                onClick={() => handleEdit(item.id)}
                onCardClick={() => handleCardClick(item.id)}
                onMoveClick={() => setMovingItemId(movingItemId === item.id ? null : item.id)}
                onGroupToggle={nextItem ? undefined : () => groupWithNext(item.id)}
                isMoving={movingItemId === item.id}
              />
              {nextItem && item.cat !== 'free' && nextItem.cat !== 'free' && (
                <div className="mt-2 mb-1 w-full">
                  <TransportBlock fromLoc={item} toLoc={nextItem} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BoardColumn = ({ dayId, dayLabel, isDimmed, locations, handleEdit, handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, movingItemId, setMovingItemId }: BoardColumnProps) => {
  const [activeVariant, setActiveVariant] = useState<string>('default');
  const { isOver, setNodeRef } = useDroppable({ id: `col-${dayId}::${activeVariant}` });
  const [additionalVariants, setAdditionalVariants] = useState<string[]>([]);
  const { updateLocationDay, groupWithNext } = useAppStore();

  const dayVariants = useMemo(() => {
    const vars = new Set([...locations.map(l => l.variantId || 'default'), ...additionalVariants, 'default']);
    return Array.from(vars).sort();
  }, [locations, additionalVariants]);

  const filteredLocations = useMemo(() => {
    return locations
      .filter(l => (l.variantId || 'default') === activeVariant)
      .sort((a, b) => {
        if (a.datetime && b.datetime) {
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
        }
        if (a.datetime) return -1;
        if (b.datetime) return 1;
        return (a.order ?? a.id) - (b.order ?? b.id);
      });
  }, [locations, activeVariant]);

  const handleMoveHere = () => {
    if (movingItemId) {
      updateLocationDay(movingItemId, dayId, activeVariant);
      setMovingItemId(null);
    }
  };

  const blocks = useMemo(() => {
    const arr: any[] = [];
    let currentGroup: LocationItem[] = [];
    let currentGroupId: string | null = null;

    filteredLocations.forEach(item => {
      if (item.groupId) {
        if (item.groupId === currentGroupId) {
          currentGroup.push(item);
        } else {
          if (currentGroup.length > 0) arr.push({ type: 'group', id: `group-${currentGroupId}`, groupId: currentGroupId, items: currentGroup });
          currentGroupId = item.groupId;
          currentGroup = [item];
        }
      } else {
        if (currentGroup.length > 0) {
          arr.push({ type: 'group', id: `group-${currentGroupId}`, groupId: currentGroupId, items: currentGroup });
          currentGroup = [];
          currentGroupId = null;
        }
        arr.push({ type: 'single', id: item.id.toString(), item });
      }
    });
    if (currentGroup.length > 0) arr.push({ type: 'group', id: `group-${currentGroupId}`, groupId: currentGroupId, items: currentGroup });
    return arr;
  }, [filteredLocations]);

  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    blocks.forEach(b => {
      ids.push(b.id);
      if (b.type === 'group') {
        b.items.forEach((i: any) => ids.push(i.id.toString()));
      }
    });
    return ids;
  }, [blocks]);

  return (
    <div className={`flex-none w-[340px] flex flex-col h-full bg-white border ${movingItemId ? 'border-nature-accent ring-2 ring-nature-accent/50' : 'border-gray-100'} rounded-[32px] overflow-hidden group shadow-sm transition-all hover:shadow-md ${isDimmed && !movingItemId ? 'opacity-40' : ''}`}>
      <div className="p-5 pb-3 border-b border-gray-50 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <span className="font-serif text-2xl text-nature-primary font-medium">{dayLabel}</span>
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

        {handleAddNewToDay && (
          <div className="flex gap-2 w-full mt-3">
            <button onClick={() => handleAddNewToDay(dayId, activeVariant)} className="flex-1 bg-nature-mint/30 hover:bg-nature-mint/50 border border-nature-primary/20 text-nature-primary py-2 rounded-xl border border-dashed text-xs font-bold transition-colors flex items-center justify-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Actividad
            </button>
            <button onClick={() => {
              if (handleAddFreeTimeToDay) {
                handleAddFreeTimeToDay(dayId, activeVariant);
              }
            }} className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 py-2 rounded-xl border-dashed text-xs font-bold transition-colors flex items-center justify-center gap-1" title="Añadir Hueco Libre">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Libre
            </button>
          </div>
        )}
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/30' : 'bg-gray-50/30'} flex flex-col gap-3 transition-colors relative`}>
        {movingItemId && (
          <button onClick={handleMoveHere} className="w-full py-3 bg-nature-accent/10 border-2 border-dashed border-nature-accent/50 text-nature-accent rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-nature-accent hover:text-white transition-all">
            Mover Aquí
          </button>
        )}

        <SortableContext items={sortableIds}>
          {blocks.map((block, index) => {
            const isGroup = block.type === 'group';
            const nextBlock = index < blocks.length - 1 ? blocks[index + 1] : null;

            const blockLastItem = isGroup ? block.items[block.items.length - 1] : block.item;
            const nextBlockFirstItem = nextBlock
              ? (nextBlock.type === 'group' ? nextBlock.items[0] : nextBlock.item)
              : null;

            const showTransport = nextBlockFirstItem && blockLastItem.cat !== 'free' && nextBlockFirstItem.cat !== 'free';

            return (
              <div key={block.id} className="relative flex flex-col gap-3">
                {isGroup ? (
                  <GroupContainer
                    groupId={block.groupId}
                    items={block.items}
                    handleEdit={handleEdit}
                    handleCardClick={handleCardClick}
                    setMovingItemId={setMovingItemId}
                    movingItemId={movingItemId}
                  />
                ) : (
                  <div className="relative z-10 w-full outline-none">
                    <SortableCard
                      item={block.item}
                      onClick={() => handleEdit(block.item.id)}
                      onCardClick={() => handleCardClick(block.item.id)}
                      onMoveClick={() => setMovingItemId(movingItemId === block.item.id ? null : block.item.id)}
                      onGroupToggle={() => groupWithNext(block.item.id)}
                      isMoving={movingItemId === block.item.id}
                    />
                  </div>
                )}

                {/* Transport block connecting this block to the next block */}
                {showTransport && (
                  <div className="relative z-10 mx-1 mb-1 w-full">
                    <TransportBlock fromLoc={blockLastItem} toLoc={nextBlockFirstItem} />
                  </div>
                )}
              </div>
            );
          })}
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
  handleCardClick: (id: number) => void;
  handleAddNewToDay?: (day: string, variantId: string) => void;
  handleAddFreeTimeToDay?: (day: string, variantId: string) => void;
  viewMode?: 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
}

export const ScheduleBoard = ({ handleEdit, handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, viewMode }: ScheduleBoardProps) => {
  const { locations, filterDay, tripVariants, activeGlobalVariantId } = useAppStore();
  const [movingItemId, setMovingItemId] = useState<number | null>(null);

  // If clicking outside when moving, cancel
  const handleBgClick = (e: React.MouseEvent) => {
    if (movingItemId && e.target === e.currentTarget) {
      setMovingItemId(null);
    }
  };

  const displayDays = useMemo(() => {
    // Determine dynamic days based on active variant
    let dynamicDays: { id: string, label: string }[] = [];
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);

    if (activeVar && activeVar.startDate && activeVar.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;

      const copyDate = new Date(start);
      while (copyDate <= end) {
        const id = `day-${i}`;
        const label = copyDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        dynamicDays.push({ id, label });

        copyDate.setDate(copyDate.getDate() + 1);
        i++;
      }
    } else {
      dynamicDays = DAYS.map(d => ({ id: d, label: d }));
    }

    if (viewMode === 'split-vertical') {
      return filterDay !== 'all' ? dynamicDays.filter(d => d.id === filterDay) : [];
    }
    return dynamicDays;
  }, [viewMode, filterDay, tripVariants, activeGlobalVariantId]);

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
          {displayDays.map(dayObj => (
            <BoardColumn
              key={dayObj.id}
              dayId={dayObj.id}
              dayLabel={dayObj.label}
              isDimmed={filterDay !== 'all' && filterDay !== dayObj.id}
              locations={locations.filter(l => l.day === dayObj.id)}
              handleEdit={handleEdit}
              handleCardClick={handleCardClick}
              handleAddNewToDay={handleAddNewToDay}
              handleAddFreeTimeToDay={handleAddFreeTimeToDay}
              movingItemId={movingItemId}
              setMovingItemId={setMovingItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
