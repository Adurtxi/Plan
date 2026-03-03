import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown } from 'lucide-react';
import { SortableCard } from '../ui/SortableCard';
import { TransportBlock } from './TransportBlock';
import { useAppStore } from '../../store';
import { useUngroupLocationGroup } from '../../hooks/useTripMutations';
import { DAYS, isTransportCat } from '../../constants';
import type { LocationItem } from '../../types';
import { useLocations, useTransports, useTripVariants } from '../../hooks/useTripData';
import { RAButton } from '../ui/RAButton';

/* ── MoveSlot: clickable drop-zone shown between cards when moving ── */
const MoveSlot = ({ onClick, label }: { onClick: () => void; label?: string }) => (
  <RAButton
    variant="ghost"
    onPress={onClick}
    className="w-full my-1 py-3 border-2 border-dashed border-nature-primary/40 rounded-2xl bg-nature-mint/20 hover:bg-nature-mint/50 hover:border-nature-primary hover:scale-[1.02] flex items-center justify-center gap-2 text-nature-primary text-xs font-bold uppercase tracking-widest cursor-pointer animate-pulse hover:animate-none"
  >
    <ArrowDown size={14} className="opacity-60" />
    {label || 'Colocar aquí'}
  </RAButton>
);

interface BoardColumnProps {
  dayId: string;
  dayLabel: string;
  isDimmed: boolean;
  locations: LocationItem[];
  handleCardClick: (id: number) => void;
  handleAddNewToDay?: (day: string, variantId: string) => void;
  handleAddFreeTimeToDay?: (day: string, variantId: string) => void;
  onRequestMove?: (id: number) => void;
  mergeTargetId?: number | null;
  movingItemId?: number | null;
  executeMoveHere?: (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => void;
  viewMode?: 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
  onTimeConflict?: (item: LocationItem, suggestedDatetime: string, baseDate: Date) => void;
}

const GroupContainer = ({ groupId, items, handleCardClick, onRequestMove, mergeTargetId, isMovingMode, onTimeConflict }: { groupId: string, items: LocationItem[], handleCardClick: any, onRequestMove: any, mergeTargetId?: number | null, isMovingMode?: boolean, onTimeConflict?: (item: LocationItem, suggestedDatetime: string, baseDate: Date) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${groupId}`,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const { mutate: ungroupLocationGroup } = useUngroupLocationGroup();

  return (
    <div ref={setNodeRef} style={style} className="relative group/container mt-2 mb-3">
      <div
        {...attributes}
        {...listeners}
        className="bg-bg-surface-elevated text-text-primary rounded-t-xl px-4 py-2 w-max cursor-grab active:cursor-grabbing flex items-center gap-2 relative z-10 font-bold uppercase tracking-wider text-[10px] shadow-sm ml-4 border border-border-subtle border-b-0"
      >
        <span className="opacity-50">⣿</span> Grupo de Actividades
        <RAButton variant="ghost" onPress={() => { ungroupLocationGroup(groupId); }} size="sm" className="ml-2 bg-white/10 hover:bg-red-500 hover:text-white rounded px-1.5 py-0.5 text-[9px] border border-white/10 opacity-0 group-hover/container:opacity-100">
          DESAGRUPAR
        </RAButton>
      </div>

      <div className="bg-bg-surface-elevated/80 border border-border-subtle rounded-[28px] rounded-tl-sm p-3 relative z-0 shadow-inner flex flex-col gap-2 ring-1 ring-border-subtle inset-0">
        <SortableContext items={items.map((i) => i.id.toString())} strategy={() => null}>
          {items.map((item, index) => {
            const nextItem = index < items.length - 1 ? items[index + 1] : null;
            return (
              <div key={item.id} className="relative">
                <SortableCard
                  item={item}
                  onCardClick={() => handleCardClick(item.id)}
                  onRequestMove={() => onRequestMove?.(item.id)}
                  isMovingMode={isMovingMode}
                  isMergeTarget={mergeTargetId === item.id}
                  onTimeConflict={onTimeConflict && (item as any).suggestedDatetime && (item as any).baseDate ? () => onTimeConflict(item, (item as any).suggestedDatetime, (item as any).baseDate) : undefined}
                />
                {nextItem && item.cat !== 'free' && !isTransportCat(item.cat) && nextItem.cat !== 'free' && !isTransportCat(nextItem.cat) && (
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

const BoardColumn = ({ dayId, dayLabel, isDimmed, locations: propLocations, handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, onRequestMove, mergeTargetId, movingItemId, executeMoveHere, viewMode, onTimeConflict }: BoardColumnProps) => {
  const [additionalVariants, setAdditionalVariants] = useState<string[]>([]);
  const optimisticLocations = useAppStore(s => s.optimisticLocations);
  const showDialog = useAppStore(s => s.showDialog);
  const addToast = useAppStore(s => s.addToast);
  const toggleFilterDay = useAppStore(s => s.toggleFilterDay);
  const filterDays = useAppStore(s => s.filterDays);
  const activeDayVariants = useAppStore(s => s.activeDayVariants);
  const setActiveDayVariant = useAppStore(s => s.setActiveDayVariant);
  const activeGlobalVariantId = useAppStore(s => s.activeGlobalVariantId);
  const { data: transports = [] } = useTransports();
  const { data: tripVariants = [] } = useTripVariants();
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
      let suggestedDatetime: string | undefined = undefined;

      // Honor explicitly set datetimes on tickets (flights/hotels) even if not "pinned" manually by user,
      // or if they are explicitly pinned. 
      if (loc.datetime) {
        const explicitlySetTime = new Date(loc.datetime);
        finalTime.setHours(explicitlySetTime.getHours(), explicitlySetTime.getMinutes(), 0, 0);

        if (loc.isPinnedTime) {
          // Check if the pinned time is different from the current naturally flowing calculated time
          const flowingTime = new Date(currentTime);
          if (explicitlySetTime.getHours() !== flowingTime.getHours() || explicitlySetTime.getMinutes() !== flowingTime.getMinutes()) {
            suggestedDatetime = flowingTime.toISOString(); // Suggest the calculated time
          }
        }
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
      return {
        ...loc,
        derivedDatetime: loc.datetime || finalTime.toISOString(),
        suggestedDatetime
      } as LocationItem & { suggestedDatetime?: string; baseDate?: Date };
    }).map(loc => ({ ...loc, baseDate }));
  }, [dayId, activeVariant, transports, tripVariants, activeGlobalVariantId, propLocations, optimisticLocations]);

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
        const showTransport = nextBlockFirstItem && blockLastItem.cat !== 'free' && !isTransportCat(blockLastItem.cat) && nextBlockFirstItem.cat !== 'free' && !isTransportCat(nextBlockFirstItem.cat);

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
              handleCardClick={handleCardClick}
              onRequestMove={onRequestMove}
              mergeTargetId={mergeTargetId}
              isMovingMode={isMovingMode}
              onTimeConflict={onTimeConflict}
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
        const showTransport = nextBlockFirstItem && blockLastItem.cat !== 'free' && !isTransportCat(blockLastItem.cat) && nextBlockFirstItem.cat !== 'free' && !isTransportCat(nextBlockFirstItem.cat);

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
                onCardClick={() => handleCardClick(itemBlock.item.id)}
                onRequestMove={() => onRequestMove && onRequestMove(itemBlock.item.id)}
                isMergeTarget={itemBlock.item.id === mergeTargetId}
                isMovingMode={isMovingMode}
                onTimeConflict={onTimeConflict && (itemBlock.item as any).suggestedDatetime && (itemBlock.item as any).baseDate ? () => onTimeConflict(itemBlock.item, (itemBlock.item as any).suggestedDatetime, (itemBlock.item as any).baseDate) : undefined}
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
  }, [filteredLocations, handleCardClick, onRequestMove, movingItemId, mergeTargetId, isMovingMode, onTimeConflict]);

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
    <div className={`flex-none ${viewMode === 'split-vertical' ? 'w-full max-w-[360px] mx-auto' : 'w-[340px]'} flex flex-col min-h-full h-auto bg-bg-surface border border-border-strong rounded-[32px] overflow-hidden group shadow-sm transition-all hover:shadow-md ${isDimmed ? 'opacity-40' : ''}`}>
      <div className="p-5 pb-3 border-b border-border-strong flex flex-col shrink-0">
        <div className="flex justify-between items-end mb-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filterDays.includes(dayId)}
              onChange={() => toggleFilterDay(dayId)}
              className="w-4 h-4 rounded text-nature-primary focus:ring-nature-primary border-gray-300 cursor-pointer"
              title="Mostrar/ocultar ruta en el mapa"
            />
            <span
              className={`font-sans text-2xl font-medium transition-colors ${filterDays.includes(dayId) ? 'text-nature-primary' : 'text-text-muted group-hover:text-nature-primary'}`}
            >
              {dayLabel}
            </span>
          </label>
          <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">Itinerario</span>
        </div>

        <div className="flex bg-bg-surface-elevated p-1 rounded-xl">
          {dayVariants.map(v => (
            <RAButton
              key={v}
              variant="ghost"
              onPress={() => setActiveDayVariant(dayId, v)}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg ${activeVariant === v ? 'bg-bg-surface-elevated text-nature-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              size="sm"
            >
              {v === 'default' ? 'Ruta 1' : v.replace('option-', 'Ruta ')}
            </RAButton>
          ))}
          <RAButton variant="ghost" onPress={() => {
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
          }} className="px-3 text-text-muted hover:text-nature-primary" size="sm">+</RAButton>
        </div>

        {handleAddNewToDay && (
          <div className="flex flex-col gap-2 w-full mt-3">
            <div className="flex gap-2">
              <RAButton variant="ghost" onPress={() => handleAddNewToDay(dayId, activeVariant)} className="flex-1 bg-nature-mint/30 hover:bg-nature-mint/50 border border-nature-primary/20 border-dashed text-nature-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shrink-0" size="sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Añadir
              </RAButton>
              <RAButton variant="ghost" onPress={() => {
                if (handleAddFreeTimeToDay) {
                  handleAddFreeTimeToDay(dayId, activeVariant);
                }
              }} className="flex-1 bg-bg-surface-elevated hover:bg-border-subtle/30 border border-border-subtle border-dashed text-text-secondary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shrink-0" size="sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Libre
              </RAButton>
            </div>
          </div>
        )}
      </div>

      <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/30' : 'bg-bg-surface-elevated/30'} flex flex-col gap-3 transition-colors relative`}>
        {isMovingMode && !movingItemIsHere && locationList.length === 0 && executeMoveHere ? (
          /* Empty day — single large move slot */
          <MoveSlot
            label="Mover a este día"
            onClick={() => executeMoveHere(movingItemId!, dayId, activeVariant, undefined, null)}
          />
        ) : locationList.length === 0 ? (
          <div className="m-auto text-center space-y-3 opacity-50 border-2 border-dashed border-border-strong rounded-3xl p-8 bg-bg-surface flex flex-col items-center justify-center w-full min-h-[160px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Día Libre</p>
            <p className="text-[10px] text-text-muted leading-relaxed max-w-[150px]">Arrastra actividades aquí desde el buzón o crea nuevas</p>
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
  handleCardClick: (id: number) => void;
  handleAddNewToDay?: (day: string, variantId: string) => void;
  handleAddFreeTimeToDay?: (day: string, variantId: string) => void;
  viewMode?: 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
  onRequestMove?: (id: number) => void;
  mergeTargetId?: number | null;
  movingItemId?: number | null;
  executeMoveHere?: (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => void;
  onTimeConflict?: (item: LocationItem, suggestedDatetime: string, baseDate: Date) => void;
}

export const ScheduleBoard = ({ handleCardClick, handleAddNewToDay, handleAddFreeTimeToDay, viewMode, onRequestMove, mergeTargetId, movingItemId, executeMoveHere, onTimeConflict }: ScheduleBoardProps) => {
  const filterDays = useAppStore(s => s.filterDays);
  const activeGlobalVariantId = useAppStore(s => s.activeGlobalVariantId);
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();

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
      // Strictly show only one day. If no filter, default to day-1
      const activeDay = (filterDays && filterDays.length === 1) ? filterDays[0] : 'day-1';
      return dynamicDays.filter(d => d.id === activeDay);
    }
    return dynamicDays;
  }, [viewMode, filterDays, tripVariants, activeGlobalVariantId]);

  return (
    <div className={`h-full w-full ${viewMode === 'split-vertical' ? 'overflow-hidden' : 'overflow-x-auto'} pb-12 bg-bg-body custom-scroll transition-colors relative`}>
      {false ? (
        <div />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className={`${viewMode === 'split-vertical' ? 'flex justify-center p-4' : 'flex gap-6 min-w-max p-6 pb-20'} flex-1 min-h-0 bg-bg-body custom-scroll`}>
            {displayDays.map(dayObj => (
              <BoardColumn
                key={dayObj.id}
                dayId={dayObj.id}
                dayLabel={dayObj.label}
                isDimmed={filterDays.length > 0 && !filterDays.includes(dayObj.id)}
                locations={locations.filter(l => l.day === dayObj.id && (l.globalVariantId || 'default') === (activeGlobalVariantId || 'default'))}
                handleCardClick={handleCardClick}
                handleAddNewToDay={handleAddNewToDay}
                handleAddFreeTimeToDay={handleAddFreeTimeToDay}
                onRequestMove={onRequestMove}
                mergeTargetId={mergeTargetId}
                movingItemId={movingItemId}
                executeMoveHere={executeMoveHere}
                viewMode={viewMode}
                onTimeConflict={onTimeConflict}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
