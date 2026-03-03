import { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { X, Calendar, Copy, Trash2 } from 'lucide-react';
import type { TripVariant } from '../../types';
import { useTripVariants, useAddTripVariant, useUpdateTripVariant, useDeleteTripVariant } from '../../hooks/useTripData';
import { useForm } from 'react-hook-form';
import { RAModal } from '../ui/RAModal';
import { RAButton } from '../ui/RAButton';
import { RASelect, type RASelectItem } from '../ui/RASelect';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TripSettingsFormInputs {
  name: string;
  startDate: string;
  endDate: string;
}

export const TripSettingsModal = ({ isOpen, onClose }: TripSettingsModalProps) => {
  const activeGlobalVariantId = useAppStore(s => s.activeGlobalVariantId);
  const setActiveGlobalVariantId = useAppStore(s => s.setActiveGlobalVariantId);
  const showDialog = useAppStore(s => s.showDialog);
  const addToast = useAppStore(s => s.addToast);
  const { data: tripVariants = [] } = useTripVariants();
  const { mutate: addTripVariant } = useAddTripVariant();
  const { mutate: updateTripVariant } = useUpdateTripVariant();
  const { mutate: deleteTripVariant } = useDeleteTripVariant();

  const activeVariant = tripVariants.find(v => v.id === activeGlobalVariantId);
  const { register, handleSubmit, reset, getValues, watch } = useForm<TripSettingsFormInputs>();
  const startDateValue = watch('startDate');

  const [currentCities, setCurrentCities] = useState<string[]>([]);
  const [cityInputValue, setCityInputValue] = useState('');

  useEffect(() => {
    if (isOpen && activeVariant) {
      reset({
        name: activeVariant.name || '',
        startDate: activeVariant.startDate || '',
        endDate: activeVariant.endDate || ''
      });
      setCurrentCities(activeVariant.cities ? [...activeVariant.cities] : []);
    } else {
      setCityInputValue('');
    }
  }, [isOpen, activeVariant, reset]);

  if (!isOpen || !activeVariant) return null;

  const variantItems: RASelectItem[] = tripVariants.map(v => ({ id: v.id, label: v.name }));

  const handleCreateVariant = () => {
    const values = getValues();
    const newId = `variant-${Date.now()}`;
    const newVariant: TripVariant = {
      id: newId,
      name: `Copia de ${values.name || 'Plan'}`,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };
    addTripVariant(newVariant);
    setActiveGlobalVariantId(newId);
  };

  const onSubmit = (data: TripSettingsFormInputs) => {
    updateTripVariant({
      ...activeVariant,
      name: data.name,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
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
    <RAModal isOpen={true} onClose={onClose} className="md:w-[500px] p-0 overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-border-strong bg-nature-bg/30">
        <div className="flex items-center gap-2 text-nature-primary">
          <Calendar size={20} />
          <h2 className="text-xl font-sans font-bold">Ajustes del Viaje</h2>
        </div>
        <RAButton variant="icon" aria-label="Cerrar ajustes" onPress={onClose}>
          <X size={20} />
        </RAButton>
      </div>

      <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6">

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plan Actual</label>
          <div className="flex gap-2">
            <RASelect
              aria-label="Seleccionar plan"
              items={variantItems}
              value={activeGlobalVariantId}
              onChange={setActiveGlobalVariantId}
              className="flex-1"
              buttonClassName="p-3 text-sm"
            />
            <RAButton
              variant="secondary"
              onPress={handleCreateVariant}
              size="sm"
              className="bg-nature-mint/30 hover:bg-nature-mint/50 text-nature-primary border-none"
            >
              <Copy size={16} /> <span className="hidden sm:inline">Variante</span>
            </RAButton>
          </div>
        </div>

        <form id="tripSettingsForm" onSubmit={handleSubmit(onSubmit)} className="bg-bg-surface-elevated/50 border border-border-strong p-4 rounded-[24px] space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 ml-1">Nombre de la Variante</label>
            <input
              type="text"
              {...register('name')}
              className="w-full bg-bg-surface border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-text-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5 ml-1">Día de Inicio</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full bg-bg-surface border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5 ml-1">Día de Fin</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full bg-bg-surface border-0 shadow-sm rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-text-primary"
                min={startDateValue || undefined}
              />
            </div>
          </div>

          <p className="text-xs text-text-muted mt-2 ml-1">
            Si defines inicio y fin, el tablero generará automáticamente las columnas exactas de tu viaje.
          </p>
        </form>

        <div className="bg-bg-surface-elevated/50 border border-border-strong p-4 rounded-[24px] space-y-3">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 ml-1">Zonas / Ciudades a Visitar</label>
            <div className="w-full bg-bg-surface shadow-sm border border-transparent focus-within:border-nature-mint focus-within:ring-2 focus-within:ring-nature-primary/20 rounded-xl p-2.5 flex flex-wrap gap-2 min-h-[50px] items-center transition-all">
              {currentCities.map(city => (
                <span key={city} className="bg-nature-mint text-nature-primary text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  {city}
                  <RAButton variant="icon" aria-label={`Eliminar ${city}`} onPress={() => removeCity(city)} className="hover:text-red-500 bg-white/50 rounded-full p-0.5">
                    <X size={12} />
                  </RAButton>
                </span>
              ))}
              <input
                type="text"
                value={cityInputValue}
                onChange={(e) => setCityInputValue(e.target.value)}
                onKeyDown={handleCityKeyDown}
                className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-text-primary placeholder-text-muted"
                placeholder={currentCities.length === 0 ? "Ej. Tokio, Kioto... (Pulsa Enter)" : ""}
              />
            </div>
            <p className="text-xs text-text-muted mt-2 ml-1">
              Define aquí las zonas (ej. "Norte de Italia", "Milán"). Cuando añadas actividades, podrás seleccionarlas rápidamente de esta lista.
            </p>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-border-strong flex items-center justify-between bg-bg-surface">
        {activeGlobalVariantId !== 'default' ? (
          <RAButton variant="icon" aria-label="Eliminar variante" onPress={() => handleDelete(activeGlobalVariantId)} className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
            <Trash2 size={20} />
          </RAButton>
        ) : (
          <div />
        )}
        <RAButton
          variant="primary"
          onPress={() => handleSubmit(onSubmit)()}
          size="md"
        >
          Guardar y Aplicar
        </RAButton>
      </div>
    </RAModal>
  );
};
