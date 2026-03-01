import { Map, Briefcase, Download, Trash2, LineChart, Moon, Sun, Image as ImageIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAppStore } from '../../store';
import { useLocations, useChecklist, useDeleteLocation, useDeleteChecklistItem } from '../../hooks/useTripData';

export const Sidebar = () => {
  const { showDialog, addToast, theme, toggleTheme } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { data: checklist = [] } = useChecklist();
  const { mutate: deleteLocation } = useDeleteLocation();
  const { mutate: deleteChecklistItem } = useDeleteChecklistItem();

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `p-4 flex items-center justify-center rounded-2xl transition-all duration-300 ${isActive ? 'bg-nature-mint/50 text-nature-primary shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-nature-bg'}`;

  return (
    <aside className="w-20 md:w-24 bg-white border-r border-nature-border hidden lg:flex flex-col items-center py-8 gap-8 z-30 shadow-soft shrink-0">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-nature-primary text-white rounded-full flex items-center justify-center font-sans font-bold text-xl md:text-2xl shadow-lg shadow-nature-primary/20">V</div>
      <NavLink to="/" className={navLinkClass} title="Itinerario"><Map size={24} strokeWidth={1.5} /></NavLink>
      <NavLink to="/gallery" className={navLinkClass} title="Galería"><ImageIcon size={24} strokeWidth={1.5} /></NavLink>
      <NavLink to="/analytics" className={navLinkClass} title="Análisis"><LineChart size={24} strokeWidth={1.5} /></NavLink>
      <NavLink to="/checklist" className={navLinkClass} title="Equipaje"><Briefcase size={24} strokeWidth={1.5} /></NavLink>
      <div className="mt-auto flex flex-col gap-6 w-full px-2 md:px-4 items-center">
        <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase text-center hidden md:block">Total<div className="text-nature-primary text-sm font-sans mt-1">{currencySymbol}{totalCost.toFixed(0)}</div></div>

        <button
          onClick={toggleTheme}
          className="p-3 text-gray-400 hover:text-nature-primary hover:bg-nature-bg rounded-xl transition-all"
          title="Cambiar Tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-3 text-gray-400 hover:text-nature-primary hover:bg-nature-bg rounded-xl transition-all" title="Guardar Viaje"><Download size={20} /></button>
        <button onClick={handleReset} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Reiniciar"><Trash2 size={20} /></button>
      </div>
    </aside>
  );
};
