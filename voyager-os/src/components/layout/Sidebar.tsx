import { Map, Briefcase, Download, Trash2, LineChart } from 'lucide-react';
import { useAppStore } from '../../store';

export const Sidebar = () => {
  const { activeTab, setActiveTab, locations, checklist, deleteLocation, deleteChecklistItem, showDialog, addToast } = useAppStore();

  const totalCostObj = locations.reduce((acc, loc) => {
    const amount = loc.newPrice?.amount || parseFloat(loc.cost) || 0;
    const currency = loc.newPrice?.currency || acc.currency;
    return { amount: acc.amount + amount, currency };
  }, { amount: 0, currency: 'EUR' });

  const totalCost = totalCostObj.amount;
  const currencySymbol = totalCostObj.currency === 'USD' ? '$' : totalCostObj.currency === 'GBP' ? '£' : totalCostObj.currency === 'JPY' ? '¥' : '€';

  const handleReset = () => {
    showDialog({
      type: 'confirm',
      title: 'Reiniciar Viaje',
      message: '¿Estás seguro de que deseas eliminar todas las ubicaciones y tareas? Esta acción no se puede deshacer.',
      confirmText: 'Sí, borrar todo',
      isDestructive: true,
      onConfirm: () => {
        locations.forEach(l => deleteLocation(l.id));
        checklist.forEach(c => deleteChecklistItem(c.id));
        addToast('Viaje reiniciado por completo.', 'info');
      }
    });
  };

  return (
    <aside className="w-20 md:w-24 bg-white border-r border-nature-border hidden lg:flex flex-col items-center py-8 gap-8 z-30 shadow-soft shrink-0">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-nature-primary text-white rounded-full flex items-center justify-center font-serif font-bold text-xl md:text-2xl shadow-lg shadow-nature-primary/20">V</div>
      <button onClick={() => setActiveTab('planner')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'planner' ? 'bg-nature-mint/50 text-nature-primary shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-nature-bg'}`} title="Itinerario"><Map size={24} strokeWidth={1.5} /></button>
      <button onClick={() => setActiveTab('analytics')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'analytics' ? 'bg-nature-mint/50 text-nature-primary shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-nature-bg'}`} title="Análisis"><LineChart size={24} strokeWidth={1.5} /></button>
      <button onClick={() => setActiveTab('checklist')} className={`p-4 rounded-2xl transition-all duration-300 ${activeTab === 'checklist' ? 'bg-nature-mint/50 text-nature-primary shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-nature-bg'}`} title="Equipaje"><Briefcase size={24} strokeWidth={1.5} /></button>
      <div className="mt-auto flex flex-col gap-6 w-full px-2 md:px-4 items-center">
        <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase text-center hidden md:block">Total<div className="text-nature-primary text-sm font-serif mt-1">{currencySymbol}{totalCost.toFixed(0)}</div></div>
        <button className="p-3 text-gray-400 hover:text-nature-primary hover:bg-nature-bg rounded-xl transition-all" title="Guardar Viaje"><Download size={20} /></button>
        <button onClick={handleReset} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Reiniciar"><Trash2 size={20} /></button>
      </div>
    </aside>
  );
};
