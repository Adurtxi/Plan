import { useState } from 'react';
import { useAppStore } from '../../store';

export const ChecklistTab = () => {
  const { checklist, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useAppStore();
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
        <h1 className="text-5xl font-serif text-nature-primary mb-4">Equipaje</h1>
        <p className="text-nature-textLight font-light text-lg mb-10">Lo esencial para un viaje sin preocupaciones.</p>
        <div className="flex gap-4 mb-10 items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="flex-1 bg-transparent border-none p-4 text-nature-text placeholder-gray-400 outline-none text-lg" placeholder="Añadir elemento..." />
          <button onClick={handleAdd} className="bg-nature-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-nature-primary/90 transition-all">Añadir</button>
        </div>
        <div className="bg-white rounded-bento shadow-soft overflow-hidden p-2">
          <div className="divide-y divide-gray-50">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center p-6 justify-between hover:bg-gray-50 transition-colors group">
                <div className="flex gap-6 items-center">
                  <input type="checkbox" checked={item.done} onChange={(e) => toggleChecklistItem(item.id, e.target.checked)} className="w-6 h-6 border-2 border-gray-300 rounded-full checked:bg-nature-primary checked:border-nature-primary cursor-pointer transition-all appearance-none relative after:content-['✓'] after:absolute after:text-white after:text-xs after:left-[4px] after:top-[2px]" />
                  <span className={`text-lg font-serif transition-colors ${item.done ? 'line-through text-gray-300' : 'text-nature-text font-medium'}`}>{item.text}</span>
                </div>
                <button onClick={() => deleteChecklistItem(item.id)} className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
