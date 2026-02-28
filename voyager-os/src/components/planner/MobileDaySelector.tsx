import { useRef, useEffect } from 'react';
import { useAppStore } from '../../store';
import { DAYS } from '../../constants';

interface MobileDaySelectorProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
}

export const MobileDaySelector = ({ selectedDay, onSelectDay }: MobileDaySelectorProps) => {
  const { locations, tripVariants, activeGlobalVariantId } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute day labels from trip variant dates
  const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
  const dayLabels: Record<string, string> = {};
  const dayIds: string[] = [];

  if (activeVar?.startDate && activeVar?.endDate) {
    const start = new Date(activeVar.startDate);
    const end = new Date(activeVar.endDate);
    let i = 1;
    const d = new Date(start);
    while (d <= end) {
      const id = `day-${i}`;
      dayIds.push(id);
      dayLabels[id] = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      d.setDate(d.getDate() + 1);
      i++;
    }
  } else {
    DAYS.forEach((d, i) => {
      const id = `day-${i + 1}`;
      dayIds.push(id);
      dayLabels[id] = d.substring(0, 3);
    });
  }

  // Display all days
  const displayDays = dayIds;

  // Count items per day
  const countByDay = (dayId: string) => locations.filter(l => l.day === dayId).length;

  // Auto-scroll to selected day
  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector(`[data-day="${selectedDay}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDay]);

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1">
      {displayDays.map(dayId => {
        const active = dayId === selectedDay;
        const count = countByDay(dayId);
        return (
          <button
            key={dayId}
            data-day={dayId}
            onClick={() => onSelectDay(dayId)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${active
              ? 'bg-nature-primary text-white shadow-md shadow-nature-primary/30'
              : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
          >
            {dayLabels[dayId] || dayId}
            {count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
