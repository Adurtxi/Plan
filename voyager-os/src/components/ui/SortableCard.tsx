import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Lightbulb, Lock, GripVertical, Plus, AlertTriangle } from 'lucide-react';
import type { LocationItem } from '../../types';
import { CAT_ICONS, CAT_LABELS, isTransportCat } from '../../constants';
import { useAppStore } from '../../store';
import { useUpdateLocation } from '../../hooks/useTripData';
import { CardActions } from './CardActions';

const formatDuration = (mins: number) => {
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? (mins % 60) + 'm' : ''}` : `${mins}m`;
};

const formatDateTimeObj = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { day: '2-digit', month: 'short' }).replace('.', ''),
  };
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'booked': return <CheckCircle2 size={12} className="text-green-500" />;
    case 'pending': return <AlertCircle size={12} className="text-amber-500" />;
    case 'idea': return <Lightbulb size={12} className="text-blue-400" />;
    default: return null;
  }
};

export const CardVisual = memo(({
  item,
  onCardClick,
  isOverlay,
  isOver,
  dragListeners,
  dragAttributes,
  onRequestMove,
  isMovingMode,
  isMergeTarget,
  isSelected,
  onToggleSelect,
  onTimeConflict
}: {
  item: LocationItem,
  onCardClick?: () => void,
  isOverlay?: boolean,
  isOver?: boolean,
  dragListeners?: any,
  dragAttributes?: any,
  onRequestMove?: () => void,
  isMovingMode?: boolean,
  isMergeTarget?: boolean,
  isSelected?: boolean,
  onToggleSelect?: (e: React.MouseEvent) => void,
  onTimeConflict?: () => void
}) => {
  const { showDialog } = useAppStore();
  const { mutateAsync: updateLocation } = useUpdateLocation();

  const timeToFilter = item.derivedDatetime || item.datetime;
  const formattedTime = timeToFilter ? new Date(timeToFilter).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const displayPrice = item.newPrice?.amount
    ? `${item.newPrice.amount.toFixed(2)} ${item.newPrice.currency === 'EUR' ? '€' : item.newPrice.currency}`
    : (item.cost && parseFloat(item.cost) > 0 ? `${item.cost}€` : null);

  const handleEditDuration = (e: React.MouseEvent) => {
    e.stopPropagation();
    showDialog({
      type: 'prompt',
      title: item.durationMinutes ? 'Editar Duración' : 'Añadir Duración',
      message: `Introduce los minutos para ${item.title || 'esta actividad'}:`,
      inputPlaceholder: 'Ej. 60, 90, 120...',
      confirmText: 'Guardar',
      onConfirm: (val) => {
        const mins = parseInt(val || '0', 10);
        if (!isNaN(mins) && mins >= 0) updateLocation({ ...item, durationMinutes: mins });
      }
    });
  };

  const content = (
    <div onClick={onCardClick} className={`
      relative group cursor-pointer overflow-hidden
      bg-bg-surface rounded-3xl border transition-all duration-300
      ${item.priority === 'necessary' ? 'border-nature-primary/20 shadow-soft' : 'border-border-subtle shadow-sm hover:shadow-md'}
      ${isOverlay ? 'shadow-2xl scale-105 rotate-2' : ''}
      ${isMergeTarget ? 'ring-2 ring-nature-primary bg-nature-mint/10 scale-[1.03]' : ''}
      ${isOver ? 'ring-2 ring-nature-accent bg-nature-mint/5 scale-[1.02]' : ''}
      ${isSelected ? 'ring-2 ring-nature-primary bg-nature-mint/5 border-nature-primary/50' : ''}
      ${isMovingMode ? 'opacity-50 grayscale-[40%] pointer-events-none' : ''}
    `}>
      <div className="flex items-stretch min-h-[5rem]">
        {/* DRAG HANDLE & SELECTION */}
        <div className={`flex flex-col items-center justify-center p-1.5 shrink-0 w-8 border-r border-border-subtle bg-bg-surface-elevated/50 ${(dragListeners && !isMovingMode) ? 'touch-none' : ''}`}>
          {dragListeners && !isMovingMode && (
            <div {...dragListeners} {...dragAttributes} className="cursor-grab active:cursor-grabbing text-text-muted hover:text-nature-primary p-2 w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
              <GripVertical size={16} />
            </div>
          )}
          {onToggleSelect && (
            <div onClick={onToggleSelect} className="mt-auto mb-2 flex items-center justify-center w-full">
              {isSelected ? <CheckCircle2 size={16} className="text-nature-primary" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-border-strong" />}
            </div>
          )}
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 p-3 md:p-4 flex flex-col justify-center min-w-0">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Metadata Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm bg-bg-surface-elevated p-1.5 rounded-lg border border-border-subtle text-text-secondary">{CAT_ICONS[item.cat] || '📍'}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted truncate">
                  {CAT_LABELS[item.cat] || 'Actividad'}
                </span>
                {getStatusIcon(item.reservationStatus)}
              </div>

              {/* Title */}
              <h3 className="text-[15px] md:text-base font-black text-text-primary leading-tight truncate mb-2">
                {item.title || item.notes?.split('\n')[0] || "Ubicación Sin Nombre"}
              </h3>

              {/* Chips Row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                {(isTransportCat(item.cat) || item.cat.startsWith('hotel')) ? (() => {
                  const startObj = timeToFilter ? formatDateTimeObj(timeToFilter) : null;
                  const endObj = item.checkOutDatetime ? formatDateTimeObj(item.checkOutDatetime) : null;

                  return (
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black text-nature-primary bg-nature-mint/20 px-2.5 py-1 rounded-md border border-nature-primary/20">
                      <Clock size={12} className="text-nature-primary/70 shrink-0" />
                      <span className="flex items-center flex-wrap gap-x-1 gap-y-0.5 leading-tight">
                        {startObj ? <span className="whitespace-nowrap">{startObj.time} <span className="text-[9px] opacity-70">({startObj.date})</span></span> : '?'}
                        {endObj && (
                          <>
                            <span className="text-nature-primary/50 mx-0.5">→</span>
                            <span className="whitespace-nowrap">{endObj.time} <span className="text-[9px] opacity-70">({endObj.date})</span></span>
                          </>
                        )}
                        {(item.isPinnedTime) && <Lock size={10} className="text-nature-primary opacity-50 ml-0.5 shrink-0" />}
                      </span>
                      {onTimeConflict && (
                        <button onClick={(e) => { e.stopPropagation(); onTimeConflict(); }} className="ml-1 p-0.5 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-md transition-colors" title="Desajuste de Horario">
                          <AlertTriangle size={12} />
                        </button>
                      )}
                    </div>
                  );
                })() : formattedTime ? (
                  <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-text-secondary bg-bg-surface-elevated px-2 py-1 rounded-md border border-border-subtle">
                    <Clock size={12} className="text-nature-primary/70" />
                    <span className="flex items-center gap-0.5">
                      {formattedTime}
                      {item.isPinnedTime && <Lock size={10} className="text-nature-primary opacity-50" />}
                      {onTimeConflict && (
                        <button onClick={(e) => { e.stopPropagation(); onTimeConflict(); }} className="ml-0.5 p-0.5 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-md transition-colors" title="Desajuste de Horario">
                          <AlertTriangle size={12} />
                        </button>
                      )}
                    </span>
                  </div>
                ) : null}

                {item.durationMinutes ? (
                  <button onClick={handleEditDuration} className="text-[10px] font-bold px-2 py-1 rounded-md bg-nature-mint/30 hover:bg-nature-mint/60 border border-nature-primary/10 text-nature-primary transition-colors flex items-center z-20">
                    {formatDuration(item.durationMinutes)}
                  </button>
                ) : (
                  <button onClick={handleEditDuration} className="text-[10px] font-bold px-2 py-1 rounded-md bg-bg-surface-elevated hover:bg-border-subtle border border-dashed border-border-strong text-text-muted transition-colors opacity-0 group-hover:opacity-100 flex items-center z-20">
                    <Plus size={10} /> Duración
                  </button>
                )}

                {displayPrice && (
                  <span className="text-[10px] font-black tracking-wider text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-2 py-1 rounded-md">
                    {displayPrice}
                  </span>
                )}
              </div>

              {/* Urgency Badge */}
              {(item.priority === 'necessary' && item.reservationStatus === 'pending') && (
                <div className="mt-2 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded flex items-center gap-1 w-fit border border-amber-100 dark:border-amber-800">
                  <AlertCircle size={10} /> Urgente Reservar
                </div>
              )}
            </div>

            {/* Thumbnail */}
            {item.images?.length > 0 && (
              <div className="shrink-0 ml-1">
                <img src={item.images[0].data} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm border border-border-subtle" alt="thumb" />
              </div>
            )}
          </div>
        </div>

        {/* Action Menu Hover */}
        {!isMovingMode && (
          <CardActions
            item={item}
            onRequestMove={onRequestMove}
            className="absolute top-2 right-2 z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      {/* Grouping Highlight */}
      {isMergeTarget && (
        <div className="absolute inset-0 border-2 border-nature-primary rounded-3xl pointer-events-none flex items-start justify-center">
          <div className="bg-nature-primary text-white text-[10px] font-bold px-3 py-1 rounded-b-full shadow-lg whitespace-nowrap animate-bounce">
            📦 Soltar para agrupar
          </div>
        </div>
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

// -----------------------------------------
// FREE TIME CARD (Minimal)
// -----------------------------------------
const FreeTimeCard = memo(({ item, isDragging, isMovingMode, attributes, listeners, onCardClick, onRequestMove }: any) => {
  const displayTime = item.derivedDatetime || item.datetime;

  return (
    <div onClick={onCardClick} className={`
      my-2 group relative overflow-hidden
      bg-bg-surface-elevated/80 hover:bg-border-subtle/50 border border-dashed border-border-strong 
      rounded-2xl transition-all flex items-center h-12
      ${isDragging ? 'opacity-50 scale-[1.01] shadow-sm' : ''} 
      ${isMovingMode ? 'opacity-40 grayscale pointer-events-none' : 'cursor-pointer'}
    `}>
      {!isMovingMode && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-border-subtle/50 text-text-muted flex items-center justify-center w-8 h-full shrink-0 touch-none" onClick={e => e.stopPropagation()}>
          <GripVertical size={14} />
        </div>
      )}

      <div className={`flex-1 flex items-center min-w-0 pr-3 ${isMovingMode ? 'pl-4' : 'pl-1'}`}>
        <span className="text-xl mr-3 opacity-60">☕</span>
        <span className="text-xs font-bold text-text-secondary uppercase tracking-widest truncate">
          {item.title || 'Tiempo Libre'}
        </span>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {displayTime && item.durationMinutes ? (
            <div className="text-[10px] font-bold text-text-secondary bg-bg-surface px-2.5 py-1 rounded-md border border-border-subtle flex items-center gap-1.5 shadow-sm">
              <Clock size={10} className="text-text-muted" />
              {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span className="text-border-strong">-</span>
              {(() => {
                const end = new Date(displayTime);
                end.setMinutes(end.getMinutes() + item.durationMinutes);
                return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              })()}
              {item.isPinnedTime && <Lock size={8} className="text-text-muted" />}
            </div>
          ) : item.durationMinutes ? (
            <div className="text-[10px] font-bold text-text-secondary bg-bg-surface px-2.5 py-1 rounded-md border border-border-subtle flex items-center gap-1.5 shadow-sm">
              <Clock size={10} className="text-text-muted" /> {formatDuration(item.durationMinutes)}
            </div>
          ) : null}

          {!isMovingMode && (
            <CardActions
              item={item}
              onRequestMove={onRequestMove}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
      </div>
    </div>
  );
});
FreeTimeCard.displayName = 'FreeTimeCard';

// -----------------------------------------
// TRANSPORT CARD (Ticket Style)
// -----------------------------------------
const TransportCard = memo(({ item, isDragging, isMovingMode, attributes, listeners, onCardClick, onRequestMove }: any) => {
  const displayTime = item.derivedDatetime || item.datetime;

  return (
    <div onClick={onCardClick} className={`
      my-2 group relative overflow-hidden
      bg-bg-surface-elevated border border-border-strong rounded-3xl
      transition-all
      ${isDragging ? 'opacity-60 scale-[1.01] shadow-xl ring-2 ring-border-strong' : 'hover:shadow-md cursor-pointer'}
      ${isMovingMode ? 'opacity-40 grayscale pointer-events-none' : ''}
    `}>
      {/* Ticket Header */}
      <div className="bg-bg-surface border-b border-border-strong px-3 py-2 flex justify-between items-center opacity-80">
        <div className="flex items-center gap-2">
          {!isMovingMode && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary -ml-1 p-1 touch-none" onClick={e => e.stopPropagation()}>
              <GripVertical size={14} />
            </div>
          )}
          <span className="text-sm">{CAT_ICONS[item.cat] || '🚆'}</span>
          <span className="text-[9px] font-black uppercase text-text-secondary tracking-widest">
            {CAT_LABELS[item.cat] || 'Transporte'}
          </span>
        </div>

        {/* Ticket Reference */}
        {(item.company || item.flightNumber) ? (
          <span className="text-[9px] font-mono font-bold text-text-primary uppercase tracking-wider bg-bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">
            {[item.company, item.flightNumber].filter(Boolean).join(' ')}
          </span>
        ) : (item.logisticsConfirmation || item.bookingRef) ? (
          <span className="text-[9px] font-mono font-bold text-text-primary uppercase tracking-wider bg-bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle">
            REF: {item.logisticsConfirmation || item.bookingRef}
          </span>
        ) : null}
      </div>

      {/* Ticket Body */}
      <div className="p-3 md:p-4 flex items-center justify-between">
        <div className="flex flex-1 min-w-0 items-start gap-4">
          {/* Departure Time Block */}
          {displayTime && (
            <div className="text-center shrink-0 min-w-[3.5rem]">
              <div className="text-lg md:text-xl font-black text-text-primary">
                {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {item.isPinnedTime && <Lock size={10} className="mx-auto text-text-muted mt-0.5" />}
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1 pt-0.5">
            <h4 className="text-sm md:text-base font-black text-text-primary leading-tight truncate">
              {item.title || 'Desplazamiento'}
            </h4>

            {/* Meta details (Terminal, Gate, Seat, Duration) */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2">
              {item.terminal && (
                <div className="text-[9px] uppercase font-bold text-text-secondary bg-bg-surface-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                  Terminal <span className="text-text-primary block md:inline">{item.terminal}</span>
                </div>
              )}
              {item.gate && (
                <div className="text-[9px] uppercase font-bold text-text-secondary bg-bg-surface-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                  Puerta <span className="text-text-primary block md:inline">{item.gate}</span>
                </div>
              )}
              {item.seat && (
                <div className="text-[9px] uppercase font-bold text-text-secondary bg-bg-surface-elevated px-1.5 py-0.5 rounded border border-border-subtle">
                  Asiento <span className="text-text-primary block md:inline">{item.seat}</span>
                </div>
              )}
              {item.durationMinutes && (
                <div className="text-[9px] uppercase font-bold text-text-secondary bg-bg-surface-elevated px-2 py-0.5 rounded border border-border-subtle flex items-center gap-1">
                  <Clock size={10} /> {formatDuration(item.durationMinutes)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button / Actions */}
        {!isMovingMode && (
          <div className="pl-2">
            <CardActions
              item={item}
              onRequestMove={onRequestMove}
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
    </div>
  );
});
TransportCard.displayName = 'TransportCard';

// -----------------------------------------
// MAIN WRAPPER
// -----------------------------------------
export const SortableCard = memo(({
  item,
  onCardClick,
  onRequestMove,
  isMovingMode,
  isMergeTarget,
  isSelected,
  onToggleSelect,
  onTimeConflict
}: {
  item: LocationItem,
  onCardClick?: () => void,
  onRequestMove?: () => void,
  isMovingMode?: boolean,
  isMergeTarget?: boolean,
  isSelected?: boolean,
  onToggleSelect?: (e: React.MouseEvent) => void,
  onTimeConflict?: () => void
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: item.id.toString(),
    disabled: isMovingMode
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging && !isTransportCat(item.cat) && item.cat !== 'free' ? 0.3 : 1, // Opacity is handled individually inside for Free/Transports
    zIndex: isDragging ? 999 : 1,
  };

  const isFreeTime = item.cat === 'free';
  const isLogistics = isTransportCat(item.cat);

  return (
    <div ref={setNodeRef} style={style} className="outline-none relative">
      {isFreeTime ? (
        <FreeTimeCard
          item={item}
          isDragging={isDragging}
          isMovingMode={isMovingMode}
          attributes={attributes}
          listeners={listeners}
          onCardClick={onCardClick}
          onRequestMove={onRequestMove}
        />
      ) : isLogistics ? (
        <TransportCard
          item={item}
          isDragging={isDragging}
          isMovingMode={isMovingMode}
          attributes={attributes}
          listeners={listeners}
          onCardClick={onCardClick}
          onRequestMove={onRequestMove}
        />
      ) : (
        <div className="w-full h-full block">
          <CardVisual
            item={item}
            onCardClick={onCardClick}
            dragListeners={listeners}
            dragAttributes={attributes}
            onRequestMove={onRequestMove}
            isMovingMode={isMovingMode}
            isMergeTarget={isMergeTarget}
            isOver={isOver}
            isSelected={isSelected}
            onToggleSelect={onToggleSelect}
            onTimeConflict={onTimeConflict}
          />
        </div>
      )}
    </div>
  );
});
SortableCard.displayName = 'SortableCard';
