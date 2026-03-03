import { Clock, SkipForward, ArrowDown } from 'lucide-react';
import { RAModal } from '../ui/RAModal';
import { RAButton } from '../ui/RAButton';

export type TimeConflictAction = 'inherit' | 'keep-unscheduled' | 'cancel';

interface TimeConflictModalProps {
  isOpen: boolean;
  activeTitle: string;
  overTitle: string;
  overDatetime: string;
  overDuration: number;
  onResolve: (action: TimeConflictAction, calculatedDatetime?: string) => void;
}

export const TimeConflictModal = ({ isOpen, activeTitle, overTitle, overDatetime, overDuration, onResolve }: TimeConflictModalProps) => {
  if (!isOpen) return null;

  const overDateObj = new Date(overDatetime);
  const calculatedDateObj = new Date(overDateObj.getTime() + overDuration * 60000);

  const formattedOverTime = overDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedCalcTime = calculatedDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const calculatedDatetimeStr = calculatedDateObj.toISOString();

  return (
    <RAModal isOpen={true} onClose={() => onResolve('cancel')} className="md:w-[420px] p-0 overflow-hidden">
      <div className="p-6 text-center space-y-4 border-b border-border-strong bg-nature-bg/30">
        <div className="w-16 h-16 bg-bg-surface rounded-full mx-auto shadow-sm flex items-center justify-center text-nature-primary border border-border-strong">
          <Clock size={32} />
        </div>
        <div>
          <h2 className="text-xl font-sans font-bold text-nature-primary">Asignación de Hora</h2>
          <p className="text-sm text-text-secondary mt-2 px-2">
            Has colocado <strong className="text-text-primary font-bold">"{activeTitle}"</strong> detrás de <strong className="text-text-primary font-bold">"{overTitle}"</strong> (que es a las {formattedOverTime}).
          </p>
        </div>
      </div>

      <div className="p-4 space-y-2 bg-bg-surface-elevated/50">
        <RAButton
          variant="ghost"
          onPress={() => onResolve('inherit', calculatedDatetimeStr)}
          className="w-full bg-bg-surface p-4 rounded-2xl shadow-sm border border-border-strong hover:border-nature-primary hover:shadow-md transition-all flex items-center gap-4 group text-left"
        >
          <div className="bg-nature-mint/30 p-2.5 rounded-xl text-nature-primary group-hover:scale-110 transition-transform">
            <SkipForward size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-text-primary">Continuar horario ({formattedCalcTime})</div>
            <div className="text-xs text-text-muted mt-0.5">Asigna la hora calculando la duración del anterior</div>
          </div>
        </RAButton>

        <RAButton
          variant="ghost"
          onPress={() => onResolve('keep-unscheduled')}
          className="w-full bg-bg-surface p-4 rounded-2xl shadow-sm border border-border-strong hover:border-nature-primary hover:shadow-md transition-all flex items-center gap-4 group text-left"
        >
          <div className="bg-bg-surface-elevated p-2.5 rounded-xl text-text-muted group-hover:text-nature-primary group-hover:bg-nature-mint/30 group-hover:scale-110 transition-all">
            <ArrowDown size={20} />
          </div>
          <div>
            <div className="font-bold text-sm text-text-secondary group-hover:text-text-primary">Dejar sin hora (Muteado)</div>
            <div className="text-xs text-text-muted mt-0.5">Se quedará detrás visualmente, pero sin hora real</div>
          </div>
        </RAButton>
      </div>

      <div className="p-4 text-center">
        <RAButton variant="ghost" onPress={() => onResolve('cancel')} className="text-xs text-text-muted uppercase tracking-widest" size="sm">
          Cancelar Movimiento
        </RAButton>
      </div>
    </RAModal>
  );
};
