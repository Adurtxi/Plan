import { useEffect } from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { combineDayWithTime, extractTimeFromISO } from '../../utils/dateUtils';
import type { LocationItem } from '../../types';
import { useUpdateLocation } from '../../hooks/useTripData';
import { RASheet } from '../ui/RASheet';
import { RAButton } from '../ui/RAButton';

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

    await updateLocation({
      ...item,
      datetime: '',
      isPinnedTime: false
    });

    onClose();
  };

  if (!item) return null;

  const oldTimeStr = item.datetime ? extractTimeFromISO(item.datetime) : '--:--';
  const suggestedTimeStr = item.suggestedDatetime ? extractTimeFromISO(item.suggestedDatetime) : '--:--';

  return (
    <RASheet isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center p-6 pb-4 border-b border-border-strong">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle size={16} />
          </div>
          <h2 className="text-xl font-sans font-bold text-nature-primary">
            Desajuste de Horario
          </h2>
        </div>
        <RAButton variant="icon" aria-label="Cerrar" onPress={onClose}>
          <X size={20} />
        </RAButton>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <p className="text-sm text-text-secondary">
          La actividad <strong>{item.title}</strong> tiene una hora fijada, pero las actividades anteriores han cambiado y ahora habría un hueco o solapamiento.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-surface-elevated p-4 rounded-xl border border-border-strong text-center">
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">Hora Anterior (Fijada)</div>
            <div className="text-xl font-bold text-text-primary font-mono">{oldTimeStr}</div>
          </div>
          <div className="bg-nature-mint/20 p-4 rounded-xl border border-nature-primary/20 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-nature-primary/40"></div>
            <div className="text-[10px] uppercase font-bold text-nature-primary/70 tracking-widest mb-1">Hora Sugerida</div>
            <div className="text-xl font-bold text-nature-primary font-mono">{suggestedTimeStr}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Clock size={14} /> Defina la nueva hora
            </label>
            <input
              type="time"
              {...register('newTime', { required: true })}
              className="w-full bg-bg-surface-elevated border border-border-strong rounded-xl p-4 text-lg font-mono text-center focus:ring-2 focus:ring-nature-primary/20 focus:border-nature-primary outline-none transition-all text-text-primary"
            />
            <p className="text-xs text-text-muted mt-2 text-center">Por defecto muestra la hora sugerida.</p>
          </div>
        </form>

        <div className="bg-bg-surface-elevated p-4 rounded-xl border border-dashed border-border-strong">
          <p className="text-xs text-text-secondary mb-3 text-center">
            Si prefieres que esta actividad fluya automáticamente con las demás, puedes quitarle la fijación.
          </p>
          <RAButton variant="secondary" onPress={handleUnpin} className="w-full" size="sm">
            Quitar fijación de hora
          </RAButton>
        </div>
      </div>

      <div className="p-6 border-t border-border-strong bg-bg-surface">
        <RAButton variant="primary" onPress={() => handleSubmit(onSubmit)()} className="w-full" size="lg">
          Confirmar Nueva Hora
        </RAButton>
      </div>
    </RASheet>
  );
};
