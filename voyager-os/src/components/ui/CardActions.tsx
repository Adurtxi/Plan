import { memo } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Edit2, Info, Map as MapIcon, Navigation, ArrowRightCircle, LogOut, MoreVertical } from 'lucide-react';
import { useAppStore } from '../../store';
import { hapticFeedback } from '../../utils/haptics';
import type { LocationItem } from '../../types';
import { useNavigate } from 'react-router';

interface CardActionsProps {
  item: LocationItem;
  mode?: 'dropdown' | 'inline' | 'inline-labeled';
  onRequestMove?: () => void;
  onCloseParent?: () => void; // for closing Modals
  className?: string;
}

export const CardActions = memo(({
  item,
  mode = 'dropdown',
  onRequestMove,
  onCloseParent,
  className = ''
}: CardActionsProps) => {
  const { setFilterDays, setSelectedLocationId, setIsDetailModalOpen, setMobileView, extractFromGroup } = useAppStore();
  const navigate = useNavigate();

  // Actions
  const handleShowDetail = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    hapticFeedback.light();
    setSelectedLocationId(item.id);
    setIsDetailModalOpen(true);
  };

  const handleGoToMap = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    hapticFeedback.light();
    navigate('/');
    setFilterDays([item.day]);
    if (item.coords) {
      useAppStore.getState().setReframeMapCoordinates(item.coords);
    }
    // Si queremos detalle, lo quitamos, si no lo ponemos. El usuario pidio sobresaltarlo y centrarlo, pero no abrir detalle
    setSelectedLocationId(item.id);
    setIsDetailModalOpen(false);

    if (setMobileView) setMobileView('map');
    if (onCloseParent) onCloseParent();
  };

  const handleOpenWebLink = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    if (!item.link || !item.link.startsWith('http')) return;
    hapticFeedback.light();
    window.open(item.link, '_blank');
  };

  const handleOpenGoogleMapsRoute = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    if (!item.coords) return;
    hapticFeedback.light();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.coords.lat},${item.coords.lng}`, '_blank');
  };

  const handleEdit = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    hapticFeedback.medium();
    setSelectedLocationId(null);
    setIsDetailModalOpen(false);
    // Disparamos el evento para que la app principal lance el edit (sea en PlannerTab o GalleryTab)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-edit', { detail: item.id }));
    }, 100);
    if (onCloseParent) onCloseParent();
  };

  const handleMoveTo = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    if (onRequestMove) onRequestMove();
  };

  const handleRemoveFromGroup = (e?: React.MouseEvent | Event) => {
    if (e) e.stopPropagation();
    if (item.groupId) extractFromGroup(item.id);
  };

  // ----- INLINE BUTTONS (Iconos limpios con o sin label) ----- 
  if (mode === 'inline' || mode === 'inline-labeled') {
    const isDetailModal = className.includes('detail-modal');

    // Estilos responsivos adaptados 100% al Dark Mode usando Tailwind variants
    const detailBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl border border-gray-200 dark:border-nature-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-nature-surface/50 transition-all text-sm font-medium flex justify-center items-center gap-2'
      : 'py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md flex items-center justify-center gap-2 transition-colors text-sm font-bold border border-white/10 shadow-lg cursor-pointer flex-1';

    const highlightBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-nature-primary text-white font-medium hover:bg-nature-primary/90 transition-all text-sm flex justify-center items-center gap-2'
      : 'flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md flex items-center justify-center gap-2 transition-colors text-sm font-bold border border-white/10 shadow-lg cursor-pointer';

    const linkBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-sm flex justify-center items-center gap-2'
      : 'flex-1 p-2.5 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-gray-600 shadow-lg cursor-pointer';

    const routeBtnClass = isDetailModal
      ? 'flex-1 py-3 rounded-xl bg-nature-mint/50 dark:bg-nature-primary/20 text-nature-primary font-bold hover:bg-nature-mint/80 dark:hover:bg-nature-primary/40 transition-all text-sm flex justify-center items-center gap-2'
      : 'flex-1 p-2.5 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-gray-600 shadow-lg cursor-pointer';

    const hasWebLink = item.link && item.link.startsWith('http');

    return (
      <div className={`flex gap-3 w-full justify-center ${className}`}>
        {/* Detalle */}
        {!isDetailModal && (
          <button onClick={handleShowDetail} className={detailBtnClass} title="Ver detalle">
            <Info size={16} /> {mode === 'inline-labeled' && 'Detalle'}
          </button>
        )}

        {/* Editar */}
        <button onClick={handleEdit} className={detailBtnClass} title="Editar elemento">
          <Edit2 size={16} /> {mode === 'inline-labeled' && 'Editar'}
        </button>

        {/* Ver en Mapa (Centrar/Highlight) */}
        {!isDetailModal && (
          <button onClick={handleGoToMap} className={highlightBtnClass} title="Ubicar en el planificador">
            <MapIcon size={16} /> {mode === 'inline-labeled' && 'Ver Mapa'}
          </button>
        )}

        {/* Link del Archivo (Web) */}
        {hasWebLink && (
          <button onClick={handleOpenWebLink} className={linkBtnClass} title="Abrir enlace guardado">
            <ArrowRightCircle size={16} /> {mode === 'inline-labeled' && 'Google Maps'}
          </button>
        )}

        {/* Ruta GPS de Google Maps */}
        {item.coords && (
          <button onClick={handleOpenGoogleMapsRoute} className={routeBtnClass} title="Crear ruta en Google Maps">
            <Navigation size={16} /> {mode === 'inline-labeled' && 'Ir A'}
          </button>
        )}
      </div>
    );
  }

  // ----- DROPDOWN MENU (Para las cards) -----
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="bg-white/90 backdrop-blur shadow-sm border border-gray-100 text-gray-500 hover:text-nature-primary p-1.5 rounded-full transition-colors outline-none focus:ring-2 focus:ring-nature-primary/50"
            aria-label="Abrir menú de acciones"
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-1.5 z-[5000] overflow-hidden"
            sideOffset={5}
            align="end"
            onClick={e => e.stopPropagation()}
          >
            <DropdownMenu.Item onSelect={handleShowDetail} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer outline-none data-[highlighted]:bg-gray-50">
              <Info size={14} className="text-blue-500" /> Ver Detalle
            </DropdownMenu.Item>

            <DropdownMenu.Item onSelect={handleEdit} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer outline-none data-[highlighted]:bg-gray-50">
              <Edit2 size={14} className="text-amber-500" /> Editar Elemento
            </DropdownMenu.Item>

            <DropdownMenu.Item onSelect={handleGoToMap} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer outline-none data-[highlighted]:bg-gray-50">
              <MapIcon size={14} className="text-nature-primary" /> Centrar en Plan
            </DropdownMenu.Item>

            {item.coords && (
              <DropdownMenu.Item onSelect={handleOpenGoogleMapsRoute} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer outline-none data-[highlighted]:bg-gray-50">
                <Navigation size={14} className="text-[#4285F4]" /> Abrir Google Maps
              </DropdownMenu.Item>
            )}

            {item.link && item.link.startsWith('http') && (
              <DropdownMenu.Item onSelect={handleOpenWebLink} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-xs font-bold text-gray-700 transition-colors border-b border-gray-50 cursor-pointer outline-none data-[highlighted]:bg-gray-50">
                <ArrowRightCircle size={14} className="text-[#4285F4]" /> Abrir Enlace Web
              </DropdownMenu.Item>
            )}

            {onRequestMove && (
              <DropdownMenu.Item onSelect={handleMoveTo} className="w-full text-left px-4 py-2 hover:bg-nature-mint/30 flex items-center gap-2 text-xs font-bold text-nature-primary transition-colors mt-1 cursor-pointer outline-none data-[highlighted]:bg-nature-mint/30">
                <ArrowRightCircle size={14} /> Mover de día...
              </DropdownMenu.Item>
            )}

            {item.groupId && (
              <DropdownMenu.Item onSelect={handleRemoveFromGroup} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-xs font-bold text-red-600 transition-colors border-t border-gray-50 mt-1 cursor-pointer outline-none data-[highlighted]:bg-red-50">
                <LogOut size={14} /> Sacar del Grupo
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
});

CardActions.displayName = 'CardActions';
