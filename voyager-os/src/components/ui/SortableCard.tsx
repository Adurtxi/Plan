import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Edit2, CheckCircle2, AlertCircle, Clock, Lightbulb } from 'lucide-react';
import type { LocationItem } from '../../types';
import { CAT_ICONS } from '../../constants';

export const CardVisual = memo(({ item, onClick, onCardClick, onMoveClick, onGroupToggle, isMoving, isOverlay }: { item: LocationItem, onClick?: () => void, onCardClick?: () => void, onMoveClick?: () => void, onGroupToggle?: () => void, isMoving?: boolean, isOverlay?: boolean }) => {
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
    <div onClick={onCardClick} className={`bento-card p-4 cursor-grab active:cursor-grabbing relative group bg-white border ${item.priority === 'necessary' ? 'border-nature-primary/30 shadow-[0_4px_20px_-4px_rgba(45,90,39,0.15)] ring-1 ring-nature-primary/10' : 'border-gray-100'} ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''} ${isMoving ? 'ring-2 ring-nature-accent shadow-lg scale-[1.02]' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">{CAT_ICONS[item.cat]}</span>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-nature-text truncate max-w-[120px]">{item.title || item.notes.split("\n")[0] || "Ubicación"}</h3>
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

      <div className="flex flex-wrap gap-2 mt-3 items-center">
        {item.durationMinutes && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-nature-mint/30 text-nature-primary flex items-center gap-1">
            <Clock size={10} /> {item.durationMinutes >= 60 ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60 ? (item.durationMinutes % 60) + 'm' : ''}` : `${item.durationMinutes}m`}
          </span>
        )}
      </div>
      {(item.priority === 'necessary' && item.reservationStatus === 'pending') && (
        <div className="mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1.5 rounded uppercase tracking-widest flex items-center gap-1 w-fit">
          <AlertCircle size={10} /> Urgente Reservar
        </div>
      )}
      <div className="absolute -top-3 -right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10 w-auto">
        {onMoveClick && (
          <button onClick={(e) => { e.stopPropagation(); onMoveClick(); }} className={`text-gray-500 shadow-floating border border-gray-100 hover:text-nature-primary hover:scale-110 p-2 rounded-full w-8 h-8 flex items-center justify-center ${isMoving ? 'bg-nature-accent text-white' : 'bg-white'}`} title="Mover">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
          </button>
        )}
        {onGroupToggle && (
          <button onClick={(e) => { e.stopPropagation(); onGroupToggle(); }} className="text-gray-500 bg-white shadow-floating border border-gray-100 hover:text-nature-primary hover:scale-110 p-2 rounded-full w-8 h-8 flex items-center justify-center" title="Unir al siguiente">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><path d="M13 13v9l5-5" /></svg>
          </button>
        )}
        {onClick && (
          <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-gray-500 bg-white shadow-floating border border-gray-100 hover:text-nature-primary hover:scale-110 p-2 rounded-full w-8 h-8 flex items-center justify-center" title="Editar">
            <Edit2 size={12} />
          </button>
        )}
      </div>
    </div>
  );

  return isOverlay ? content : (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      {content}
    </motion.div>
  );
});
CardVisual.displayName = 'CardVisual';

export const SortableCard = memo(({ item, onClick, onCardClick, onMoveClick, onGroupToggle, isMoving }: { item: LocationItem, onClick: () => void, onCardClick?: () => void, onMoveClick?: () => void, onGroupToggle?: () => void, isMoving?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id.toString() });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const isFreeTime = item.cat === 'free';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="outline-none relative">
      {isFreeTime ? (
        <div onClick={onCardClick} className={`my-1 group cursor-grab active:cursor-grabbing hover:bg-gray-100 bg-gray-50/50 border-y border-dashed border-gray-300 py-3 px-4 flex items-center justify-between transition-colors ${isDragging ? 'opacity-50' : ''}`}>
          <div className="flex gap-2 items-center text-gray-500">
            <span className="text-xl opacity-80">☕</span>
            <span className="text-xs font-bold uppercase tracking-widest">{item.title || 'Tiempo Libre'}</span>

            {item.datetime && item.durationMinutes ? (
              <span className="ml-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(item.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {(() => {
                  const end = new Date(item.datetime);
                  end.setMinutes(end.getMinutes() + item.durationMinutes);
                  return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                })()}
              </span>
            ) : item.durationMinutes ? (
              <span className="ml-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 flex items-center gap-1">
                <Clock size={10} />
                {item.durationMinutes >= 60 ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60 ? (item.durationMinutes % 60) + 'm' : ''}` : `${item.durationMinutes}m`}
              </span>
            ) : null}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-nature-accent transition-colors p-1">
            <Edit2 size={12} />
          </button>
        </div>
      ) : (
        <CardVisual item={item} onClick={onClick} onCardClick={onCardClick} onMoveClick={onMoveClick} onGroupToggle={onGroupToggle} isMoving={isMoving} />
      )}
    </div>
  );
});
SortableCard.displayName = 'SortableCard';
