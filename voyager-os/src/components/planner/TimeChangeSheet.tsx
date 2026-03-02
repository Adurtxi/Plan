import { useEffect } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { combineDayWithTime, extractTimeFromISO } from '../../utils/dateUtils';
import type { LocationItem } from '../../types';
import { useUpdateLocation } from '../../hooks/useTripData';

interface TimeChangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: (LocationItem & { suggestedDatetime?: string }) | null;
  baseDate: Date | null;
}

interface Inputs {
  newTime: string;
}

export const TimeChangeSheet = ({ isOpen, onClose, item, baseDate }: TimeChangeSheetProps) => {
  const { register, handleSubmit, reset } = useForm<Inputs>();
  const { mutateAsync: updateLocation } = useUpdateLocation();

  useEffect(() => {
    if (isOpen && item && item.suggestedDatetime) {
      reset({
        newTime: extractTimeFromISO(item.suggestedDatetime)
      });
    }
  }, [isOpen, item, reset]);

  const onSubmit = async (data: Inputs) => {
    if (!item || !baseDate) return;

    // Update the item with the new explicitly chosen time, keeping it pinned 
    const finalIso = combineDayWithTime(baseDate, data.newTime);
    await updateLocation({
      ...item,
      datetime: finalIso,
      isPinnedTime: true
    });

    onClose();
  };

  const handleUnpin = async () => {
    if (!item) return;

    // Remove the pin so it flows naturally
    await updateLocation({
      ...item,
      datetime: '',
      isPinnedTime: false
    });

    onClose();
  };

  if (!isOpen || !item) return null;

  const oldTimeStr = item.datetime ? extractTimeFromISO(item.datetime) : '--:--';
  const suggestedTimeStr = item.suggestedDatetime ? extractTimeFromISO(item.suggestedDatetime) : '--:--';

  return (
    <>
      <div className="fixed inset-0 bg-nature-primary/20 backdrop-blur-sm z-[100] transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-[110] transform transition-transform duration-300 flex flex-col translate-x-0">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle size={16} />
            </div>
            <h2 className="text-xl font-sans font-bold text-nature-primary">
              Desajuste de Horario
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-nature-primary transition-colors p-2 hover:bg-gray-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-gray-500">
            La actividad <strong>{item.title}</strong> tiene una hora fijada, pero las actividades anteriores han cambiado y ahora habría un hueco o solapamiento.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Hora Anterior (Fijada)</div>
              <div className="text-xl font-bold text-gray-700 font-mono">{oldTimeStr}</div>
            </div>
            <div className="bg-nature-mint/20 p-4 rounded-xl border border-nature-primary/20 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-nature-primary/40"></div>
              <div className="text-[10px] uppercase font-bold text-nature-primary/70 tracking-widest mb-1">Hora Sugerida</div>
              <div className="text-xl font-bold text-nature-primary font-mono">{suggestedTimeStr}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock size={14} /> Defina la nueva hora
              </label>
              <input
                type="time"
                {...register('newTime', { required: true })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-lg font-mono text-center focus:ring-2 focus:ring-nature-primary/20 focus:border-nature-primary outline-none transition-all text-nature-text"
              />
              <p className="text-xs text-gray-400 mt-2 text-center">Por defecto muestra la hora sugerida.</p>
            </div>
          </form>

          <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 mb-3 text-center">
              Si prefieres que esta actividad fluya automáticamente con las demás, puedes quitarle la fijación.
            </p>
            <button onClick={handleUnpin} className="w-full py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              Quitar fijación de hora
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit(onSubmit)}
            className="w-full bg-nature-primary text-white py-3.5 rounded-xl font-bold tracking-wide hover:bg-nature-accent transition-colors shadow-solid hover:translate-y-[2px] hover:shadow-none active:translate-y-[4px]"
          >
            Confirmar Nueva Hora
          </button>
        </div>
      </div>
    </>
  );
};
