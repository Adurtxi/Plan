import { useState } from 'react';
import { Briefcase, Check } from 'lucide-react';
import { useChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem } from '../../hooks/useTripData';
import { RAButton } from '../ui/RAButton';

export const ChecklistTab = () => {
  const { data: checklist = [] } = useChecklist();
  const { mutate: addChecklistItem } = useAddChecklistItem();
  const { mutate: toggleChecklistItem } = useToggleChecklistItem();
  const { mutate: deleteChecklistItem } = useDeleteChecklistItem();
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = () => {
    if (newTodo.trim()) {
      addChecklistItem(newTodo);
      setNewTodo('');
    }
  };

  return (
    <div className="flex-1 bg-nature-bg p-8 md:p-16 overflow-y-auto w-full">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-sans text-nature-primary mb-4">Equipaje</h1>
        <p className="text-nature-textLight font-light text-lg mb-10">Lo esencial para un viaje sin preocupaciones.</p>
        <div className="flex gap-4 mb-10 items-center bg-bg-surface p-2 rounded-2xl shadow-sm border border-border-strong">
          <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="flex-1 bg-transparent border-none p-4 text-text-primary placeholder-text-muted outline-none text-lg" placeholder="Añadir elemento..." />
          <RAButton variant="primary" onPress={handleAdd} size="md">Añadir</RAButton>
        </div>
        <div className="bg-bg-surface rounded-bento shadow-soft overflow-hidden p-2 min-h-[200px] flex flex-col">
          {checklist.length === 0 ? (
            <div className="m-auto text-center space-y-4 opacity-50 p-8 flex flex-col items-center justify-center h-full">
              <Briefcase size={48} strokeWidth={1} className="text-text-muted" />
              <p className="text-sm text-text-muted font-medium max-w-[200px]">No hay elementos en tu equipaje. Añade cosas esenciales para no olvidarlas.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 flex-1">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center p-6 justify-between hover:bg-bg-surface-elevated transition-colors group">
                  <div className="flex gap-6 items-center flex-1 cursor-pointer" onClick={() => toggleChecklistItem({ id: item.id, done: !item.done })}>
                    <div className={`w-6 h-6 border-2 flex items-center justify-center rounded-full transition-all duration-300 ${item.done ? 'bg-nature-primary border-nature-primary text-white' : 'border-gray-300 text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className={`text-lg font-sans transition-colors duration-500 ${item.done ? 'line-through text-text-muted' : 'text-text-primary font-medium'}`}>{item.text}</span>
                  </div>
                  <RAButton variant="ghost" onPress={() => deleteChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 text-sm tracking-wider uppercase" size="sm">Eliminar</RAButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
