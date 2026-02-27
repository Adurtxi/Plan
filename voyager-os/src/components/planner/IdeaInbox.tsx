import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { X, Inbox, Plus, Calendar } from 'lucide-react';
import { SortableCard } from '../ui/SortableCard';
import { useAppStore } from '../../store';
import { DAYS } from '../../constants';

interface IdeaInboxProps {
  handleEdit: (id: number) => void;
  handleCardClick: (id: number) => void;
  handleAddNew: () => void;
}

export const IdeaInbox = ({ handleEdit, handleCardClick, handleAddNew }: IdeaInboxProps) => {
  const { locations, activeGlobalVariantId, tripVariants } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({ id: 'col-unassigned' });

  const unassigned = locations.filter(l => l.day === 'unassigned' && l.cat !== 'free' && l.cat !== 'logistics');

  const assignedByDay = useMemo(() => {
    const assigned = locations.filter(
      l => l.day !== 'unassigned' && (l.variantId || 'default') === activeGlobalVariantId
    );

    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    const dayLabels: Record<string, string> = {};
    if (activeVar?.startDate && activeVar?.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;
      const d = new Date(start);
      while (d <= end) {
        dayLabels[`day-${i}`] = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        d.setDate(d.getDate() + 1);
        i++;
      }
    } else {
      DAYS.forEach(d => { dayLabels[d] = d.replace('-', ' '); });
    }

    // Group by day
    const grouped: { dayId: string; label: string; items: typeof assigned }[] = [];
    const dayIds = [...new Set(assigned.map(l => l.day))].sort();
    for (const dayId of dayIds) {
      const items = assigned
        .filter(l => l.day === dayId)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
      grouped.push({ dayId, label: dayLabels[dayId] || dayId.replace('-', ' '), items });
    }
    return grouped;
  }, [locations, activeGlobalVariantId, tripVariants]);

  const totalCount = unassigned.length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur-md text-nature-primary p-3 rounded-full shadow-lg border border-white hover:bg-white transition-all ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
        title="Buzón de Ideas"
      >
        <div className="relative">
          <Inbox size={20} />
          {totalCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {totalCount}
            </span>
          )}
        </div>
      </button>

      <div className={`w-full md:w-[360px] shrink-0 bg-white border-r border-gray-100 flex flex-col z-[510] shadow-[10px_0_30px_rgba(0,0,0,0.1)] h-full absolute top-0 bottom-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
        <button type="button" onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-nature-primary z-50 bg-white/50 rounded-full backdrop-blur transition-colors">
          <X size={24} />
        </button>

        <div className="p-8 pb-4 bg-gray-50/50">
          <h2 className="text-xl font-serif text-nature-primary flex items-center gap-2">
            <Inbox size={20} /> Buzón de Ideas
          </h2>
          <p className="text-[10px] text-gray-500 tracking-wider uppercase mt-1">Acumula y arrastra</p>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0">
          <button onClick={handleAddNew} className="w-full bg-nature-primary text-white py-3 rounded-xl shadow-[0_10px_20px_-10px_rgba(45,90,39,0.5)] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-nature-primary/90 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            <Plus size={18} /> Nueva Idea
          </button>
        </div>

        <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-6 custom-scroll ${isOver ? 'bg-nature-mint/20' : 'bg-white'} transition-colors`}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📥</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sin asignar</span>
              {unassigned.length > 0 && (
                <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unassigned.length}</span>
              )}
            </div>
            {unassigned.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 opacity-50 py-6 space-y-2 border-2 border-dashed border-gray-200 rounded-2xl">
                <Inbox size={32} />
                <p className="text-[10px] text-center px-4">No hay ideas pendientes.<br />Arrastra aquí o crea nuevas.</p>
              </div>
            ) : (
              <SortableContext items={unassigned.map(l => l.id.toString())}>
                <div className="space-y-3">
                  {unassigned.map(item => (
                    <SortableCard key={item.id} item={item} onClick={() => handleEdit(item.id)} onCardClick={() => handleCardClick(item.id)} />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          {assignedByDay.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 pt-4 border-t border-gray-100">
                <Calendar size={14} className="text-nature-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-nature-primary">Ya colocadas</span>
              </div>
              {assignedByDay.map(group => (
                <div key={group.dayId} className="mb-4">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-nature-primary/50"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.label}</span>
                    <span className="text-[9px] text-gray-300">{group.items.length}</span>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-nature-primary/10">
                    {group.items.map(item => (
                      <div key={item.id} className="opacity-70 hover:opacity-100 transition-opacity">
                        <SortableCard item={item} onClick={() => handleEdit(item.id)} onCardClick={() => handleCardClick(item.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
