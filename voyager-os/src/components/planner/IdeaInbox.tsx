import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { X, Inbox, Plus, Calendar, Search, Filter } from 'lucide-react';
import { SortableCard } from '../ui/SortableCard';
import { useAppStore } from '../../store';
import { DAYS, isTransportCat, getCatGroup } from '../../constants';
import { useLocations, useTripVariants } from '../../hooks/useTripData';
import { useMoveToDay } from '../../hooks/useTripMutations';

interface IdeaInboxProps {
  handleEdit: (id: number) => void;
  handleCardClick: (id: number) => void;
  handleAddNew: () => void;
}

export const IdeaInbox = ({ handleEdit, handleCardClick, handleAddNew }: IdeaInboxProps) => {
  const { activeGlobalVariantId, isDragging, activeDayVariants } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const { mutate: moveToDay } = useMoveToDay();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const toggleSelection = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkMove = (targetDay: string) => {
    selectedIds.forEach(id => {
      const targetVariant = activeDayVariants[targetDay] || 'default';
      moveToDay({ id, targetDay, targetVariant });
    });
    setSelectedIds([]);
    setShowMoveModal(false);
  };

  const { isOver, setNodeRef } = useDroppable({ id: 'col-unassigned' });

  const unassignedAll = locations.filter(l => l.day === 'unassigned' && l.cat !== 'free' && !isTransportCat(l.cat));

  const unassigned = useMemo(() => {
    return unassignedAll.filter(item => {
      const matchesSearch = !searchTerm ||
        (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = activeFilter === 'all' || getCatGroup(item.cat) === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [unassignedAll, searchTerm, activeFilter]);

  const { assignedByDay = [], dayOptions = [] } = useMemo(() => {
    const assigned = locations.filter(
      l => l.day !== 'unassigned' && (l.globalVariantId || 'default') === (activeGlobalVariantId || 'default') && l.cat !== 'free'
    );

    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    const dayLabels: Record<string, string> = {};
    const dayOptions: { value: string; label: string }[] = [];
    if (activeVar?.startDate && activeVar?.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;
      const d = new Date(start);
      while (d <= end) {
        const id = `day-${i}`;
        dayLabels[id] = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        dayOptions.push({ value: id, label: dayLabels[id] });
        d.setDate(d.getDate() + 1);
        i++;
      }
    } else {
      DAYS.forEach(d => {
        dayLabels[d] = d.replace('-', ' ');
        dayOptions.push({ value: d, label: dayLabels[d] });
      });
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
    return { assignedByDay: grouped, dayOptions };
  }, [locations, activeGlobalVariantId, tripVariants]);

  const totalCount = unassignedAll.length;

  const FILTER_OPTIONS = [
    { id: 'all', label: 'Todas' },
    { id: 'activity', label: 'Actividad' },
    { id: 'transport', label: 'Transporte' },
    { id: 'accommodation', label: 'Alojamiento' }
  ];

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

      <div className={`w-full md:w-[460px] shrink-0 bg-white border-r border-gray-100 flex flex-col z-[510] shadow-[10px_0_30px_rgba(0,0,0,0.1)] h-full absolute top-0 bottom-0 left-0 transform ${isOpen && !isDragging ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
        <button type="button" onClick={() => setIsOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-nature-primary z-50 bg-white/50 rounded-full backdrop-blur transition-colors">
          <X size={24} />
        </button>

        <div className="p-8 pb-4 bg-gray-50/50">
          <h2 className="text-xl font-sans text-nature-primary flex items-center gap-2">
            <Inbox size={20} /> Buzón de Ideas
          </h2>
          <p className="text-[10px] text-gray-500 tracking-wider uppercase mt-1">Acumula y arrastra</p>
        </div>

        <div className="px-6 pt-4 pb-0 shrink-0 flex flex-col gap-3">
          <button onClick={handleAddNew} className="w-full bg-nature-primary text-white py-3 rounded-xl shadow-[0_10px_20px_-10px_rgba(45,90,39,0.5)] font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-nature-primary/90 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
            <Plus size={18} /> Nueva Idea
          </button>

          <div className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar en buzón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-nature-primary focus:ring-2 focus:ring-nature-primary/20 rounded-xl text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-2 mt-1">
            <Filter size={14} className="text-gray-400 shrink-0 mr-1" />
            {FILTER_OPTIONS.map(opt => {
              const count = opt.id === 'all'
                ? unassignedAll.length
                : unassignedAll.filter(item => getCatGroup(item.cat) === opt.id).length;

              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5
                    ${activeFilter === opt.id
                      ? 'bg-nature-primary text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {opt.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeFilter === opt.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-6 custom-scroll ${isOver ? 'bg-nature-mint/20' : 'bg-white'} transition-colors border-t border-gray-100`}>
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
                    <SortableCard
                      key={item.id}
                      item={item}
                      onClick={() => handleEdit(item.id)}
                      onCardClick={() => handleCardClick(item.id)}
                      isSelected={selectedIds.includes(item.id)}
                      onToggleSelect={(e: React.MouseEvent) => toggleSelection(e, item.id)}
                    />
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

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-50 flex flex-col gap-3">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm font-bold text-nature-primary">{selectedIds.length} seleccionadas</span>
              <button onClick={() => setSelectedIds([])} className="text-[10px] uppercase font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
            {showMoveModal ? (
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scroll">
                {[...dayOptions, { value: 'unassigned', label: '📥 Buzón de Ideas' }].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleBulkMove(opt.value)}
                    className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${opt.value === 'unassigned' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-gray-50 text-gray-700 hover:bg-nature-mint/30'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setShowMoveModal(true)} className="w-full bg-nature-primary text-white py-3 rounded-xl font-bold text-sm flex justify-center gap-2 items-center hover:bg-nature-primary/90">
                <Calendar size={18} /> Mover al día...
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
