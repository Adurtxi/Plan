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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white p-3 rounded-r-2xl shadow-floating border-y border-r border-gray-100 flex flex-col items-center gap-2 hover:bg-nature-mint transition-colors group"
      >
        <Inbox size={20} className="text-nature-primary group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400 [writing-mode:vertical-rl] group-hover:text-nature-primary break-all h-20">Ideas ({unassigned.length})</span>
      </button>

      <div className={`absolute top-0 left-0 w-80 h-full bg-white z-40 shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-serif text-nature-primary flex items-center gap-2">
              <Inbox size={20} /> Buzón de Ideas
            </h2>
            <p className="text-[10px] text-gray-500 tracking-wider uppercase mt-1">Arrastra al tablero</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-nature-primary transition-colors bg-white rounded-xl shadow-sm"><X size={16} /></button>
        </div>

        <div className="px-4 pt-4 pb-2">
          <button onClick={handleAddNew} className="w-full bg-nature-primary text-white py-3 rounded-xl shadow-md font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-nature-primary/90 transition-colors">
            <Plus size={18} /> Nueva Idea
          </button>
        </div>

        <div ref={setNodeRef} className={`flex-1 overflow-y-auto p-4 custom-scroll ${isOver ? 'bg-nature-mint/20' : 'bg-white'} space-y-3 transition-colors`}>
          {unassigned.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
              <Inbox size={48} />
              <p className="text-xs text-center px-8">No hay ideas pendientes.<br />Añade nuevos lugares desde el botón principal.</p>
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
