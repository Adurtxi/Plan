import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { X, Inbox, Plus } from 'lucide-react';
import { SortableCard } from '../ui/SortableCard';
import { useAppStore } from '../../store';

interface IdeaInboxProps {
  handleEdit: (id: number) => void;
  handleAddNew: () => void;
}

export const IdeaInbox = ({ handleEdit, handleAddNew }: IdeaInboxProps) => {
  const { locations } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const { isOver, setNodeRef } = useDroppable({ id: 'col-unassigned' });

  const unassigned = locations.filter(l => l.day === 'unassigned' || l.reservationStatus === 'idea');

  return (
    <>
      {/* Floating button to open the Inbox */}
      <button
        onClick={() => setIsOpen(true)}
        className={`absolute top-20 left-6 z-[400] bg-white/90 backdrop-blur-md text-nature-primary p-3 rounded-full shadow-lg border border-white hover:bg-white transition-all ${isOpen ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}
        title="Buzón de Ideas"
      >
        <div className="relative">
          <Inbox size={20} />
          {unassigned.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {unassigned.length}
            </span>
          )}
        </div>
      </button>

      {/* The Sliding Drawer */}
      <div className={`w-full md:w-[320px] shrink-0 bg-white border-r border-gray-100 flex flex-col z-[510] shadow-[10px_0_30px_rgba(0,0,0,0.1)] h-full absolute top-0 bottom-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
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

        <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-6 custom-scroll ${isOver ? 'bg-nature-mint/20' : 'bg-white'} space-y-3 transition-colors`}>
          {unassigned.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
              <Inbox size={48} />
              <p className="text-xs text-center px-4">No hay ideas pendientes.<br />Añade lugares para organizar tu viaje.</p>
            </div>
          ) : (
            <SortableContext items={unassigned.map(l => l.id.toString())}>
              {unassigned.map(item => <SortableCard key={item.id} item={item} onClick={() => handleEdit(item.id)} />)}
            </SortableContext>
          )}
        </div>
      </div>
    </>
  );
};
