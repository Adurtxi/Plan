import { memo } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { Edit2, Info, Map as MapIcon, Navigation, ArrowRightCircle, LogOut, MoreVertical } from 'lucide-react';
import { useAppStore } from '../../store';
import { useExtractFromGroup } from '../../hooks/useTripMutations';
import { hapticFeedback } from '../../utils/haptics';
import type { LocationItem } from '../../types';
import { useNavigate } from 'react-router';
import { RAMenu, RAMenuItem, RAMenuSeparator } from './RAMenu';
import { RAButton } from './RAButton';

interface CardActionsProps {
  item: LocationItem;
  mode?: 'dropdown' | 'inline' | 'inline-labeled';
  onRequestMove?: () => void;
  onCloseParent?: () => void;
  className?: string;
}

export const CardActions = memo(({
  item,
  mode = 'dropdown',
  onRequestMove,
  onCloseParent,
  className = ''
}: CardActionsProps) => {
  const { setFilterDays, setSelectedLocationId, setIsDetailModalOpen, setMobileView, setEditingLocationId } = useAppStore();
  const { mutate: extractFromGroup } = useExtractFromGroup();
  const navigate = useNavigate();

  // Actions
  const handleShowDetail = () => {
    hapticFeedback.light();
    setSelectedLocationId(item.id);
    setIsDetailModalOpen(true);
  };

  const handleGoToMap = () => {
    hapticFeedback.light();
    navigate('/');
    setFilterDays([item.day]);
    if (item.coords) {
      useAppStore.getState().setReframeMapCoordinates(item.coords);
    }
    setSelectedLocationId(item.id);
    setIsDetailModalOpen(false);

    if (setMobileView) setMobileView('map');
    if (onCloseParent) onCloseParent();
  };

  const handleOpenWebLink = () => {
    if (!item.link || !item.link.startsWith('http')) return;
    hapticFeedback.light();
    window.open(item.link, '_blank');
  };

  const handleOpenGoogleMapsRoute = () => {
    if (!item.coords) return;
    hapticFeedback.light();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`, '_blank');
  };

  const handleEdit = () => {
    hapticFeedback.medium();
    setSelectedLocationId(null);
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setEditingLocationId(item.id);
    }, 100);
    if (onCloseParent) onCloseParent();
  };

  const handleMoveTo = () => {
    if (onRequestMove) onRequestMove();
  };

  const handleRemoveFromGroup = () => {
    if (item.groupId) extractFromGroup(item.id);
  };

  // ----- INLINE BUTTONS (Iconos limpios con o sin label) -----
  if (mode === 'inline' || mode === 'inline-labeled') {
    const isDetailModal = className.includes('detail-modal');

    const detailBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl border border-border-strong text-text-secondary hover:bg-bg-surface-elevated transition-all text-sm font-medium flex justify-center items-center gap-2'
      : 'py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md flex items-center justify-center gap-2 transition-colors text-sm font-bold border border-white/10 shadow-lg cursor-pointer flex-1';

    const highlightBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-nature-primary text-white font-medium hover:bg-nature-primary/90 transition-all text-sm flex justify-center items-center gap-2'
      : 'flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md flex items-center justify-center gap-2 transition-colors text-sm font-bold border border-white/10 shadow-lg cursor-pointer';

    const linkBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-bg-surface-elevated border border-border-strong text-text-primary hover:border-nature-primary/50 transition-all text-sm flex justify-center items-center gap-2 font-bold'
      : 'flex-1 p-2.5 bg-bg-surface-elevated/80 hover:bg-border-strong text-text-primary rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-border-strong shadow-lg cursor-pointer';

    const routeBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-nature-mint/50 border border-nature-primary/20 text-nature-primary font-bold hover:bg-nature-mint/80 transition-all text-sm flex justify-center items-center gap-2'
      : 'flex-1 p-2.5 bg-bg-surface-elevated/80 hover:bg-border-strong text-text-primary rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-border-strong shadow-lg cursor-pointer';

    const hasWebLink = item.link && item.link.startsWith('http');

    return (
      <div className={`flex gap-3 w-full justify-center ${className}`}>
        {!isDetailModal && (
          <RAButton variant="ghost" onPress={handleShowDetail} className={detailBtnClass}>
            <Info size={16} /> {mode === 'inline-labeled' && 'Detalle'}
          </RAButton>
        )}

        <RAButton variant="ghost" onPress={handleEdit} className={detailBtnClass}>
          <Edit2 size={16} /> {mode === 'inline-labeled' && 'Editar'}
        </RAButton>

        {!isDetailModal && (
          <RAButton variant="ghost" onPress={handleGoToMap} className={highlightBtnClass}>
            <MapIcon size={16} /> {mode === 'inline-labeled' && 'Ver Mapa'}
          </RAButton>
        )}

        {hasWebLink && (
          <RAButton variant="ghost" onPress={handleOpenWebLink} className={linkBtnClass}>
            <ArrowRightCircle size={16} /> {mode === 'inline-labeled' && 'Enlace'}
          </RAButton>
        )}

        {item.coords && (
          <RAButton variant="ghost" onPress={handleOpenGoogleMapsRoute} className={routeBtnClass}>
            <Navigation size={16} /> {mode === 'inline-labeled' && 'Ir A'}
          </RAButton>
        )}
      </div>
    );
  }

  // ----- DROPDOWN MENU (Para las cards) -----
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <RAMenu
        trigger={
          <AriaButton
            className="bg-bg-surface/90 backdrop-blur shadow-sm border border-border-strong text-text-muted hover:text-nature-primary p-1.5 rounded-full transition-colors outline-none focus:ring-2 focus:ring-nature-primary/50"
            aria-label="Abrir menú de acciones"
            onPress={() => { /* stop propagation handled by RAC */ }}
          >
            <MoreVertical size={16} />
          </AriaButton>
        }
      >
        <RAMenuItem icon={<Info size={14} className="text-blue-500" />} onAction={handleShowDetail}>
          Ver Detalle
        </RAMenuItem>

        <RAMenuItem icon={<Edit2 size={14} className="text-amber-500" />} onAction={handleEdit}>
          Editar Elemento
        </RAMenuItem>

        <RAMenuItem icon={<MapIcon size={14} className="text-nature-primary" />} onAction={handleGoToMap}>
          Centrar en Plan
        </RAMenuItem>

        {item.coords && (
          <RAMenuItem icon={<Navigation size={14} className="text-[#4285F4]" />} onAction={handleOpenGoogleMapsRoute}>
            Abrir Google Maps
          </RAMenuItem>
        )}

        {item.link && item.link.startsWith('http') && (
          <RAMenuItem icon={<ArrowRightCircle size={14} className="text-[#4285F4]" />} onAction={handleOpenWebLink}>
            Abrir Enlace Web
          </RAMenuItem>
        )}

        {onRequestMove && (
          <>
            <RAMenuSeparator />
            <RAMenuItem icon={<ArrowRightCircle size={14} />} onAction={handleMoveTo} className="text-nature-primary hover:bg-nature-mint/30 focus:bg-nature-mint/30">
              Mover de día...
            </RAMenuItem>
          </>
        )}

        {item.groupId && (
          <>
            <RAMenuSeparator />
            <RAMenuItem icon={<LogOut size={14} />} destructive onAction={handleRemoveFromGroup}>
              Sacar del Grupo
            </RAMenuItem>
          </>
        )}
      </RAMenu>
    </div>
  );
});

CardActions.displayName = 'CardActions';
