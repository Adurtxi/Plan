import React, { useState, useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { LocationForm } from './LocationForm';
import { FreeTimeSheet } from './FreeTimeSheet';
import { MapView } from './MapView';
import { ScheduleBoard } from './ScheduleBoard';
import { DetailModal } from '../modals/DetailModal';
import { TripSettingsModal } from './TripSettingsModal';
import { TimeConflictModal, type TimeConflictAction } from '../modals/TimeConflictModal';
import { IdeaInbox } from './IdeaInbox';
import { MobileTimelineView } from './MobileTimelineView';
import { useAppStore } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { CardVisual } from '../ui/SortableCard';
import type { Category, Priority, ReservationStatus, LocationItem } from '../../types';



export const PlannerTab = () => {
  const { locations, filterDay, transports, reorderLocation, addLocation, updateLocation, setSelectedLocationId } = useAppStore();
  const { isMobile } = useResponsive();

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = useMemo(() => locations.find(l => l.id.toString() === activeId), [activeId, locations]);

  const [formId, setFormId] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<{ data: string, name: string }[]>([]);
  const [formPriority, setFormPriority] = useState<Priority>('optional');
  const [formCat, setFormCat] = useState<Category>('sight');
  const [formSlot, setFormSlot] = useState<string>('Mañana');
  const [formCurrency, setFormCurrency] = useState<string>('EUR');
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [isFreeTimeSheetOpen, setIsFreeTimeSheetOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [conflictModalData, setConflictModalData] = useState<{
    isOpen: boolean;
    activeTitle: string;
    overTitle: string;
    overDatetime: string;
    overDuration: number;
    pendingReorder: () => void;
    activeItemLoc: LocationItem;
  } | null>(null);
  const [preselectedDay, setPreselectedDay] = useState<string>('unassigned');
  const [preselectedVariant, setPreselectedVariant] = useState<string>('default');

  const [isAddMode, setIsAddMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Previene arrastrar al hacer clic normal
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let targetDay = '';
    let targetVariant = '';
    let overLocId: number | null = null;
    const overId = over.id.toString();

    // Comprobamos si soltamos en una columna o sobre otra tarjeta de ubicación
    if (overId.startsWith('col-')) {
      const parts = overId.replace('col-', '').split('::');
      targetDay = parts[0];
      targetVariant = parts[1] || 'default';
    } else {
      const overLoc = locations.find(l => l.id.toString() === overId);
      if (overLoc) {
        targetDay = overLoc.day;
        targetVariant = overLoc.variantId || 'default';
        overLocId = overLoc.id;
      }
    }

    if (targetDay) {
      if (overLocId === null && active.id.toString() === overId && !overId.startsWith('col-')) {
        // Drop in place on itself do nothing
      } else {
        const activeItem = locations.find(l => l.id.toString() === active.id.toString());
        const overItem = overLocId ? locations.find(l => l.id === overLocId) : null;

        // Time conflict check
        if (activeItem && overItem && overItem.datetime && !activeItem.datetime) {
          // Soltando una tarjeta SIN hora, detrás de una tarjeta CON hora.
          setConflictModalData({
            isOpen: true,
            activeTitle: activeItem.title || activeItem.cat,
            overTitle: overItem.title || overItem.cat,
            overDatetime: overItem.datetime,
            overDuration: overItem.durationMinutes || 60, // Fallback 1h
            activeItemLoc: activeItem,
            pendingReorder: () => reorderLocation(Number(active.id), overLocId, targetDay, targetVariant)
          });
        } else {
          // Flujo normal
          reorderLocation(Number(active.id), overLocId, targetDay, targetVariant);
        }
      }
    }
  };

  const handleResolveConflict = (action: TimeConflictAction, calculatedDatetime?: string) => {
    if (!conflictModalData) return;

    if (action === 'inherit' && calculatedDatetime) {
      // Aplicamos la hora calculada y luego reordenamos
      updateLocation({ ...conflictModalData.activeItemLoc, datetime: calculatedDatetime });
      conflictModalData.pendingReorder();
    } else if (action === 'keep-unscheduled') {
      // Simplemente reordenamos sin tocar la hora
      conflictModalData.pendingReorder();
    }
    // Si cancela, no hacemos nada y cerramos.

    setConflictModalData(null);
  };

  const handleEdit = (id: number) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    setFormId(loc.id);

    if (loc.cat === 'free') {
      setIsFreeTimeSheetOpen(true);
      setSelectedLocationId(null);
      setIsAddMode(false);
      return;
    }

    setTempImages(loc.images); setFormPriority(loc.priority); setFormCat(loc.cat);
    setFormSlot(loc.slot || 'Mañana'); setFormCurrency(loc.newPrice?.currency || 'EUR');
    setTimeout(() => {
      const form = document.getElementById('mainForm') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('link') as HTMLInputElement).value = loc.link;
        (form.elements.namedItem('title') as HTMLInputElement).value = loc.title || '';
        (form.elements.namedItem('cost') as HTMLInputElement).value = loc.cost;
        (form.elements.namedItem('notes') as HTMLTextAreaElement).value = loc.notes;
        if (loc.datetime) (form.elements.namedItem('datetime') as HTMLInputElement).value = loc.datetime;
        if (loc.checkOutDatetime) (form.elements.namedItem('checkOutDatetime') as HTMLInputElement).value = loc.checkOutDatetime;
        if (loc.bookingRef) (form.elements.namedItem('bookingRef') as HTMLInputElement).value = loc.bookingRef;
        if (loc.newPrice?.amount) (form.elements.namedItem('priceAmount') as HTMLInputElement).value = loc.newPrice.amount.toString();

        const durInput = form.elements.namedItem('durationMinutes') as HTMLInputElement;
        if (durInput) durInput.value = loc.durationMinutes ? loc.durationMinutes.toString() : '';
      }
      setIsFormPanelOpen(true); setSelectedLocationId(null); setIsAddMode(false);
    }, 0);
  };

  const resetForm = () => {
    setFormId(null); setTempImages([]); setFormPriority('optional'); setFormCat('sight');
    setFormSlot('Mañana'); setFormCurrency('EUR'); setPreselectedDay('unassigned'); setPreselectedVariant('default');
    (document.getElementById('mainForm') as HTMLFormElement)?.reset();
  };

  const handleAddNewToDay = (day: string, variantId: string) => {
    resetForm();
    setPreselectedDay(day);
    setPreselectedVariant(variantId);
    setIsFormPanelOpen(true);
    setSelectedLocationId(null);
    setIsAddMode(false);
  };

  const handleAddFreeTimeToDay = (day: string, variantId: string) => {
    resetForm();
    setPreselectedDay(day);
    setPreselectedVariant(variantId);
    setIsFreeTimeSheetOpen(true);
    setSelectedLocationId(null);
    setIsAddMode(false);
  };

  const handleAddLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const link = formData.get('link') as string;
    let coords = null;
    const m1 = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const m2 = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m2) coords = { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
    else if (m1) coords = { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
    if (!coords && !formId) { alert("Enlace inválido. Requiere coordenadas."); return; }

    let finalCoords = coords;
    let finalDay = preselectedDay;
    let finalVariant = preselectedVariant;
    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing) {
        if (!coords) finalCoords = existing.coords;
        finalDay = existing.day;
        finalVariant = existing.variantId || 'default';
      }
    }

    const rawAmount = formData.get('priceAmount') as string;
    const priceAmount = rawAmount ? parseFloat(rawAmount) : 0;
    const priceCurrency = (formData.get('priceCurrency') as string) || 'EUR';

    addLocation({
      id: formId || Date.now(),
      title: formData.get('title') as string || undefined,
      link,
      coords: finalCoords,
      priority: formPriority,
      cat: formCat,
      cost: formData.get('cost') as string || '0',
      newPrice: { amount: priceAmount, currency: priceCurrency },
      slot: formData.get('slot') as string,
      datetime: formData.get('datetime') as string || undefined,
      checkOutDatetime: formData.get('checkOutDatetime') as string || undefined,
      notes: formData.get('notes') as string,
      images: tempImages,
      day: finalDay,
      variantId: finalVariant,
      reservationStatus: (formData.get('reservationStatus') as ReservationStatus) || 'idea',
      bookingRef: formData.get('bookingRef') as string || undefined
    });

    resetForm(); setIsFormPanelOpen(false); setIsAddMode(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader(); reader.readAsDataURL(f);
        reader.onload = (e) => {
          const img = new Image(); img.src = e.target?.result as string;
          img.onload = () => {
            const c = document.createElement("canvas"); const max = 1000;
            let w = img.width, h = img.height;
            if (w > max) { h = Math.round((h * max) / w); w = max; }
            c.width = w; c.height = h; c.getContext("2d")?.drawImage(img, 0, 0, w, h);
            setTempImages(prev => [...prev, { data: c.toDataURL("image/webp", 0.8), name: f.name }]);
          };
        }
      }
    });
  };


  const handleRouteClick = (e: any, _fromId: number, toId: number) => {
    e.originalEvent.stopPropagation();
    // Para simplificar, abrimos el Detalle del destino (toId) al hacer clic en la ruta
    setSelectedLocationId(toId);
  };

  const routePolylines = useMemo(() => {
    if (filterDay === 'all' || filterDay === 'unassigned') return null;
    const dayItems = locations.filter(l => l.day === filterDay && l.coords && (l.variantId || 'default') === 'default' && l.cat !== 'free');

    if (dayItems.length > 1) {
      return (
        <>
          {dayItems.map((item, idx) => {
            if (idx === dayItems.length - 1) return null;
            const nextItem = dayItems[idx + 1];
            const transportId = `${item.id}-${nextItem.id}`;
            const segment = transports.find(t => t.id === transportId);

            const hasPolyline = segment?.polyline && segment.polyline.length > 0;
            const latlngs = hasPolyline
              ? segment.polyline!
              : [[item.coords!.lat, item.coords!.lng], [nextItem.coords!.lat, nextItem.coords!.lng]] as [number, number][];

            // Calculate midpoint for tooltip
            let midPoint: [number, number] | null = null;
            if (latlngs.length > 0) {
              const midIndex = Math.floor(latlngs.length / 2);
              midPoint = latlngs[midIndex];
            }

            return (
              <React.Fragment key={transportId}>
                <Polyline positions={latlngs} color="white" weight={10} opacity={0.5} lineCap="round" lineJoin="round" eventHandlers={{ click: (e) => handleRouteClick(e, item.id, nextItem.id) }} />
                <Polyline positions={latlngs} color={hasPolyline ? (segment.mode === 'car' ? '#3b82f6' : '#2D5A27') : "#9ca3af"} weight={4} dashArray={hasPolyline ? undefined : "10, 10"} opacity={1} eventHandlers={{ click: (e) => handleRouteClick(e, item.id, nextItem.id) }}>
                  {midPoint && segment?.durationCalculated && (
                    <Tooltip position={midPoint} permanent direction="center" className="bg-white/90 backdrop-blur border-none shadow-md text-nature-primary font-bold text-[10px] px-2 py-1 rounded-full relative z-[500] pointer-events-none mt-0 ml-0 before:hidden" opacity={1}>
                      {segment.durationCalculated >= 60 ? `${Math.floor(segment.durationCalculated / 60)}h ${segment.durationCalculated % 60 ? (segment.durationCalculated % 60) + 'm' : ''}` : `${segment.durationCalculated}m`}
                    </Tooltip>
                  )}
                </Polyline>
              </React.Fragment>
            );
          })}
        </>
      );
    }
    return null;
  }, [locations, filterDay, transports, setSelectedLocationId]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!isAddMode) {
      // Si no estamos en modo añadir, no abrimos el panel para no interferir
      return;
    }

    resetForm();
    setIsFormPanelOpen(true);
    setSelectedLocationId(null);
    setTimeout(() => {
      const form = document.getElementById('mainForm') as HTMLFormElement;
      if (form) {
        // Pre-fill the link field with the coordinates so the form can parse it naturally
        (form.elements.namedItem('link') as HTMLInputElement).value = `@${lat},${lng}`;
      }
    }, 0);
  };

  // NEW: layout mode state
  type ViewMode = 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
  const [viewMode, setViewMode] = useState<ViewMode>('split-horizontal');

  if (isMobile) {
    return <MobileTimelineView />;
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-nature-bg">
          <IdeaInbox
            handleEdit={handleEdit}
            handleCardClick={setSelectedLocationId}
            handleAddNew={() => { resetForm(); setIsFormPanelOpen(true); setSelectedLocationId(null); setIsAddMode(false); }}
          />

          <LocationForm
            isFormPanelOpen={isFormPanelOpen} setIsFormPanelOpen={setIsFormPanelOpen}
            formId={formId} formPriority={formPriority} setFormPriority={setFormPriority}
            formCat={formCat} setFormCat={setFormCat}
            formSlot={formSlot} setFormSlot={setFormSlot}
            formCurrency={formCurrency} setFormCurrency={setFormCurrency}
            tempImages={tempImages} setTempImages={setTempImages}
            handleAddLocation={handleAddLocation} handleFiles={handleFiles} resetForm={resetForm}
            locations={locations} handleEdit={handleEdit}
          />

          <FreeTimeSheet
            isOpen={isFreeTimeSheetOpen}
            onClose={() => { setIsFreeTimeSheetOpen(false); resetForm(); }}
            formId={formId}
            day={preselectedDay}
            variantId={preselectedVariant}
            onSave={() => { setIsFreeTimeSheetOpen(false); resetForm(); }}
          />

          <TripSettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />

          {conflictModalData && (
            <TimeConflictModal
              isOpen={conflictModalData.isOpen}
              activeTitle={conflictModalData.activeTitle}
              overTitle={conflictModalData.overTitle}
              overDatetime={conflictModalData.overDatetime}
              overDuration={conflictModalData.overDuration}
              onResolve={handleResolveConflict}
            />
          )}

          <div className={`flex flex-1 w-full h-full overflow-hidden ${viewMode === 'split-horizontal' ? 'flex-col' :
            viewMode === 'split-vertical' ? 'flex-row' :
              'flex-col' // fallbacks for single views will just hide the other component
            }`}>
            {viewMode !== 'board-only' && (
              <div className={`${viewMode === 'map-only' ? 'w-full h-full' :
                viewMode === 'split-vertical' ? 'flex-1 h-full border-r border-gray-200' :
                  'w-full h-[55%] border-b border-gray-200'
                } shrink-0 transition-all duration-300 relative`}>
                <MapView
                  routePolylines={routePolylines}
                  setIsFormPanelOpen={setIsFormPanelOpen}
                  onMapClick={handleMapClick}
                  isAddMode={isAddMode}
                  setIsAddMode={setIsAddMode}
                />
              </div>
            )}

            {viewMode !== 'map-only' && (
              <div className={`${viewMode === 'board-only' ? 'w-full h-full' :
                viewMode === 'split-vertical' ? 'w-[400px] shrink-0 h-full' :
                  'w-full flex-1'
                } overflow-hidden transition-all duration-300 relative`}>
                <ScheduleBoard handleEdit={handleEdit} handleCardClick={setSelectedLocationId} handleAddNewToDay={handleAddNewToDay} handleAddFreeTimeToDay={handleAddFreeTimeToDay} viewMode={viewMode} />
              </div>
            )}

            {/* Global View Selector (Always visible) */}
            <div className="absolute bottom-6 right-6 z-[600]">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-lg flex items-center gap-1 border border-white">
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50 mr-2" title="Ajustes del Viaje (Fechas y Variantes)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                <div className="w-px h-6 bg-gray-200 mr-2"></div>
                <button onClick={() => setViewMode('split-horizontal')} className={`p-2 rounded-lg transition-colors ${viewMode === 'split-horizontal' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`} title="Mapa Arriba"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line></svg></button>
                <button onClick={() => setViewMode('split-vertical')} className={`p-2 rounded-lg transition-colors ${viewMode === 'split-vertical' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`} title="Mapa Izquierda"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg></button>
                <button onClick={() => setViewMode('map-only')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map-only' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`} title="Solo Mapa"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg></button>
                <button onClick={() => setViewMode('board-only')} className={`p-2 rounded-lg transition-colors ${viewMode === 'board-only' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`} title="Solo Tablero"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
              </div>
            </div>
          </div>
        </div>
        <DetailModal onEdit={handleEdit} />
      </div>
      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItem ? <div style={{ cursor: 'grabbing', opacity: 0.9, transform: 'scale(1.05)' }}><CardVisual item={activeItem} isOverlay /></div> : null}
      </DragOverlay>
    </DndContext>
  );
};
