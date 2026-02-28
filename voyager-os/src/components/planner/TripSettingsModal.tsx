import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { X, Calendar, Copy, Trash2 } from 'lucide-react';
import type { TripVariant } from '../../types';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripSettingsModal = ({ isOpen, onClose }: TripSettingsModalProps) => {
  const { tripVariants, activeGlobalVariantId, setActiveGlobalVariantId, addTripVariant, updateTripVariant, deleteTripVariant, showDialog, addToast } = useAppStore();

  const activeVariant = tripVariants.find(v => v.id === activeGlobalVariantId);
  const [editingVariant, setEditingVariant] = useState<TripVariant | null>(null);

  useEffect(() => {
    if (isOpen && activeVariant) {
      setEditingVariant({ ...activeVariant });
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
    updateTripVariant(editingVariant);
    addToast('Ajustes de viaje guardados', 'success');
    onClose();
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
