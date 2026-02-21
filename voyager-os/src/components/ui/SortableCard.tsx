import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Edit2, CheckCircle2, AlertCircle, Clock, Lightbulb } from 'lucide-react';
import type { LocationItem } from '../../types';
import { CAT_ICONS } from '../../constants';

export const CardVisual = memo(({ item, onClick, isOverlay }: { item: LocationItem, onClick?: () => void, isOverlay?: boolean }) => {
  const getStatusIcon = () => {
    switch (item.reservationStatus) {
      case 'booked': return <CheckCircle2 size={12} className="text-green-500" />;
      case 'pending': return <AlertCircle size={12} className="text-amber-500" />;
      case 'idea': return <Lightbulb size={12} className="text-blue-400" />;
      default: return null;
    }
  };

  const formattedTime = item.datetime ? new Date(item.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const displayPrice = item.newPrice?.amount
    ? `${item.newPrice.amount.toFixed(2)} ${item.newPrice.currency === 'EUR' ? '€' : item.newPrice.currency}`
    : (item.cost ? `${item.cost}€` : '-');

  const content = (
    <div className={`bento-card p-4 cursor-grab active:cursor-grabbing relative group bg-white border ${item.priority === 'necessary' ? 'border-nature-primary/30 shadow-[0_4px_20px_-4px_rgba(45,90,39,0.15)] ring-1 ring-nature-primary/10' : 'border-gray-100'} ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">{CAT_ICONS[item.cat]}</span>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-nature-text truncate max-w-[120px]">{item.notes.split("\n")[0] || "Ubicación Mapeada"}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                {formattedTime ? <span className="flex items-center gap-1"><Clock size={10} /> {formattedTime}</span> : item.slot || "S/H"}
              </span>
              {getStatusIcon()}
            </div>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <span className="text-[10px] font-bold tracking-wider text-nature-primary bg-nature-mint/30 border border-nature-primary/20 px-2 py-1 rounded-lg">
            {displayPrice}
          </span>
          {item.images?.length > 0 && <img src={item.images[0].data} className="w-10 h-10 rounded-xl object-cover ml-3 border border-gray-100 shadow-sm" alt="thumb" />}
        </div>
      </div>
      {(item.priority === 'necessary' && item.reservationStatus === 'pending') && (
        <div className="mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1.5 rounded uppercase tracking-widest flex items-center gap-1 w-fit">
          <AlertCircle size={10} /> Urgente Reservar
        </div>
      )}
      {onClick && (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="absolute -top-3 -right-3 text-gray-500 bg-white shadow-floating border border-gray-100 hover:text-nature-primary hover:scale-110 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all p-2 rounded-full w-8 h-8 flex items-center justify-center z-10">
          <Edit2 size={12} />
        </button>
      )}
    </div>
  );

  return isOverlay ? content : (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      {content}
    </motion.div>
  );
});
CardVisual.displayName = 'CardVisual';

export const SortableCard = memo(({ item, onClick }: { item: LocationItem, onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id.toString() });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none relative">
      <CardVisual item={item} onClick={onClick} />
    </div>
  );
});
SortableCard.displayName = 'SortableCard';
