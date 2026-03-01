import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { X, Calendar, Copy, Trash2 } from 'lucide-react';
import type { TripVariant } from '../../types';
import { useTripVariants, useAddTripVariant, useUpdateTripVariant, useDeleteTripVariant } from '../../hooks/useTripData';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripSettingsModal = ({ isOpen, onClose }: TripSettingsModalProps) => {
  const { activeGlobalVariantId, setActiveGlobalVariantId, showDialog, addToast } = useAppStore();
  const { data: tripVariants = [] } = useTripVariants();
  const { mutate: addTripVariant } = useAddTripVariant();
  const { mutate: updateTripVariant } = useUpdateTripVariant();
  const { mutate: deleteTripVariant } = useDeleteTripVariant();

  const activeVariant = tripVariants.find(v => v.id === activeGlobalVariantId);
  const [editingVariant, setEditingVariant] = useState<TripVariant | null>(null);

  // Custom states for cities
  const [currentCities, setCurrentCities] = useState<string[]>([]);
  const [cityInputValue, setCityInputValue] = useState('');

  useEffect(() => {
    if (isOpen && activeVariant) {
      setEditingVariant({ ...activeVariant });
      setCurrentCities(activeVariant.cities ? [...activeVariant.cities] : []);
    } else {
      setCityInputValue('');
    }
  }, [isOpen, activeVariant]);

  if (!isOpen || !editingVariant) return null;

  const handleCreateVariant = () => {
    const newId = `variant-${Date.now()}`;
    const newVariant: TripVariant = {
      id: newId,
      name: `Copia de ${editingVariant.name}`,
      startDate: editingVariant.startDate,
      endDate: editingVariant.endDate,
    };
    addTripVariant(newVariant);
    setActiveGlobalVariantId(newId);
  };

  const handleSave = () => {
    updateTripVariant({
      ...editingVariant,
      cities: currentCities.length > 0 ? currentCities : undefined
    });
    addToast('Ajustes de viaje guardados', 'success');
    onClose();
  };

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = cityInputValue.trim().replace(/,/g, '');
      if (val && !currentCities.includes(val)) {
        setCurrentCities([...currentCities, val]);
      }
      setCityInputValue('');
    } else if (e.key === 'Backspace' && !cityInputValue && currentCities.length > 0) {
      setCurrentCities(currentCities.slice(0, -1));
    }
  };

  const removeCity = (cityToRemove: string) => {
    setCurrentCities(currentCities.filter(c => c !== cityToRemove));
  };

  const handleDelete = (id: string) => {
    showDialog({
      type: 'confirm',
      title: 'Eliminar variante',
      message: '¿Seguro que quieres eliminar esta ruta o variante del plan global? Se perderán las referencias.',
      confirmText: 'Sí, eliminar',
      isDestructive: true,
      onConfirm: () => {
        deleteTripVariant(id);
        if (activeGlobalVariantId === id) {
          setActiveGlobalVariantId('default');
        }
        addToast('Variante global eliminada', 'info');
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-nature-primary/20 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[500px] bg-white rounded-[32px] shadow-2xl z-[110] flex flex-col overflow-hidden animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-nature-bg/30">
          <div className="flex items-center gap-2 text-nature-primary">
            <Calendar size={20} />
            <h2 className="text-xl font-sans font-bold">Ajustes del Viaje</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-nature-primary">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Actual</label>
            <div className="flex gap-2">
              <select
                value={activeGlobalVariantId}
                onChange={(e) => setActiveGlobalVariantId(e.target.value)}
                className="flex-1 bg-gray-50 border-0 rounded-xl p-3 text-sm font-medium text-nature-text focus:ring-2 focus:ring-nature-primary/20"
              >
                {tripVariants.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <button
                onClick={handleCreateVariant}
                title="Duplicar como nueva alternativa"
                className="bg-nature-mint/30 hover:bg-nature-mint/50 text-nature-primary p-3 rounded-xl transition-colors flex items-center justify-center gap-1 font-bold text-xs"
              >
                <Copy size={16} /> <span className="hidden sm:inline">Variante</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[24px] space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Nombre de la Variante</label>
              <input
                type="text"
                value={editingVariant.name}
                onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                className="w-full bg-white border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-nature-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Día de Inicio</label>
                <input
                  type="date"
                  value={editingVariant.startDate || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, startDate: e.target.value })}
                  className="w-full bg-white border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-nature-text"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Día de Fin</label>
                <input
                  type="date"
                  value={editingVariant.endDate || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, endDate: e.target.value })}
                  className="w-full bg-white border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-nature-text"
                  min={editingVariant.startDate || undefined}
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 ml-1">
              Si defines inicio y fin, el tablero generará automáticamente las columnas exactas de tu viaje.
            </p>
          </div>

          <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-[24px] space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Zonas / Ciudades a Visitar</label>
              <div className="w-full bg-white shadow-sm border border-transparent focus-within:border-nature-mint focus-within:ring-2 focus-within:ring-nature-primary/20 rounded-xl p-2.5 flex flex-wrap gap-2 min-h-[50px] items-center transition-all">
                {currentCities.map(city => (
                  <span key={city} className="bg-nature-mint text-nature-primary text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    {city}
                    <button type="button" onClick={() => removeCity(city)} className="hover:text-red-500 bg-white/50 rounded-full p-0.5 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={cityInputValue}
                  onChange={(e) => setCityInputValue(e.target.value)}
                  onKeyDown={handleCityKeyDown}
                  className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-nature-text placeholder-gray-300"
                  placeholder={currentCities.length === 0 ? "Ej. Tokio, Kioto... (Pulsa Enter)" : ""}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-1">
                Define aquí las zonas (ej. "Norte de Italia", "Milán"). Cuando añadas actividades, podrás seleccionarlas rápidamente de esta lista.
              </p>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white">
          {activeGlobalVariantId !== 'default' ? (
            <button
              onClick={() => handleDelete(activeGlobalVariantId)}
              className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              title="Eliminar esta variante"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSave}
            className="bg-nature-primary text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-nature-accent transition-colors shadow-solid hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px]"
          >
            Guardar y Aplicar
          </button>
        </div>
      </div>
    </>
  );
};
