import { useEffect } from 'react';
import { X, Clock, Coffee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { extractTimeFromISO, combineDayWithTime } from '../../utils/dateUtils';
import { useAppStore, computeDateForDay } from '../../store';
import { useLocations, useAddLocation, useUpdateLocation, useTripVariants } from '../../hooks/useTripData';

interface FreeTimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formId: number | null;
  day: string;
  variantId: string;
  onSave: () => void;
}

interface FreeTimeFormInputs {
  title: string;
  datetime: string;
  durHours: string | number;
  durMins: string | number;
}

export const FreeTimeSheet = ({ isOpen, onClose, formId, day, variantId, onSave }: FreeTimeSheetProps) => {
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const { activeGlobalVariantId } = useAppStore();
  const { mutateAsync: addLocation } = useAddLocation();
  const { mutateAsync: updateLocation } = useUpdateLocation();

  const { register, handleSubmit, reset } = useForm<FreeTimeFormInputs>({
    defaultValues: {
      title: 'Tiempo Libre',
      datetime: '',
      durHours: '',
      durMins: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (formId) {
        const item = locations.find(l => l.id === formId);
        if (item) {
          reset({
            title: item.title || 'Tiempo Libre',
            datetime: extractTimeFromISO(item.datetime),
            durHours: item.durationMinutes ? Math.floor(item.durationMinutes / 60) : '',
            durMins: item.durationMinutes ? item.durationMinutes % 60 : ''
          });
        }
      } else {
        reset({
          title: 'Tiempo Libre',
          datetime: '',
          durHours: '',
          durMins: ''
        });
      }
    }
  }, [isOpen, formId, locations, reset]);

  const onSubmit = async (data: FreeTimeFormInputs) => {
    const totalMins = (Number(data.durHours || 0) * 60) + Number(data.durMins || 0);
    const finalDuration = totalMins > 0 ? totalMins : undefined;

    let finalDatetime = undefined;
    let isPinnedTime = false;
    if (data.datetime) {
      const targetDate = computeDateForDay(day, tripVariants, activeGlobalVariantId);
      if (targetDate) {
        finalDatetime = combineDayWithTime(targetDate, data.datetime);
        isPinnedTime = true;
      }
    }

    const baseData = {
      title: data.title,
      cat: 'free' as const,
      priority: 'optional' as const,
      cost: '0',
      link: '',
      notes: '',
      images: [],
      reservationStatus: 'idea' as const,
      datetime: finalDatetime,
      isPinnedTime,
      durationMinutes: finalDuration,
      attachments: [],
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
            <h2 className="text-xl font-sans font-bold text-nature-primary">
              {formId ? 'Editar Tiempo Libre' : 'Añadir Tiempo Libre'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-nature-primary transition-colors p-2 hover:bg-gray-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nombre del Hueco</label>
              <input
                type="text"
                {...register('title', { required: true })}
                placeholder="Ej. Siesta, Descanso, Comida libre..."
                className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Hora (Opcional)</label>
                <input
                  type="time"
                  {...register('datetime')}
                  className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm focus:ring-2 focus:ring-nature-primary/20 text-nature-text font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                  <Clock size={12} /> Duración
                </label>
                <div className="flex bg-gray-50 border-0 focus-within:ring-2 focus-within:ring-nature-primary/20 rounded-xl overflow-hidden transition-all h-[44px]">
                  <input type="number" min="0" {...register('durHours')} className="w-1/2 bg-transparent px-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="H" />
                  <div className="w-px bg-gray-200 my-2"></div>
                  <input type="number" min="0" max="59" step="5" {...register('durMins')} className="w-1/2 bg-transparent px-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="Min" />
                </div>
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
            onClick={handleSubmit(onSubmit)}
            className="w-full bg-nature-primary text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-nature-accent transition-colors shadow-solid hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px]"
          >
            {formId ? 'Guardar Cambios' : 'Añadir al Plan'}
          </button>
        </div>
      </div>
    </>
  );
};
