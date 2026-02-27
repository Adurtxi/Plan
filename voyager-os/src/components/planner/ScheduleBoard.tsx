import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown } from 'lucide-react';
import { SortableCard } from '../ui/SortableCard';
import { TransportBlock } from './TransportBlock';
import { useAppStore } from '../../store';
import { DAYS, LOGISTICS_TYPES } from '../../constants';
import type { LocationItem, LogisticsType } from '../../types';

/* ── MoveSlot: clickable drop-zone shown between cards when moving ── */
const MoveSlot = ({ onClick, label }: { onClick: () => void; label?: string }) => (
  <button
    onClick={onClick}
    className="w-full my-1 py-3 border-2 border-dashed border-nature-primary/40 rounded-2xl bg-nature-mint/20 hover:bg-nature-mint/50 hover:border-nature-primary hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-nature-primary text-xs font-bold uppercase tracking-widest cursor-pointer group/slot animate-pulse hover:animate-none"
  >
    <ArrowDown size={14} className="opacity-60 group-hover/slot:opacity-100 transition-opacity" />
    {label || 'Colocar aquí'}
  </button>
);

/* ── LogisticsQuickAdd: popover to add logistics cards to a day ── */
const LogisticsQuickAdd = ({ dayId, variantId }: { dayId: string; variantId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addLocation, addToast } = useAppStore();

  const handleAdd = async (type: typeof LOGISTICS_TYPES[number]) => {
    await addLocation({
      id: Date.now(),
      title: type.label,
      link: '',
      coords: null,
      priority: 'necessary' as const,
      cat: 'logistics' as const,
      logisticsType: type.value as LogisticsType,
      cost: '0',
      slot: 'Mañana',
      notes: '',
      images: [],
      day: dayId,
      variantId,
      reservationStatus: 'idea' as const,
      order: Date.now(),
    });
    addToast(`${type.icon} ${type.label} añadido`, 'success');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 py-1.5 rounded-xl border-dashed text-[10px] font-bold transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
      >
        📋 + Logística
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 grid grid-cols-2 gap-1 animate-fade-in-up">
          {LOGISTICS_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => handleAdd(type)}
              className="text-left px-2.5 py-2 rounded-lg hover:bg-gray-50 text-xs font-bold text-gray-600 hover:text-nature-primary transition-colors flex items-center gap-2"
            >
              <span className="text-base">{type.icon}</span>
              <span className="truncate">{type.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface BoardColumnProps {
  dayId: string;
  dayLabel: string;
  isDimmed: boolean;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
  handleCardClick: (id: number) => void;
  handleAddNewToDay?: (day: string, variantId: string) => void;
  handleAddFreeTimeToDay?: (day: string, variantId: string) => void;
  onRequestMove?: (id: number) => void;
  mergeTargetId?: number | null;
  movingItemId?: number | null;
  executeMoveHere?: (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => void;
}

const GroupContainer = ({ groupId, items, handleEdit, handleCardClick, onRequestMove, mergeTargetId }: { groupId: string, items: LocationItem[], handleEdit: any, handleCardClick: any, onRequestMove: any, mergeTargetId?: number | null }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${groupId}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const { ungroupLocationGroup } = useAppStore();

  return (
    <div ref={setNodeRef} style={style} className="relative group/container mt-2 mb-3">
      <div
        {...attributes}
        {...listeners}
        className="bg-gray-800 text-white rounded-t-xl px-4 py-2 w-max cursor-grab active:cursor-grabbing flex items-center gap-2 relative z-10 font-bold uppercase tracking-wider text-[10px] shadow-sm ml-4"
      >
        <span className="opacity-50">⣿</span> Grupo de Actividades
        <button onClick={(e) => { e.stopPropagation(); ungroupLocationGroup(groupId); }} className="ml-2 bg-white/10 hover:bg-red-500 hover:text-white rounded px-1.5 py-0.5 text-[9px] transition-colors border border-white/10 opacity-0 group-hover/container:opacity-100">
          DESAGRUPAR
        </button>
      </div>

      <div className="bg-gray-100/80 border border-gray-200/80 rounded-[28px] rounded-tl-sm p-3 relative z-0 shadow-inner flex flex-col gap-2 ring-1 ring-white inset-0">
        <SortableContext items={items.map((i) => i.id.toString())} strategy={() => null}>
          {items.map((item, index) => {
            const nextItem = index < items.length - 1 ? items[index + 1] : null;
            return (
              <div key={item.id} className="relative">
                <SortableCard
                  item={item}
                  onClick={() => handleEdit(item.id)}
                  onCardClick={() => handleCardClick(item.id)}
                  onRequestMove={() => onRequestMove(item.id)}
                  isMergeTarget={item.id === mergeTargetId}
                />
                {nextItem && item.cat !== 'free' && item.cat !== 'logistics' && nextItem.cat !== 'free' && nextItem.cat !== 'logistics' && (
                  <div className="mt-1 mb-0.5 w-full scale-[0.98] opacity-90">
                    <TransportBlock fromLoc={item} toLoc={nextItem} />
                  </div>
                )}
              </div>
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
};

const BoardColumn = ({ dayId, dayLabel, isDimmed, locations: propLocations, handleEdit, handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, onRequestMove, mergeTargetId, movingItemId, executeMoveHere }: BoardColumnProps) => {
  const [additionalVariants, setAdditionalVariants] = useState<string[]>([]);
  const optimisticLocations = useAppStore(s => s.optimisticLocations);
  const { showDialog, addToast, transports, tripVariants, activeGlobalVariantId, toggleFilterDay, filterDays, activeDayVariants, setActiveDayVariant } = useAppStore();
  const activeVariant = activeDayVariants[dayId] || 'default';
  const { isOver, setNodeRef } = useDroppable({ id: `col-${dayId}::${activeVariant}` });

  const dayVariants = useMemo(() => {
    const vars = new Set([...propLocations.map(l => l.variantId || 'default'), ...additionalVariants, 'default']);
    return Array.from(vars).sort();
  }, [propLocations, additionalVariants]);

  const filteredLocations = useMemo(() => {
    const allLocations = optimisticLocations || propLocations;
    const rawFiltered = allLocations
      .filter(l => l.day === dayId && (l.variantId || 'default') === activeVariant)
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

    let baseDate = new Date();
    baseDate.setHours(9, 0, 0, 0);

    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    if (activeVar && activeVar.startDate) {
      const dayIndex = parseInt(dayId.split('-')[1]) || 1;
      baseDate = new Date(activeVar.startDate);
      if (!isNaN(baseDate.getTime())) {
        baseDate.setDate(baseDate.getDate() + (dayIndex - 1));
        baseDate.setHours(9, 0, 0, 0);
      }
    }

    let currentTime = new Date(baseDate);

    return rawFiltered.map((loc, index) => {
      let finalTime = new Date(currentTime);
      if (loc.isPinnedTime && loc.datetime) {
        const pinnedTime = new Date(loc.datetime);
        finalTime.setHours(pinnedTime.getHours(), pinnedTime.getMinutes(), 0, 0);
      }

      const duration = loc.durationMinutes || 60;
      let transportTime = 0;

      const nextLoc = index < rawFiltered.length - 1 ? rawFiltered[index + 1] : null;
      if (nextLoc) {
        const transportId = `${loc.id}-${nextLoc.id}`;
        const segment = transports.find(t => t.id === transportId);
        if (segment && segment.durationCalculated) {
          transportTime = segment.durationCalculated;
        }
      }

      currentTime = new Date(finalTime.getTime() + (duration + transportTime) * 60000);
      return { ...loc, derivedDatetime: finalTime.toISOString() };
    });
  }, [dayId, activeVariant, transports, tripVariants, activeGlobalVariantId]);

  const isMovingMode = !!movingItemId;
  const movingItemIsHere = filteredLocations.some(l => l.id === movingItemId);

  const { locationList, groupElements, blockMeta } = useMemo(() => {
    const list: LocationItem[] = [];
    const elements: any[] = [];
    let currentGroup: LocationItem[] = [];
    let currentGroupId: string | null = null;

    filteredLocations.forEach(item => {
      list.push(item);
      if (item.groupId) {
        if (item.groupId === currentGroupId) {
          currentGroup.push(item);
        } else {
          if (currentGroup.length > 0) {
            elements.push({ type: 'group', groupId: currentGroupId!, items: currentGroup });
          }
          currentGroupId = item.groupId;
          currentGroup = [item];
        }
      } else {
        if (currentGroup.length > 0) {
          elements.push({ type: 'group', groupId: currentGroupId!, items: currentGroup });
          currentGroup = [];
          currentGroupId = null;
        }
        elements.push({ type: 'item', item });
      }
    });
    if (currentGroup.length > 0) {
      elements.push({ type: 'group', groupId: currentGroupId!, items: currentGroup });
    }

    const blockMeta: { firstItemId: number; lastItemId: number; containsMoving: boolean }[] = [];

    const groupElements = elements.map((block, index) => {
      const nextBlock = index < elements.length - 1 ? elements[index + 1] : null;
      const nextBlockFirstItem = nextBlock
        ? ((nextBlock as any).type === 'group' ? (nextBlock as any).items[0] : (nextBlock as any).item)
        : null;

      if (block.type === 'group') {
        const groupBlock = block;
        const blockFirstItem = groupBlock.items[0];
        const blockLastItem = groupBlock.items[groupBlock.items.length - 1];
        const showTransport = nextBlockFirstItem && blockLastItem.cat !== 'free' && blockLastItem.cat !== 'logistics' && nextBlockFirstItem.cat !== 'free' && nextBlockFirstItem.cat !== 'logistics';

        blockMeta.push({
          firstItemId: blockFirstItem.id,
          lastItemId: blockLastItem.id,
          containsMoving: groupBlock.items.some((i: LocationItem) => i.id === movingItemId),
        });

        return (
          <div key={`group-${groupBlock.groupId}`} className="relative flex flex-col gap-3">
            <GroupContainer
              groupId={groupBlock.groupId}
              items={groupBlock.items}
              handleEdit={handleEdit}
              handleCardClick={handleCardClick}
              onRequestMove={onRequestMove}
              mergeTargetId={mergeTargetId}
            />
            {showTransport && (
              <div className="relative z-10 mx-1 mb-1 w-full">
                <TransportBlock fromLoc={blockLastItem} toLoc={nextBlockFirstItem} />
              </div>
            )}
          </div>
        );
      } else {
        const itemBlock = block;
        const blockLastItem = itemBlock.item;
        const showTransport = nextBlockFirstItem && blockLastItem.cat !== 'free' && blockLastItem.cat !== 'logistics' && nextBlockFirstItem.cat !== 'free' && nextBlockFirstItem.cat !== 'logistics';

        blockMeta.push({
          firstItemId: itemBlock.item.id,
          lastItemId: itemBlock.item.id,
          containsMoving: itemBlock.item.id === movingItemId,
        });

        return (
          <div key={itemBlock.item.id} className="relative flex flex-col gap-3">
            <div className="relative z-10 w-full outline-none">
              <SortableCard
                item={itemBlock.item}
                onClick={() => handleEdit(itemBlock.item.id)}
                onCardClick={() => handleCardClick(itemBlock.item.id)}
                onRequestMove={() => onRequestMove && onRequestMove(itemBlock.item.id)}
                isMergeTarget={itemBlock.item.id === mergeTargetId}
              />
            </div>
            {showTransport && (
              <div className="relative z-10 mx-1 mb-1 w-full">
                <TransportBlock fromLoc={blockLastItem} toLoc={nextBlockFirstItem} />
              </div>
            )}
          </div>
        );
      }
    });

    return { locationList: list, groupElements, blockMeta };
  }, [filteredLocations, handleEdit, handleCardClick, onRequestMove, movingItemId]);

  const sortableItemsIds = useMemo(() => {
    const ids: string[] = [];
    let currentGroup: LocationItem[] = [];
    let currentGroupId: string | null = null;

    filteredLocations.forEach(item => {
      if (item.groupId) {
        if (item.groupId === currentGroupId) {
          currentGroup.push(item);
        } else {
          if (currentGroup.length > 0) ids.push(`group-${currentGroupId}`);
          currentGroupId = item.groupId;
          currentGroup = [item];
        }
      } else {
        if (currentGroup.length > 0) {
          ids.push(`group-${currentGroupId}`);
          currentGroup = [];
          currentGroupId = null;
        }
        ids.push(item.id.toString());
      }
    });
    if (currentGroup.length > 0) ids.push(`group-${currentGroupId}`);
    return ids;
  }, [filteredLocations]);

  return (
    <div className={`flex-none w-[340px] flex flex-col h-full bg-white border border-gray-100 rounded-[32px] overflow-hidden group shadow-sm transition-all hover:shadow-md ${isDimmed ? 'opacity-40' : ''}`}>
      <div className="p-5 pb-3 border-b border-gray-50 flex flex-col">
        <div className="flex justify-between items-end mb-3">
          <button
            onClick={() => toggleFilterDay(dayId)}
            className={`font-serif text-2xl font-medium transition-colors ${filterDays.includes(dayId) ? 'text-nature-primary' : 'text-gray-400 hover:text-nature-primary'}`}
            title="Clic para filtrar por este día"
          >
            {dayLabel}
          </button>
          <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Itinerario</span>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-xl">
          {dayVariants.map(v => (
            <button
              key={v}
              onClick={() => setActiveDayVariant(dayId, v)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeVariant === v ? 'bg-white text-nature-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {v === 'default' ? 'Ruta 1' : v.replace('option-', 'Ruta ')}
            </button>
          ))}
          <button onClick={() => {
            showDialog({
              type: 'prompt',
              title: 'Nueva Variante',
              message: 'Introduce el nombre de la nueva variante temporal de este día.',
              inputPlaceholder: 'Ej. Plan B Lluvia...',
              confirmText: 'Añadir',
              onConfirm: (newVar) => {
                if (newVar && newVar.trim()) {
                  setAdditionalVariants(prev => [...prev, newVar.trim()]);
                  setActiveDayVariant(dayId, newVar.trim());
                  addToast(`Variante de día "${newVar.trim()}" creada`, 'success');
                }
              }
            });
          }} className="px-3 text-gray-400 hover:text-nature-primary transition-colors">+</button>
        </div>

        {handleAddNewToDay && (
          <div className="flex flex-col gap-2 w-full mt-3">
            <div className="flex gap-2">
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
            <LogisticsQuickAdd dayId={dayId} variantId={activeVariant} />
          </div>
        )}
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/30' : 'bg-gray-50/30'} flex flex-col gap-3 transition-colors relative`}>
        {isMovingMode && !movingItemIsHere && locationList.length === 0 && executeMoveHere ? (
          /* Empty day — single large move slot */
          <MoveSlot
            label="Mover a este día"
            onClick={() => executeMoveHere(movingItemId!, dayId, activeVariant, undefined, null)}
          />
        ) : locationList.length === 0 ? (
          <div className="m-auto text-center space-y-3 opacity-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-white flex flex-col items-center justify-center w-full min-h-[160px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Día Libre</p>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-[150px]">Arrastra actividades aquí desde el buzón o crea nuevas</p>
          </div>
        ) : (
          <SortableContext items={sortableItemsIds} strategy={() => null}>
            {isMovingMode && executeMoveHere && (() => {
              const firstBlock = blockMeta[0];
              const showTopSlot = firstBlock && !firstBlock.containsMoving;
              return showTopSlot ? (
                <MoveSlot
                  onClick={() => executeMoveHere(movingItemId!, dayId, activeVariant, undefined, firstBlock.firstItemId)}
                />
              ) : null;
            })()}
            {groupElements.map((el, idx) => {
              const current = blockMeta[idx];
              const next = blockMeta[idx + 1];
              // Show slot after this block if neither this nor the next block contains the moving item
              const showSlot = isMovingMode && executeMoveHere
                && !current?.containsMoving
                && (!next || !next.containsMoving);
              return (
                <div key={el.key}>
                  {el}
                  {showSlot && (
                    <MoveSlot
                      onClick={() => executeMoveHere(movingItemId!, dayId, activeVariant, undefined, next?.firstItemId ?? null)}
                    />
                  )}
                </div>
              );
            })}
          </SortableContext>
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
  onRequestMove?: (id: number) => void;
  mergeTargetId?: number | null;
  movingItemId?: number | null;
  executeMoveHere?: (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => void;
}

export const ScheduleBoard = ({ handleEdit, handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, viewMode, onRequestMove, mergeTargetId, movingItemId, executeMoveHere }: ScheduleBoardProps) => {
  const { locations, filterDays, toggleFilterDay, tripVariants, activeGlobalVariantId } = useAppStore();

  const displayDays = useMemo(() => {
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
      return filterDays.length > 0 ? dynamicDays.filter(d => filterDays.includes(d.id)) : [];
    }
    return dynamicDays;
  }, [viewMode, filterDays, tripVariants, activeGlobalVariantId]);

  return (
    <div className="h-full w-full overflow-x-auto p-6 pb-12 bg-nature-bg custom-scroll transition-colors relative">
      {viewMode === 'split-vertical' && filterDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
          <div className="w-16 h-16 rounded-full bg-nature-primary/10 flex items-center justify-center mb-4 text-nature-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <p className="font-serif text-xl text-nature-primary font-bold mb-2">Selecciona un día</p>
          <p className="text-sm text-gray-500 max-w-xs">Elige un día en el filtro del mapa para ver su itinerario aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Day filter checkbox bar */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm overflow-x-auto custom-scroll shrink-0">
            <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase shrink-0">Días</span>
            {(() => {
              const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
              let dayOptions: { id: string; label: string }[] = [];
              if (activeVar?.startDate && activeVar?.endDate) {
                const start = new Date(activeVar.startDate);
                const end = new Date(activeVar.endDate);
                let i = 1;
                const d = new Date(start);
                while (d <= end) {
                  dayOptions.push({ id: `day-${i}`, label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }) });
                  d.setDate(d.getDate() + 1);
                  i++;
                }
              } else {
                dayOptions = DAYS.map(d => ({ id: d, label: d }));
              }
              return dayOptions.map(opt => {
                const isActive = filterDays.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleFilterDay(opt.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${isActive ? 'bg-nature-primary text-white border-nature-primary shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-nature-primary/30 hover:text-nature-primary'}`}
                  >
                    {opt.label}
                  </button>
                );
              });
            })()}
          </div>
          <div className="flex gap-6 h-full min-w-max pb-4 overflow-x-auto p-6 pb-12 bg-nature-bg custom-scroll">
            {displayDays.map(dayObj => (
              <BoardColumn
                key={dayObj.id}
                dayId={dayObj.id}
                dayLabel={dayObj.label}
                isDimmed={filterDays.length > 0 && !filterDays.includes(dayObj.id)}
                locations={locations.filter(l => l.day === dayObj.id)}
                handleEdit={handleEdit}
                handleCardClick={handleCardClick}
                handleAddNewToDay={handleAddNewToDay}
                handleAddFreeTimeToDay={handleAddFreeTimeToDay}
                onRequestMove={onRequestMove}
                mergeTargetId={mergeTargetId}
                movingItemId={movingItemId}
                executeMoveHere={executeMoveHere}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};