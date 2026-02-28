import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '../../store';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { CAT_ICONS, isTransportCat } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';

export const MapBottomSheet = ({ selectedDay }: { selectedDay: string }) => {
  const { locations, activeDayVariants, setSelectedLocationId } = useAppStore();
  const [snapState, setSnapState] = useState<0 | 1 | 2>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartY = useRef(0);

  const activeVariant = activeDayVariants[selectedDay] || 'default';

  const dayLocations = useMemo(() => {
    return locations
      .filter(l => l.day === selectedDay && (l.variantId || 'default') === activeVariant && l.cat !== 'free' && !isTransportCat(l.cat))
      .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  }, [locations, selectedDay, activeVariant]);

  const snapHeights = ['20vh', '50vh', '85vh'];
  const currentHeight = snapHeights[snapState];

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Dampening beyond bounds
    if (snapState === 2 && dy < 0) setDragOffset(dy * 0.2);
    else if (snapState === 0 && dy > 0) setDragOffset(dy * 0.2);
    else setDragOffset(dy);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset < -50) {
      setSnapState(prev => {
        const next = Math.min(2, prev + 1) as 0 | 1 | 2;
        if (next !== prev) hapticFeedback.light();
        return next;
      });
    } else if (dragOffset > 50) {
      setSnapState(prev => {
        const next = Math.max(0, prev - 1) as 0 | 1 | 2;
        if (next !== prev) hapticFeedback.light();
        return next;
      });
    }
    setDragOffset(0);
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.15)] flex flex-col z-[500] border-t border-gray-100"
      style={{
        height: currentHeight,
        transform: `translateY(${isDragging ? dragOffset : 0}px)`,
        transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25,1,0.5,1), transform 0.3s cubic-bezier(0.25,1,0.5,1)',
      }}
    >
      {/* Handle / Header */}
      <div
        className="w-full flex flex-col items-center pt-3 pb-4 cursor-pointer shrink-0 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          hapticFeedback.selection();
          setSnapState(prev => prev === 2 ? 1 : prev === 1 ? 0 : 2);
        }}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-3 shadow-inner" />
        <div className="flex items-center justify-between w-full px-6 text-sm font-bold text-gray-500">
          <span>{dayLocations.length} actividades en el mapa</span>
          {snapState === 2 ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-3 custom-scroll">
        {dayLocations.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">
            No hay ubicaciones con mapa para este día.
          </div>
        ) : (
          dayLocations.map(loc => {
            const displayTime = loc.derivedDatetime || loc.datetime;
            const formattedTime = displayTime
              ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <button
                key={loc.id}
                onClick={() => {
                  hapticFeedback.selection();
                  setSelectedLocationId(loc.id);
                  setSnapState(1); // minimize sheet to half to show map
                }}
                className="w-full text-left bg-gray-50 hover:bg-nature-mint/20 active:bg-nature-mint/30 border border-gray-100 p-4 rounded-2xl flex items-center gap-4 transition-colors"
              >
                <div className={`p-2 rounded-xl text-xl flex items-center justify-center shrink-0 ${loc.priority === 'necessary' ? 'bg-nature-primary/10 text-nature-primary' : 'bg-white shadow-sm'}`}>
                  {CAT_ICONS[loc.cat]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-nature-text truncate">{loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}</h4>
                  {(formattedTime || loc.slot) && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] uppercase tracking-widest font-bold text-gray-400">
                      <Clock size={10} />
                      {formattedTime || loc.slot}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
