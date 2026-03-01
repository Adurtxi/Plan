import { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { X, Inbox, Plus, Calendar, Search, Filter, CheckSquare } from 'lucide-react';
import { DAYS, isTransportCat, getCatGroup } from '../../constants';
import { CAT_ICONS } from '../../constants';
import { useLocations, useTripVariants } from '../../hooks/useTripData';
import { useMoveToDay } from '../../hooks/useTripMutations';

interface MobileIdeaInboxProps {
  isOpen: boolean;
  onClose: () => void;
  handleEdit: (id: number) => void;
  handleAddNew: () => void;
}

export const MobileIdeaInbox = ({ isOpen, onClose, handleEdit, handleAddNew }: MobileIdeaInboxProps) => {
  const { activeGlobalVariantId, activeDayVariants } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const { mutate: moveToDay } = useMoveToDay();
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

  const { dayOptions = [] } = useMemo(() => {
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
    return { dayOptions };
  }, [activeGlobalVariantId, tripVariants]);

  const FILTER_OPTIONS = [
    { id: 'all', label: 'Todas' },
    { id: 'activity', label: 'Actividad' },
    { id: 'transport', label: 'Transporte' },
    { id: 'accommodation', label: 'Alojamiento' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-gray-50 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-full duration-300">

      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-nature-border flex justify-between items-center shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="text-nature-primary" size={24} />
          <h2 className="text-2xl font-sans text-nature-primary">Buzón de Ideas</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:bg-gray-200">
          <X size={20} />
        </button>
      </div>

      {/* Inputs Area */}
      <div className="px-4 py-4 bg-white border-b border-nature-border shrink-0 space-y-3">
        <button onClick={handleAddNew} className="w-full bg-nature-primary text-white py-3.5 rounded-xl shadow-md font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-nature-primary/90 transition-all active:scale-[0.98]">
          <Plus size={18} /> Añadir Idea al Buzón
        </button>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar idea..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nature-primary/20 focus:border-nature-primary transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === opt.id
                ? 'bg-nature-primary text-white border-nature-primary shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-1.5">
                {opt.id !== 'all' && <Filter size={12} />}
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
        {unassigned.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
            <Inbox size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-bold mb-1">El buzón está vacío</p>
            <p className="text-sm">Las ideas sin asignar aparecerán aquí.</p>
          </div>
        ) : (
          unassigned.map(loc => {
            const isSelected = selectedIds.includes(loc.id);
            return (
              <div
                key={loc.id}
                className={`p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-nature-primary bg-nature-mint/10' : 'border-nature-border bg-nature-surface'} `}
                onClick={(e) => toggleSelection(e, loc.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative">
                      <span className="text-2xl bg-gray-50 p-2 rounded-xl mt-1 block">{CAT_ICONS[loc.cat]}</span>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-nature-primary text-white p-1 rounded-full shadow-sm animate-in zoom-in duration-200">
                          <CheckSquare size={12} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-bold text-lg leading-tight text-nature-text">
                        {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{loc.notes}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(loc.id); }}
                    className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg active:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds([loc.id]);
                      setShowMoveModal(true);
                    }}
                    className="flex-[2] py-2 text-xs font-bold text-nature-primary bg-nature-mint/30 rounded-lg active:bg-nature-mint/50 flex flex-center gap-1.5"
                  >
                    <Calendar size={14} /> Mover al plan
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bulk Move Button */}
      {selectedIds.length > 0 && !showMoveModal && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-0 right-0 px-4 z-[610] animate-in slide-in-from-bottom-8">
          <button
            onClick={() => setShowMoveModal(true)}
            className="w-full bg-nature-primary text-white py-4 rounded-2xl shadow-xl font-bold flex justify-center items-center gap-2"
          >
            <Calendar size={20} />
            Mover {selectedIds.length} {selectedIds.length === 1 ? 'idea' : 'ideas'} al plan
          </button>
        </div>
      )}

      {/* Move To Day Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[620] flex flex-col justify-end">
          <div className="absolute inset-0 bg-nature-primary/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
          <div className="bg-white rounded-t-3xl p-6 relative z-10 animate-in slide-in-from-bottom-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-sans text-xl text-nature-primary">Asignar al día</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedIds.length} actividades seleccionadas</p>
              </div>
              <button onClick={() => setShowMoveModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scroll pb-8">
              {dayOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleBulkMove(opt.value)}
                  className="p-4 rounded-xl font-bold text-sm flex items-center justify-center bg-gray-50 border border-gray-100 text-gray-600 active:bg-nature-mint/30 active:text-nature-primary active:border-nature-primary/30 transition-all"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
