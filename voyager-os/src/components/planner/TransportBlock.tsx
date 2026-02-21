import { memo } from 'react';
import { Navigation2, Car, Train, Map } from 'lucide-react';

interface TransportBlockProps {
  mode: 'walk' | 'car' | 'transit' | 'flight';
  distance?: number;
  duration?: number;
  cost?: number;
  onClick?: () => void;
}

export const TransportBlock = memo(({ mode, duration, onClick }: TransportBlockProps) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center -my-2 z-10 relative cursor-pointer group"
    >
      <div className="absolute left-1/2 -top-4 bottom-0 w-[2px] bg-gray-200 group-hover:bg-nature-primary/50 transition-colors -z-10" />
      <div className="bg-white border text-gray-500 border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm group-hover:border-nature-primary group-hover:text-nature-primary group-hover:shadow-md transition-all">
        {mode === 'walk' && <Map size={10} />}
        {mode === 'car' && <Car size={10} />}
        {mode === 'transit' && <Train size={10} />}
        {mode === 'flight' && <Navigation2 size={10} className="rotate-45" />}
        {duration ? `${duration} min` : 'Automático'}
      </div>
    </div>
  );
});

TransportBlock.displayName = 'TransportBlock';
