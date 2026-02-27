import { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Edit2, CheckCircle2, AlertCircle, Clock, Lightbulb, Lock, GripVertical, MoreVertical, LogOut, ArrowRightCircle } from 'lucide-react';
import type { LocationItem } from '../../types';
import { CAT_ICONS } from '../../constants';
import { useAppStore } from '../../store';

export const CardVisual = memo(({
  item,
  onClick,
  onCardClick,
  isOverlay,
  isOver,
  dragListeners,
  dragAttributes,
  onRequestMove,
  isMovingMode,
  isMergeTarget
}: {
  item: LocationItem,
  onClick?: () => void,
  onCardClick?: () => void,
  isOverlay?: boolean,
  isOver?: boolean,
  dragListeners?: any,
  dragAttributes?: any,
  onRequestMove?: () => void,
  isMovingMode?: boolean,
  isMergeTarget?: boolean
}) => {
  const { showDialog, updateLocation, extractFromGroup } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);

  const formatDuration = (mins: number) => {
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + 'm' : ''}` : `${mins}m`;
  };

  const getStatusIcon = () => {
    switch (item.reservationStatus) {
      case 'booked': return <CheckCircle2 size={12} className="text-green-500" />;
      case 'pending': return <AlertCircle size={12} className="text-amber-500" />;
      case 'idea': return <Lightbulb size={12} className="text-blue-400" />;
      default: return null;
    }
  };

  const timeToFilter = item.derivedDatetime || item.datetime;
  const formattedTime = timeToFilter ? new Date(timeToFilter).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const displayPrice = item.newPrice?.amount
    ? `${item.newPrice.amount.toFixed(2)} ${item.newPrice.currency === 'EUR' ? '€' : item.newPrice.currency}`
    : (item.cost ? `${item.cost}€` : '-');

  const content = (
    <div onClick={onCardClick} className={`bento-card p-4 cursor-pointer relative group bg-white border ${item.priority === 'necessary' ? 'border-nature-primary/30 shadow-[0_4px_20px_-4px_rgba(45,90,39,0.15)] ring-1 ring-nature-primary/10' : 'border-gray-100'} ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''} ${isMergeTarget ? 'ring-2 ring-nature-primary animate-pulse scale-[1.03] shadow-xl border-nature-primary/50 bg-nature-mint/10' : isOver ? 'ring-2 ring-nature-accent bg-nature-mint/10 scale-[1.02] shadow-lg' : 'hover:border-gray-200'} ${isMovingMode ? 'opacity-40 pointer-events-none grayscale-[50%]' : ''} transition-all`}>
      {isMergeTarget && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nature-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-50 whitespace-nowrap animate-bounce">
          📦 Soltar para agrupar
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {dragListeners && !isMovingMode && (
            <div
              {...dragListeners}
              {...dragAttributes}
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-nature-primary p-1 -ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>
          )}
          <span className="text-xl text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100">{CAT_ICONS[item.cat]}</span>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-nature-text truncate max-w-[120px]">{item.title || item.notes.split("\n")[0] || "Ubicación"}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                {formattedTime ? <span className="flex items-center gap-1"><Clock size={10} /> {formattedTime} {item.isPinnedTime && <Lock size={8} className="text-nature-primary opacity-50" />}</span> : item.slot || "S/H"}
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
        {item.durationMinutes ? (
          <button onClick={(e) => {
            e.stopPropagation();
            showDialog({
              type: 'prompt',
              title: 'Editar Duración',
              message: `Nueva duración para ${item.title || item.notes.split("\n")[0] || 'esta actividad'} (en minutos):`,
              inputPlaceholder: 'Ej. 60, 90, 120...',
              confirmText: 'Guardar',
              onConfirm: (val) => {
                const mins = parseInt(val || '0', 10);
                if (!isNaN(mins) && mins >= 0) updateLocation({ ...item, durationMinutes: mins });
              }
            });
          }} className="text-[10px] font-bold px-2 py-1 rounded-md bg-nature-mint/30 hover:bg-nature-mint/60 border border-nature-primary/10 text-nature-primary flex items-center gap-1 transition-colors z-20" title="Click para editar duración">
            <Clock size={10} /> {formatDuration(item.durationMinutes)}
          </button>
        ) : (
          <button onClick={(e) => {
            e.stopPropagation();
            showDialog({
              type: 'prompt',
              title: 'Añadir Duración',
              message: `Duración para ${item.title || item.notes.split("\n")[0] || 'esta actividad'} (en minutos):`,
              inputPlaceholder: 'Ej. 60...',
              confirmText: 'Guardar',
              onConfirm: (val) => {
                const mins = parseInt(val || '0', 10);
                if (!isNaN(mins) && mins >= 0) updateLocation({ ...item, durationMinutes: mins });
              }
            });
          }} className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-200 text-gray-400 flex items-center gap-1 transition-colors z-20 opacity-0 group-hover:opacity-100">
            + <Clock size={10} /> Añadir Duración
          </button>
        )}
      </div>

      {(item.priority === 'necessary' && item.reservationStatus === 'pending') && (
        <div className="mt-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1.5 rounded uppercase tracking-widest flex items-center gap-1 w-fit">
          <AlertCircle size={10} /> Urgente Reservar
        </div>
      )}

      {/* Action Menu Trigger */}
      <div className="absolute -top-3 -right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-30 w-auto">
        {!isMovingMode && onClick && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              onBlur={() => setTimeout(() => setShowMenu(false), 200)}
              className="text-gray-500 bg-white shadow-floating border border-gray-100 hover:text-nature-primary p-2 rounded-full w-8 h-8 flex items-center justify-center"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={() => { onClick(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <Edit2 size={14} /> Editar
                </button>
                {onRequestMove && (
                  <button onClick={() => { onRequestMove(); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                    <ArrowRightCircle size={14} /> Mover a...
                  </button>
                )}
                {item.groupId && (
                  <button onClick={() => { extractFromGroup(item.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600">
                    <LogOut size={14} /> Sacar del Grupo
                  </button>
                )}
              </div>
            )}
          </div>
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

export const SortableCard = memo(({ item, onClick, onCardClick, onRequestMove, isMovingMode, isMergeTarget }: { item: LocationItem, onClick: () => void, onCardClick?: () => void, onRequestMove?: () => void, isMovingMode?: boolean, isMergeTarget?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: item.id.toString(), disabled: isMovingMode });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const isFreeTime = item.cat === 'free';
  const formatDuration = (mins: number) => mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + 'm' : ''}` : `${mins}m`;

  return (
    <div ref={setNodeRef} style={style} className="outline-none relative">
      {isFreeTime ? (
        <div onClick={onCardClick} className={`my-1 group hover:bg-gray-100 bg-gray-50/50 border-y border-dashed border-gray-300 py-3 px-4 flex items-center justify-between transition-colors ${isDragging ? 'opacity-50' : ''} ${isMovingMode ? 'opacity-40 grayscale' : ''}`}>
          <div className="flex gap-2 items-center text-gray-500">
            {!isMovingMode && (
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:text-nature-primary p-1 -ml-2" onClick={e => e.stopPropagation()}>
                <GripVertical size={14} className="opacity-50" />
              </div>
            )}
            <span className="text-xl opacity-80">☕</span>
            <span className="text-xs font-bold uppercase tracking-widest">{item.title || 'Tiempo Libre'}</span>

            {(() => {
              const displayTime = item.derivedDatetime || item.datetime;
              if (displayTime && item.durationMinutes) {
                return (
                  <span className="ml-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {item.isPinnedTime && <Lock size={8} className="text-nature-primary opacity-50" />}
                    {" - "}
                    {(() => {
                      const end = new Date(displayTime);
                      end.setMinutes(end.getMinutes() + item.durationMinutes);
                      return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </span>
                );
              } else if (item.durationMinutes) {
                return (
                  <span className="ml-2 text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-500 flex items-center gap-1">
                    <Clock size={10} /> {formatDuration(item.durationMinutes)}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          {!isMovingMode && (
            <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-nature-accent transition-colors p-1">
              <Edit2 size={12} />
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-full block">
          <CardVisual
            item={item}
            onClick={onClick}
            onCardClick={onCardClick}
            isOver={isOver && !isDragging}
            dragListeners={listeners}
            dragAttributes={attributes}
            onRequestMove={onRequestMove}
            isMovingMode={isMovingMode}
            isMergeTarget={isMergeTarget}
          />
        </div>
      )}
    </div>
  );
});
SortableCard.displayName = 'SortableCard';