import { useMemo, useState, useRef } from 'react';
import { useAppStore } from '../../store';
import { Clock, CheckCircle2, Plus, FolderInput, X, RefreshCw, GripVertical, SkipForward, Inbox, Navigation, Car, Map } from 'lucide-react';
import { CAT_ICONS, DAYS, isTransportCat } from '../../constants';
import { MobileIdeaInbox } from './MobileIdeaInbox';
import { TransportBlock } from './TransportBlock';
import { MobileDaySelector } from './MobileDaySelector';
import { useFilteredLocations } from '../../hooks/useFilteredLocations';
import { hapticFeedback } from '../../utils/haptics';
import { DndContext, closestCenter, type DragEndEvent, TouchSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { LocationItem } from '../../types';
import { useLocations, useTripVariants, useAddLocation } from '../../hooks/useTripData';
import { useReorderLocation, useMoveToDay } from '../../hooks/useTripMutations';

const MoveToDaySheet = ({ onClose, onMove }: { onClose: () => void, onMove: (day: string) => void }) => {
  const { activeGlobalVariantId } = useAppStore();
  const { data: tripVariants = [] } = useTripVariants();
  let dayOptions: { value: string; label: string }[] = [];
  const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);

  if (activeVar?.startDate && activeVar?.endDate) {
    const start = new Date(activeVar.startDate);
    const end = new Date(activeVar.endDate);
    let i = 1;
    const d = new Date(start);
    while (d <= end) {
      dayOptions.push({ value: `day - ${i} `, label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) });
      d.setDate(d.getDate() + 1);
      i++;
    }
  } else {
    dayOptions = DAYS.map((d, i) => ({ value: `day - ${i + 1} `, label: d }));
  }
  dayOptions.push({ value: 'unassigned', label: '💡 Bandeja de Ideas' });

  return (
    <div className="fixed inset-0 z-[600] flex flex-col justify-end">
      <div className="absolute inset-0 bg-nature-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-6 relative z-10 animate-[slideUp_0.3s_ease-out] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-sans text-xl text-nature-primary">Mover actividad a...</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scroll pb-8">
          {dayOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onMove(opt.value)}
              className={`p - 4 rounded - 2xl font - bold text - sm flex items - center justify - center transition - colors shadow - sm ${opt.value === 'unassigned' ? 'col-span-2 bg-yellow-50 border border-yellow-200 text-yellow-700' : 'bg-gray-50 border border-gray-100 text-gray-600 active:bg-nature-mint/30 active:text-nature-primary active:border-nature-primary/30'} `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SortableMobileCardProps {
  id: string;
  loc: LocationItem;
  isSkipped: boolean;
  setSkippedTasks: React.Dispatch<React.SetStateAction<Set<number>>>;
  reorderLocation: (activeId: string | number, overId: string | number | null, targetDay: string, targetVariant: string) => void;
  setMobileView?: (v: 'plan' | 'map') => void;
  formattedTime: string | null;
  onClick: () => void;
  setSelectedLocationId: (id: number | null) => void;
}

const SortableMobileCard = ({ id, loc, isSkipped, setSkippedTasks, reorderLocation, setMobileView, formattedTime, onClick, setSelectedLocationId }: SortableMobileCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const isLogistics = isTransportCat(loc.cat);
  const isFree = loc.cat === 'free';

  // The simplified drag handle
  const DragHandle = () => (
    <div className="flex flex-col items-center justify-center border-l border-nature-border pl-2 py-1 ml-2 shrink-0 h-full">
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-gray-300 hover:text-nature-primary touch-none"
      >
        <GripVertical size={20} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          reorderLocation(loc.id, null, 'unassigned', useAppStore.getState().activeGlobalVariantId);
        }}
        className="p-1.5 mt-2 rounded-lg text-gray-400 active:bg-nature-surface active:text-nature-primary transition-colors"
      >
        <FolderInput size={18} />
      </button>
    </div>
  );

  return (
    <div ref={setNodeRef} style={style} className={`relative pl-6 ${isDragging ? 'scale-[1.02] shadow-xl' : ''}`}>
      <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-nature-bg ${isLogistics ? 'bg-blue-400 border-blue-100' :
        isFree ? 'bg-gray-300 border-gray-100' :
          'bg-white border-gray-200'
        }`} />

      {isLogistics ? (
        <div onClick={onClick} className={`bg-blue-50/50 border border-dashed border-blue-200 rounded-2xl py-3 pl-4 pr-2 flex items-stretch gap-3 cursor-pointer active:scale-[0.98] transition-all ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex items-center gap-3 flex-1 py-1">
            <span className="text-2xl">{CAT_ICONS[loc.cat] || '📋'}</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-700">{loc.title || 'Transporte'}</h3>
              {formattedTime && (
                <span className="text-xs text-blue-500 font-bold flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} /> {formattedTime}
                </span>
              )}
            </div>
          </div>
          <DragHandle />
        </div>
      ) : isFree ? (
        <div onClick={onClick} className={`bg-nature-surface border-y border-dashed border-nature-border py-3 pl-4 pr-2 flex items-stretch gap-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex items-center gap-3 flex-1 py-1">
            <span className="text-2xl opacity-80">☕</span>
            <div className="flex-1">
              <span className="text-sm font-bold uppercase tracking-widest text-gray-500">{loc.title || 'Tiempo Libre'}</span>
              {loc.durationMinutes && (
                <span className="ml-2 text-xs font-bold text-gray-400">
                  {loc.durationMinutes >= 60 ? `${Math.floor(loc.durationMinutes / 60)}h ${loc.durationMinutes % 60 ? (loc.durationMinutes % 60) + 'm' : ''}` : `${loc.durationMinutes}m`}
                </span>
              )}
            </div>
          </div>
          <DragHandle />
        </div>
      ) : (
        <div onClick={onClick} className={`bento-card p-4 pr-2 flex flex-col gap-4 cursor-pointer active:scale-[0.98] transition-all duration-300 ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex justify-between items-stretch">
            <div className="flex items-start gap-4 flex-1">
              <span className="text-3xl bg-gray-50 p-2.5 rounded-xl shrink-0">{CAT_ICONS[loc.cat]}</span>
              <div className="flex-1 pt-1">
                <h3 className={`font-black text-xl leading-tight pr-2 ${isSkipped ? 'text-gray-400 line-through' : 'text-nature-text'}`}>
                  {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                </h3>
                <div className="flex items-center gap-1.5 mt-2 text-sm uppercase tracking-widest font-black text-gray-400">
                  <Clock size={14} />
                  {formattedTime || loc.slot || 'S/H'}
                  {loc.reservationStatus === 'booked' && <CheckCircle2 size={14} className="text-nature-primary ml-1" />}
                </div>
              </div>
            </div>
            {loc.images?.length > 0 && (
              <div className="ml-2 shrink-0 self-center">
                <img src={loc.images[0].data} className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-sm" alt="thumb" />
              </div>
            )}
            <DragHandle />
          </div>

          <div className="flex gap-2 mt-1 pr-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (setMobileView) {
                  hapticFeedback.light();
                  setSelectedLocationId(loc.id);
                  setMobileView('map');
                }
              }}
              className="px-4 bg-nature-mint/30 active:bg-nature-mint/50 text-nature-primary rounded-xl flex items-center justify-center transition-colors"
            >
              <Map size={18} />
            </button>
            <button
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.coords?.lat},${loc.coords?.lng}`, '_blank')}
              className="flex-1 bg-blue-50 active:bg-blue-100 text-blue-700 text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Navigation size={16} /> Ruta GPS
            </button>
            <button
              onClick={() => window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${loc.coords?.lat}&dropoff[longitude]=${loc.coords?.lng}`, '_blank')}
              className="flex-1 bg-gray-900 active:bg-gray-800 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Car size={16} /> Uber
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hapticFeedback.light();
                setSkippedTasks(prev => {
                  const n = new Set(prev);
                  if (n.has(loc.id)) n.delete(loc.id); else n.add(loc.id);
                  return n;
                });
              }}
              className="px-4 bg-red-50 text-red-600 active:bg-red-100 rounded-xl flex items-center justify-center"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MobileTimelineView = ({ setMobileView, handleEdit }: { setMobileView?: (v: 'plan' | 'map') => void, handleEdit: (id: number) => void }) => {
  const { activeDayVariants, addToast, setSelectedLocationId } = useAppStore();
  const { data: locations = [], refetch: refetchLocations } = useLocations();
  const { mutateAsync: addLocation } = useAddLocation();
  const { mutate: reorderLocation } = useReorderLocation();
  const { mutate: moveToDay } = useMoveToDay();
  const [skippedTasks, setSkippedTasks] = useState<Set<number>>(new Set());
  const [movingItemId, setMovingItemId] = useState<number | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current + 15) {
      window.dispatchEvent(new CustomEvent('scrollDirection', { detail: 'down' }));
      lastScrollY.current = currentScrollY;
    } else if (currentScrollY < lastScrollY.current - 15) {
      window.dispatchEvent(new CustomEvent('scrollDirection', { detail: 'up' }));
      lastScrollY.current = currentScrollY;
    }
  };

  const unassignedCount = locations.filter(l => l.day === 'unassigned' && l.cat !== 'free' && !isTransportCat(l.cat)).length;

  // Pull to refresh state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const firstDay = useMemo(() => {
    const assigned = locations.find(l => l.day !== 'unassigned');
    return assigned?.day || 'day-1';
  }, [locations]);

  // Sync mobile day selector with global filterDays
  const { filterDays, setFilterDays } = useAppStore();
  const selectedDay = filterDays.length > 0 ? filterDays[0] : firstDay;

  const handleSelectDay = (day: string) => {
    hapticFeedback.selection();
    setFilterDays([day]);
  };

  const activeVariant = activeDayVariants[selectedDay] || 'default';

  const filteredLocations = useFilteredLocations();

  const dayLocations = useMemo(() => {
    return filteredLocations
      .filter(l => l.day === selectedDay)
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  }, [filteredLocations, selectedDay]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && !isRefreshing) {
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0) {
        setPullY(Math.min(dy * 0.4, 80)); // Dampened pull, max 80px
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 60 && !isRefreshing) {
      hapticFeedback.medium();
      setIsRefreshing(true);
      await refetchLocations();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 500); // minimum visual delay
    } else {
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = () => {
    hapticFeedback.selection();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    hapticFeedback.light();
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      reorderLocation({ activeId: Number(active.id), overId: Number(over.id), day: selectedDay, variantId: activeVariant });
    }
  };

  const handleAddFreeTime = async () => {
    hapticFeedback.light();
    await addLocation({
      id: Date.now(), title: 'Tiempo Libre', link: '', coords: null,
      priority: 'optional' as const, cat: 'free' as const, cost: '0',
      slot: 'Mañana', notes: '', images: [], attachments: [], day: selectedDay,
      variantId: activeVariant, reservationStatus: 'idea' as const, order: Date.now(),
    });
    addToast('☕ Tiempo libre añadido', 'success');
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-50 flex flex-col custom-scroll relative"
      ref={scrollContainerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10 overflow-hidden"
        style={{ height: pullY, opacity: pullY / 60 }}
      >
        <div className={`bg - white rounded - full p - 2 shadow - md text - nature - primary ${isRefreshing ? 'animate-spin' : ''} `}>
          <RefreshCw size={20} />
        </div>
      </div>

      <header className="bg-white px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 border-b border-nature-border z-20 shadow-sm shrink-0">
        <h1 className="text-2xl font-sans text-nature-primary mb-3">Itinerario</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <MobileDaySelector selectedDay={selectedDay} onSelectDay={handleSelectDay} />
          </div>
          <button
            onClick={() => {
              hapticFeedback.selection();
              setIsInboxOpen(true);
            }}
            className="p-3 bg-nature-surface text-nature-primary rounded-xl relative shrink-0 border border-nature-border"
          >
            <Inbox size={22} />
            {unassignedCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {unassignedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto bg-gray-50 flex flex-col custom-scroll relative pb-[80px]"
        onScroll={handleScroll}
      >
        <div className="space-y-5 relative border-l-2 border-nature-border/50 ml-4 pb-8 mt-4 pr-4">
          {dayLocations.length === 0 && (
            <div className="pl-6 py-8 flex flex-col items-center text-gray-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm font-medium">No hay actividades para este día</p>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={dayLocations.map(l => l.id.toString())} strategy={verticalListSortingStrategy}>
              {dayLocations.map((loc, i) => {
                const nextLoc = dayLocations[i + 1];
                const displayTime = loc.derivedDatetime || loc.datetime;
                const formattedTime = displayTime
                  ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : null;
                return (
                  <div key={loc.id}>
                    <SortableMobileCard
                      id={loc.id.toString()}
                      loc={loc}
                      isSkipped={skippedTasks.has(loc.id)}
                      setSkippedTasks={setSkippedTasks}
                      reorderLocation={(activeId, overId, day, targetVariant) => {
                        reorderLocation({ activeId: Number(activeId), overId: overId ? Number(overId) : null, day, variantId: targetVariant });
                      }}
                      setMobileView={setMobileView}
                      formattedTime={formattedTime}
                      onClick={() => {
                        hapticFeedback.selection();
                        setSelectedLocationId(loc.id);
                      }}
                      setSelectedLocationId={setSelectedLocationId}
                    />
                    {nextLoc && loc.cat !== 'free' && !isTransportCat(loc.cat) && nextLoc.cat !== 'free' && !isTransportCat(nextLoc.cat) && (
                      <div className="py-2 ml-2">
                        <TransportBlock fromLoc={loc} toLoc={nextLoc} />
                      </div>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>

          <div className="pl-6 pt-4 space-y-2">
            <div className="absolute -left-[9px] w-4 h-4 rounded-full border-4 border-gray-50 bg-nature-primary/30" />
            <button
              onClick={handleAddFreeTime}
              className="w-full bg-gray-100 active:bg-gray-200 text-gray-500 py-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              ☕ Libre
            </button>
            <div className="relative">
              <button
                onClick={async () => {
                  await addLocation({
                    id: Date.now(),
                    title: 'Nueva Actividad',
                    link: '',
                    coords: null,
                    priority: 'necessary',
                    cat: 'sight',
                    cost: '0',
                    slot: 'Mañana',
                    notes: '',
                    images: [],
                    attachments: [],
                    day: selectedDay,
                    variantId: activeVariant,
                    reservationStatus: 'idea',
                    order: Date.now()
                  });
                }}
                className="w-full bg-nature-mint/30 active:bg-nature-mint/50 text-nature-primary py-2.5 rounded-xl border border-dashed border-nature-primary/20 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={12} /> Añadir
              </button>
            </div>
          </div>
        </div >
      </div >
      {movingItemId && (
        <MoveToDaySheet
          onClose={() => setMovingItemId(null)}
          onMove={(day) => {
            moveToDay({ id: movingItemId, targetDay: day, targetVariant: activeDayVariants[day] || 'default' });
            setMovingItemId(null);
            addToast('Actividad movida con éxito', 'success');
          }}
        />
      )}

      <MobileIdeaInbox
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        handleEdit={handleEdit}
        handleAddNew={() => {
          addLocation({
            id: Date.now(), title: 'Nueva Idea', link: '', coords: null,
            priority: 'optional', cat: 'sight', cost: '0', slot: 'S/H',
            notes: '', images: [], attachments: [], day: 'unassigned',
            variantId: 'default', reservationStatus: 'idea', order: Date.now()
          });
        }}
      />


    </div >
  );
};
