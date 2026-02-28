import { useMemo, useState, useRef } from 'react';
import { useAppStore } from '../../store';
import { MapPin, Clock, CheckCircle2, SkipForward, Ticket, Bed, Navigation, Plus, ArrowUp, ArrowDown, FolderInput, X, RefreshCw } from 'lucide-react';
import { CAT_ICONS, LOGISTICS_ICONS, LOGISTICS_TYPES, DAYS } from '../../constants';
import { TransportBlock } from './TransportBlock';
import { MobileDaySelector } from './MobileDaySelector';
import { useFilteredLocations } from '../../hooks/useFilteredLocations';
import type { LogisticsType } from '../../types';

const MoveToDaySheet = ({ onClose, onMove }: { onClose: () => void, onMove: (day: string) => void }) => {
  const { tripVariants, activeGlobalVariantId } = useAppStore();
  let dayOptions: { value: string; label: string }[] = [];
  const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);

  if (activeVar?.startDate && activeVar?.endDate) {
    const start = new Date(activeVar.startDate);
    const end = new Date(activeVar.endDate);
    let i = 1;
    const d = new Date(start);
    while (d <= end) {
      dayOptions.push({ value: `day-${i}`, label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) });
      d.setDate(d.getDate() + 1);
      i++;
    }
  } else {
    dayOptions = DAYS.map((d, i) => ({ value: `day-${i + 1}`, label: d }));
  }
  dayOptions.push({ value: 'unassigned', label: '💡 Bandeja de Ideas' });

  return (
    <div className="fixed inset-0 z-[600] flex flex-col justify-end">
      <div className="absolute inset-0 bg-nature-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-t-3xl p-6 relative z-10 animate-[slideUp_0.3s_ease-out] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl text-nature-primary">Mover actividad a...</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scroll pb-8">
          {dayOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onMove(opt.value)}
              className={`p-4 rounded-2xl font-bold text-sm flex items-center justify-center transition-colors shadow-sm ${opt.value === 'unassigned' ? 'col-span-2 bg-yellow-50 border border-yellow-200 text-yellow-700' : 'bg-gray-50 border border-gray-100 text-gray-600 active:bg-nature-mint/30 active:text-nature-primary active:border-nature-primary/30'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MobileTimelineView = () => {
  const { locations, activeDayVariants, addLocation, addToast, reorderLocation, moveToDay, loadData } = useAppStore();
  const [skippedTasks, setSkippedTasks] = useState<Set<number>>(new Set());
  const [showLogistics, setShowLogistics] = useState(false);
  const [movingItemId, setMovingItemId] = useState<number | null>(null);

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
      setIsRefreshing(true);
      await loadData();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 500); // minimum visual delay
    } else {
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const activeId = dayLocations[index].id;
      const overId = dayLocations[index - 1].id;
      reorderLocation(activeId, overId, selectedDay, activeVariant);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < dayLocations.length - 1) {
      const activeId = dayLocations[index].id;
      const overId = index + 2 < dayLocations.length ? dayLocations[index + 2].id : null;
      reorderLocation(activeId, overId, selectedDay, activeVariant);
    }
  };

  const handleAddLogistics = async (type: typeof LOGISTICS_TYPES[number]) => {
    await addLocation({
      id: Date.now(), title: type.label, link: '', coords: null,
      priority: 'necessary' as const, cat: 'logistics' as const,
      logisticsType: type.value as LogisticsType, cost: '0', slot: 'Mañana',
      notes: '', images: [], day: selectedDay, variantId: activeVariant,
      reservationStatus: 'idea' as const, order: Date.now(),
    });
    addToast(`${type.icon} ${type.label} añadido`, 'success');
    setShowLogistics(false);
  };

  const handleAddFreeTime = async () => {
    await addLocation({
      id: Date.now(), title: 'Tiempo Libre', link: '', coords: null,
      priority: 'optional' as const, cat: 'free' as const, cost: '0',
      slot: 'Mañana', notes: '', images: [], day: selectedDay,
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
        <div className={`bg-white rounded-full p-2 shadow-md text-nature-primary ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} />
        </div>
      </div>

      <header className="bg-white px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 border-b border-gray-100 z-20 shadow-sm shrink-0">
        <h1 className="text-2xl font-serif text-nature-primary mb-3">Itinerario</h1>
        <MobileDaySelector selectedDay={selectedDay} onSelectDay={handleSelectDay} />
      </header>

      <div className="flex-1 p-4 relative">
        <div className="space-y-3 relative border-l-2 border-gray-200 ml-4 pb-8">
          {dayLocations.length === 0 && (
            <div className="pl-6 py-8 flex flex-col items-center text-gray-400">
              <span className="text-3xl mb-2">📭</span>
              <p className="text-sm font-medium">No hay actividades para este día</p>
            </div>
          )}

          {dayLocations.map((loc, i) => {
            const nextLoc = dayLocations[i + 1];
            const isLogistics = loc.cat === 'logistics';
            const isFree = loc.cat === 'free';
            const isSkipped = skippedTasks.has(loc.id);
            const displayTime = loc.derivedDatetime || loc.datetime;
            const formattedTime = displayTime
              ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            // Common right-sided reorder controls
            const ReorderControls = () => (
              <div className="flex flex-col items-center justify-between border-l border-gray-100 pl-2 py-1 ml-2 shrink-0">
                <button
                  onClick={() => handleMoveUp(i)}
                  disabled={i === 0}
                  className={`p-1.5 rounded-lg transition-colors ${i === 0 ? 'text-gray-200' : 'text-gray-400 active:bg-gray-100 active:text-nature-primary'}`}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  onClick={() => setMovingItemId(loc.id)}
                  className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100 active:text-blue-500 transition-colors"
                >
                  <FolderInput size={16} />
                </button>
                <button
                  onClick={() => handleMoveDown(i)}
                  disabled={i === dayLocations.length - 1}
                  className={`p-1.5 rounded-lg transition-colors ${i === dayLocations.length - 1 ? 'text-gray-200' : 'text-gray-400 active:bg-gray-100 active:text-nature-primary'}`}
                >
                  <ArrowDown size={16} />
                </button>
              </div>
            );

            return (
              <div key={loc.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-gray-50 ${isLogistics ? 'bg-blue-400 border-blue-100' :
                  isFree ? 'bg-gray-300 border-gray-100' :
                    'bg-white border-gray-200'
                  }`} />

                {isLogistics ? (
                  <div className={`bg-blue-50/50 border border-dashed border-blue-200 rounded-2xl py-2 pl-4 pr-2 flex items-stretch gap-3 ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-3 flex-1 py-1">
                      <span className="text-xl">{loc.logisticsType ? (LOGISTICS_ICONS[loc.logisticsType] || '📋') : '📋'}</span>
                      <div className="flex-1">
                        <h3 className="text-xs font-bold text-blue-700">{loc.title || 'Logística'}</h3>
                        {formattedTime && (
                          <span className="text-[10px] text-blue-500 font-bold flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {formattedTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <ReorderControls />
                  </div>
                ) : isFree ? (
                  <div className={`bg-gray-50 border-y border-dashed border-gray-300 py-2 pl-4 pr-2 flex items-stretch gap-3 rounded-xl ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-3 flex-1 py-1">
                      <span className="text-xl opacity-80">☕</span>
                      <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{loc.title || 'Tiempo Libre'}</span>
                        {loc.durationMinutes && (
                          <span className="ml-2 text-[10px] font-bold text-gray-400">
                            {loc.durationMinutes >= 60 ? `${Math.floor(loc.durationMinutes / 60)}h ${loc.durationMinutes % 60 ? (loc.durationMinutes % 60) + 'm' : ''}` : `${loc.durationMinutes}m`}
                          </span>
                        )}
                      </div>
                    </div>
                    <ReorderControls />
                  </div>
                ) : (
                  <div className={`bg-white p-4 pr-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-opacity duration-500 ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex justify-between items-stretch">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl bg-gray-50 p-2 rounded-xl mt-1 shrink-0">{CAT_ICONS[loc.cat]}</span>
                        <div className="flex-1 pt-1">
                          <h3 className={`font-bold text-base leading-tight pr-2 ${isSkipped ? 'text-gray-400 line-through' : 'text-nature-text'}`}>
                            {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                            <Clock size={10} />
                            {formattedTime || loc.slot || 'S/H'}
                            {loc.reservationStatus === 'booked' && <CheckCircle2 size={12} className="text-green-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                      <ReorderControls />
                    </div>

                    <div className="flex gap-2 mt-1 pr-2">
                      <button
                        onClick={() => window.open(loc.link || `https://maps.google.com/?q=${loc.coords?.lat},${loc.coords?.lng}`, '_blank')}
                        className="flex-1 bg-nature-mint/30 active:bg-nature-mint/50 text-nature-primary text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <MapPin size={14} /> Mapa
                      </button>
                      {loc.cat === 'flight' || loc.cat === 'transport' ? (
                        <button className="flex-1 bg-blue-50 text-blue-600 active:bg-blue-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <Ticket size={14} /> Billetes
                        </button>
                      ) : loc.cat === 'hotel' ? (
                        <button className="flex-1 bg-gray-900 text-white active:bg-gray-800 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <Bed size={14} /> Reserva
                        </button>
                      ) : (
                        <button className="flex-[2] bg-gray-900 text-white active:bg-gray-800 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <Navigation size={14} /> Ruta
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSkippedTasks(prev => {
                            const n = new Set(prev);
                            if (n.has(loc.id)) n.delete(loc.id); else n.add(loc.id);
                            return n;
                          });
                        }}
                        className="flex-1 bg-red-50 text-red-600 active:bg-red-100 text-[10px] uppercase tracking-wider font-bold py-2.5 rounded-xl flex items-center justify-center gap-1"
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {nextLoc && loc.cat !== 'free' && loc.cat !== 'logistics' && nextLoc.cat !== 'free' && nextLoc.cat !== 'logistics' && (
                  <div className="py-2 ml-2">
                    <TransportBlock fromLoc={loc} toLoc={nextLoc} />
                  </div>
                )}
              </div>
            );
          })}

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
                onClick={() => setShowLogistics(!showLogistics)}
                className="w-full bg-blue-50 active:bg-blue-100 text-blue-600 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
              >
                📋 <Plus size={12} /> Logística
              </button>
              {showLogistics && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 grid grid-cols-2 gap-1">
                  {LOGISTICS_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => handleAddLogistics(type)}
                      className="text-left px-3 py-2.5 rounded-lg active:bg-gray-100 text-xs font-bold text-gray-600 flex items-center gap-2"
                    >
                      <span className="text-base">{type.icon}</span>
                      <span className="truncate">{type.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {movingItemId && (
        <MoveToDaySheet
          onClose={() => setMovingItemId(null)}
          onMove={(day) => {
            moveToDay(movingItemId, day, activeDayVariants[day]);
            setMovingItemId(null);
            addToast('Actividad movida con éxito', 'success');
          }}
        />
      )}
    </div>
  );
};
