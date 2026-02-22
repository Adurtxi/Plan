import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { X, Clock, Coffee } from 'lucide-react';

interface FreeTimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formId: number | null;
  day: string;
  variantId: string;
  onSave: () => void;
}

export const FreeTimeSheet = ({ isOpen, onClose, formId, day, variantId, onSave }: FreeTimeSheetProps) => {
  const { locations, addLocation, updateLocation } = useAppStore();

  const [title, setTitle] = useState('Tiempo Libre');
  const [datetime, setDatetime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      if (formId) {
        const item = locations.find(l => l.id === formId);
        if (item) {
          setTitle(item.title || 'Tiempo Libre');
          setDatetime(item.datetime || '');
          setDurationMinutes(item.durationMinutes || '');
        }
      } else {
        setTitle('Tiempo Libre');
        setDatetime('');
        setDurationMinutes('');
      }
    }
  }, [isOpen, formId, locations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalDuration = durationMinutes === '' ? undefined : Number(durationMinutes);
    const finalDatetime = datetime || undefined;

    const baseData = {
      title,
      cat: 'free' as const,
      priority: 'optional' as const,
      cost: '0',
      link: '',
      notes: '',
      images: [],
      reservationStatus: 'idea' as const,
      datetime: finalDatetime,
      durationMinutes: finalDuration,
    };

    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing) {
        await updateLocation({
          ...existing,
          ...baseData,
        });
      }
    } else {
      await addLocation({
        ...baseData,
        id: Date.now(),
        coords: null,
        day,
        variantId,
        slot: 'Mañana',
        order: Date.now(),
      });
    }

    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-nature-primary/20 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[110] transform transition-transform duration-300 flex flex-col translate-x-0">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg- प्रकृति-mint/30 flex items-center justify-center text-nature-primary">
              <Coffee size={16} />
            </div>
            <h2 className="text-xl font-serif font-bold text-nature-primary">
              {formId ? 'Editar Tiempo Libre' : 'Añadir Tiempo Libre'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-nature-primary transition-colors p-2 hover:bg-gray-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Hueco</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Siesta, Descanso, Comida libre..."
                className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 placeholder-gray-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Hora (Opcional)</label>
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-nature-text"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> Duración (Min)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej. 120"
                  className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 placeholder-gray-400"
                />
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
              <strong className="text-gray-500 block mb-1">Ordenación Automática:</strong>
              Si defines una <strong>Hora</strong>, este bloque se ordenará cronológicamente en el tablero. Si la dejas vacía, podrás arrastrarlo manualmente donde prefieras.
            </p>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit}
            className="w-full bg-nature-primary text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-nature-accent transition-colors shadow-solid hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px]"
          >
            {formId ? 'Guardar Cambios' : 'Añadir al Plan'}
          </button>
        </div>
      </div>
    </>
  );
};
