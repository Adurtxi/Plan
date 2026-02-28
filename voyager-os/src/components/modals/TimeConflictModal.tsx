import { Clock, SkipForward, ArrowDown } from 'lucide-react';

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
    <>
      <div className="fixed inset-0 bg-nature-primary/40 backdrop-blur-sm z-[200] transition-opacity" onClick={() => onResolve('cancel')} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[420px] bg-white rounded-[32px] shadow-2xl z-[210] flex flex-col overflow-hidden animate-scale-in">

        <div className="p-6 text-center space-y-4 border-b border-gray-100 bg-nature-bg/30">
          <div className="w-16 h-16 bg-white rounded-full mx-auto shadow-sm flex items-center justify-center text-nature-primary border border-gray-100">
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-xl font-sans font-bold text-nature-primary">Asignación de Hora</h2>
            <p className="text-sm text-gray-500 mt-2 px-2">
              Has colocado <strong className="text-nature-text font-bold">"{activeTitle}"</strong> detrás de <strong className="text-nature-text font-bold">"{overTitle}"</strong> (que es a las {formattedOverTime}).
            </p>
          </div>
        </div>

        <div className="p-4 space-y-2 bg-gray-50/50">
          <button
            onClick={() => onResolve('inherit', calculatedDatetimeStr)}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-nature-primary hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="bg-nature-mint/30 p-2.5 rounded-xl text-nature-primary group-hover:scale-110 transition-transform">
              <SkipForward size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-nature-text">Continuar horario ({formattedCalcTime})</div>
              <div className="text-xs text-gray-400 mt-0.5">Asigna la hora calculando la duración del anterior</div>
            </div>
          </button>

          <button
            onClick={() => onResolve('keep-unscheduled')}
            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-nature-primary hover:shadow-md transition-all flex items-center gap-4 group text-left"
          >
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-400 group-hover:text-nature-primary group-hover:bg-nature-mint/30 group-hover:scale-110 transition-all">
              <ArrowDown size={20} />
            </div>
            <div>
              <div className="font-bold text-sm text-gray-600 group-hover:text-nature-text">Dejar sin hora (Muteado)</div>
              <div className="text-xs text-gray-400 mt-0.5">Se quedará detrás visualmente, pero sin hora real</div>
            </div>
          </button>
        </div>

        <div className="p-4 text-center">
          <button
            onClick={() => onResolve('cancel')}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest px-4 py-2"
          >
            Cancelar Movimiento
          </button>
        </div>
      </div>
    </>
  );
};
