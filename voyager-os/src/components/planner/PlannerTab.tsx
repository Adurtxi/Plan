import React, { useState, useMemo, useRef } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor, DragOverlay } from '@dnd-kit/core';
import { LocationForm } from './LocationForm';
import { FreeTimeSheet } from './FreeTimeSheet';
import { MapView } from './MapView';
import { ScheduleBoard } from './ScheduleBoard';
import { DetailModal } from '../modals/DetailModal';
import { TripSettingsModal } from './TripSettingsModal';
import { TimeConflictModal, type TimeConflictAction } from '../modals/TimeConflictModal';
import { IdeaInbox } from './IdeaInbox';
import { MobileTimelineView } from './MobileTimelineView';
import { MobileMapView } from './MobileMapView';
import { MobileDaySelector } from './MobileDaySelector';
import { useAppStore } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { CardVisual } from '../ui/SortableCard';
import { DAYS, getCatConfig, isTransportCat } from '../../constants';
import type { Category, Priority, ReservationStatus, LocationItem } from '../../types';
import { useLocations, useTransports, useTripVariants, useAddLocation, useUpdateLocation } from '../../hooks/useTripData';
import { useReorderLocation, useMergeLocations, useMoveToDay, useExecuteMoveHere } from '../../hooks/useTripMutations';

export const PlannerTab = () => {
  const { optimisticLocations, clearOptimisticLocations, filterDays, setSelectedLocationId, undo, activeGlobalVariantId, movingItemId, setMovingItemId, activeDayVariants, setIsDragging, mobileView, setMobileView } = useAppStore();
  const { isMobile } = useResponsive();

  const { data: locations = [] } = useLocations();
  const { data: transports = [] } = useTransports();
  const { data: tripVariants = [] } = useTripVariants();

  const { mutateAsync: addLocation } = useAddLocation();
  const { mutateAsync: updateLocation } = useUpdateLocation();
  const { mutate: reorderLocation } = useReorderLocation();
  const { mutate: moveToDay } = useMoveToDay();
  const { mutate: mergeLocations } = useMergeLocations();
  const { mutate: executeMoveHere } = useExecuteMoveHere();

  const handleExecuteMoveHere = (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => {
    executeMoveHere({ itemId, targetDay, targetVariant, targetGroupId, insertBeforeId });
  };

  const displayLocations = optimisticLocations || locations;

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = useMemo(() => displayLocations.find(l => l.id.toString() === activeId), [activeId, displayLocations]);

  const [formId, setFormId] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<{ data: string, name: string }[]>([]);
  const [tempAttachments, setTempAttachments] = useState<{ data: string, name: string }[]>([]);
  const [formPriority, setFormPriority] = useState<Priority>('optional');
  const [formCat, setFormCat] = useState<Category>('sight');
  const [formSlot, setFormSlot] = useState<string>('Mañana');
  const [formCurrency, setFormCurrency] = useState<string>('EUR');
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [isFreeTimeSheetOpen, setIsFreeTimeSheetOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [moveToDayModal, setMoveToDayModal] = useState<{ isOpen: boolean, itemId: number | null }>({ isOpen: false, itemId: null });

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
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);
  const mergeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellOverIdRef = useRef<string | null>(null);

  // Auto-open settings if main plan has no start date
  React.useEffect(() => {
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    if (activeVar && !activeVar.startDate) {
      setIsSettingsModalOpen(true);
    }
  }, [tripVariants, activeGlobalVariantId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
    setIsDragging(true);
    // Clear any merge state
    setMergeTargetId(null);
    dwellOverIdRef.current = null;
    if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      // Left the target — reset dwell
      if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }
      dwellOverIdRef.current = null;
      setMergeTargetId(null);
      return;
    }

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    if (activeIdStr.startsWith('group-')) return;

    // --- Dwell timer for merge intent ---
    const isOverCard = !overIdStr.startsWith('col-') && !overIdStr.startsWith('group-');
    if (isOverCard) {
      if (dwellOverIdRef.current !== overIdStr) {
        // Moved to a different card — reset timer
        if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }
        setMergeTargetId(null);
        dwellOverIdRef.current = overIdStr;
        mergeTimerRef.current = setTimeout(() => {
          const overNum = Number(overIdStr);
          if (!isNaN(overNum)) setMergeTargetId(overNum);
        }, 800);
      }
      // If same card, keep timer running
    } else {
      // Over a column or group container — reset merge
      if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }
      dwellOverIdRef.current = null;
      setMergeTargetId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    clearOptimisticLocations();

    const { active, over } = event;
    if (!over || active.id === over.id) {
      // Clear merge state on any drop
      setMergeTargetId(null);
      dwellOverIdRef.current = null;
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
      setIsDragging(false);
      return;
    }

    setIsDragging(false);

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    const isGroupDrag = activeIdStr.startsWith('group-');
    let overLocId: number | null = null;

    if (!overIdStr.startsWith('col-') && !overIdStr.startsWith('group-')) {
      const overLoc = locations.find(l => l.id.toString() === overIdStr);
      if (overLoc) overLocId = overLoc.id;
    }

    const activeItemLoc = isGroupDrag ? null : locations.find(l => l.id.toString() === activeIdStr);
    const overItemLoc = overLocId ? locations.find(l => l.id === overLocId) : null;

    // MERGE: Only merge if dwell timer fired (mergeTargetId is set)
    if (!isGroupDrag && mergeTargetId && overItemLoc && overItemLoc.id === mergeTargetId) {
      mergeLocations({ activeId: Number(activeIdStr), targetId: mergeTargetId });
      setMergeTargetId(null);
      dwellOverIdRef.current = null;
      if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }
      return;
    }

    // Clear merge state
    setMergeTargetId(null);
    dwellOverIdRef.current = null;
    if (mergeTimerRef.current) { clearTimeout(mergeTimerRef.current); mergeTimerRef.current = null; }

    let targetDay = '';
    let targetVariant = 'default';
    let passOverId: string | number | null = null;

    if (overIdStr.startsWith('col-')) {
      const parts = overIdStr.replace('col-', '').split('::');
      targetDay = parts[0];
      targetVariant = parts[1] || activeDayVariants[targetDay] || 'default';
      passOverId = null;
    } else if (overIdStr.startsWith('group-')) {
      const groupId = overIdStr.replace('group-', '');
      const groupItem = locations.find(l => l.groupId === groupId);
      if (groupItem) {
        targetDay = groupItem.day;
        targetVariant = groupItem.variantId || activeDayVariants[targetDay] || 'default';
        passOverId = overIdStr;
      }
    } else {
      const overLoc = locations.find(l => l.id.toString() === overIdStr);
      if (overLoc) {
        targetDay = overLoc.day;
        targetVariant = overLoc.variantId || activeDayVariants[targetDay] || 'default';
        passOverId = overLoc.id;
      }
    }

    if (!targetDay) return;

    if (!isGroupDrag && activeItemLoc && overItemLoc && overItemLoc.datetime && !activeItemLoc.datetime) {
      setConflictModalData({
        isOpen: true,
        activeTitle: activeItemLoc.title || activeItemLoc.cat,
        overTitle: overItemLoc.title || overItemLoc.cat,
        overDatetime: overItemLoc.datetime,
        overDuration: overItemLoc.durationMinutes || 60,
        activeItemLoc,
        pendingReorder: () => {
          reorderLocation({
            activeId: Number(activeIdStr),
            overId: passOverId,
            day: targetDay,
            variantId: targetVariant
          });
        }
      });
      return;
    }

    reorderLocation({
      activeId: isGroupDrag ? activeIdStr : Number(activeIdStr),
      overId: passOverId,
      day: targetDay,
      variantId: targetVariant
    });
  };

  const handleResolveConflict = (action: TimeConflictAction, calculatedDatetime?: string) => {
    if (!conflictModalData) return;
    if (action === 'inherit' && calculatedDatetime) {
      updateLocation({ ...conflictModalData.activeItemLoc, datetime: calculatedDatetime });
      conflictModalData.pendingReorder();
    } else if (action === 'keep-unscheduled') {
      conflictModalData.pendingReorder();
    }
    setConflictModalData(null);
  };

  const handleEdit = (id: number) => {
    const loc = displayLocations.find(l => l.id === id);
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
        (form.elements.namedItem('link') as HTMLInputElement).value = loc.link || '';
        (form.elements.namedItem('title') as HTMLInputElement).value = loc.title || '';
        (form.elements.namedItem('cost') as HTMLInputElement).value = loc.cost;
        (form.elements.namedItem('notes') as HTMLTextAreaElement).value = loc.notes;
        if (loc.datetime) (form.elements.namedItem('datetime') as HTMLInputElement).value = loc.datetime;
        if (loc.checkOutDatetime) (form.elements.namedItem('checkOutDatetime') as HTMLInputElement).value = loc.checkOutDatetime;
        if (loc.bookingRef) (form.elements.namedItem('bookingRef') as HTMLInputElement).value = loc.bookingRef;
        if (loc.logisticsConfirmation) (form.elements.namedItem('logisticsConfirmation') as HTMLInputElement).value = loc.logisticsConfirmation;
        if (loc.logisticsDetail) (form.elements.namedItem('logisticsDetail') as HTMLInputElement).value = loc.logisticsDetail;
        setTempAttachments(loc.attachments || []);
        if (loc.newPrice?.amount) (form.elements.namedItem('priceAmount') as HTMLInputElement).value = loc.newPrice.amount.toString();

        const pinnedInput = form.elements.namedItem('isPinnedTime') as HTMLInputElement;
        if (pinnedInput) pinnedInput.checked = !!loc.isPinnedTime;

        const durInput = form.elements.namedItem('durationMinutes') as HTMLInputElement;
        if (durInput) durInput.value = loc.durationMinutes ? loc.durationMinutes.toString() : '';

        // Populate specialized fields
        const setField = (name: string, val?: string) => {
          const el = form.elements.namedItem(name) as HTMLInputElement;
          if (el && val) el.value = val;
        };
        setField('company', loc.company);
        setField('flightNumber', loc.flightNumber);
        setField('terminal', loc.terminal);
        setField('gate', loc.gate);
        setField('platform', loc.platform);
        setField('seat', loc.seat);
        setField('station', loc.station);
        setField('pickupPoint', loc.pickupPoint);
        setField('dropoffPoint', loc.dropoffPoint);
        setField('transportApp', loc.transportApp);
        setField('address', loc.address);
        setField('roomNumber', loc.roomNumber);
        setField('bestTimeHint', loc.bestTimeHint);

        // Checkbox: lateCheckout
        const lateCheckoutInput = form.elements.namedItem('lateCheckout') as HTMLInputElement;
        if (lateCheckoutInput) lateCheckoutInput.checked = !!loc.lateCheckout;

        // Radio: mealType
        if (loc.mealType) {
          const mealRadio = form.querySelector(`input[name="mealType"][value="${loc.mealType}"]`) as HTMLInputElement;
          if (mealRadio) mealRadio.checked = true;
        }

        // Show coords if available
        if (loc.coords) {
          const mapCoordsInput = form.elements.namedItem('mapCoords') as HTMLInputElement;
          if (mapCoordsInput) mapCoordsInput.value = `${loc.coords.lat},${loc.coords.lng}`;
          const coordsDisplay = document.getElementById('coordsDisplay');
          if (coordsDisplay) coordsDisplay.classList.remove('hidden');
          const coordsReadonly = form.elements.namedItem('coordsReadonly') as HTMLInputElement;
          if (coordsReadonly) coordsReadonly.value = `${loc.coords.lat.toFixed(6)}, ${loc.coords.lng.toFixed(6)}`;
        }
      }
      setIsFormPanelOpen(true); setSelectedLocationId(null); setIsAddMode(false);
    }, 0);
  };

  const resetForm = () => {
    setFormId(null); setTempImages([]); setTempAttachments([]); setFormPriority('optional'); setFormCat('sight');
    setFormSlot('Mañana'); setFormCurrency('EUR'); setPreselectedDay('unassigned'); setPreselectedVariant('default');
    (document.getElementById('mainForm') as HTMLFormElement)?.reset();
    // Hide coords display
    const coordsDisplay = document.getElementById('coordsDisplay');
    if (coordsDisplay) coordsDisplay.classList.add('hidden');
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
    const link = (formData.get('link') as string) || '';
    let coords = null;
    // Try extracting coords from link
    const m1 = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const m2 = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m2) coords = { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
    else if (m1) coords = { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
    // Fallback: read coords from hidden mapCoords field (set by map click)
    if (!coords) {
      const mapCoordsVal = formData.get('mapCoords') as string;
      if (mapCoordsVal) {
        const parts = mapCoordsVal.split(',');
        if (parts.length === 2) {
          coords = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
        }
      }
    }
    const catCfg = getCatConfig(formCat);
    if (!coords && !formId && catCfg?.needsCoords) { alert("Se requieren coordenadas. Usa un enlace de Maps o clica en el mapa."); return; }

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

    const isPinnedTime = formData.get('isPinnedTime') === 'on';

    // Collect specialized fields from form
    const specializedFields = {
      company: formData.get('company') as string || undefined,
      flightNumber: formData.get('flightNumber') as string || undefined,
      terminal: formData.get('terminal') as string || undefined,
      gate: formData.get('gate') as string || undefined,
      platform: formData.get('platform') as string || undefined,
      seat: formData.get('seat') as string || undefined,
      station: formData.get('station') as string || undefined,
      pickupPoint: formData.get('pickupPoint') as string || undefined,
      dropoffPoint: formData.get('dropoffPoint') as string || undefined,
      transportApp: formData.get('transportApp') as string || undefined,
      address: formData.get('address') as string || undefined,
      roomNumber: formData.get('roomNumber') as string || undefined,
      lateCheckout: formData.get('lateCheckout') === 'on',
      mealType: formData.get('mealType') as any || undefined,
      bestTimeHint: formData.get('bestTimeHint') as string || undefined,
    };

    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing) {
        updateLocation({
          ...existing,
          title: formData.get('title') as string || undefined,
          link,
          coords: finalCoords,
          priority: formPriority,
          cat: formCat,
          cost: formData.get('cost') as string || '0',
          newPrice: { amount: priceAmount, currency: priceCurrency },
          slot: formData.get('slot') as string,
          datetime: formData.get('datetime') as string || undefined,
          isPinnedTime,
          checkOutDatetime: formData.get('checkOutDatetime') as string || undefined,
          notes: formData.get('notes') as string,
          images: tempImages.length > 0 ? tempImages : existing.images,
          day: finalDay,
          variantId: finalVariant,
          globalVariantId: existing.globalVariantId || activeGlobalVariantId || 'default',
          reservationStatus: (formData.get('reservationStatus') as ReservationStatus) || 'idea',
          bookingRef: formData.get('bookingRef') as string || undefined,
          logisticsConfirmation: formData.get('logisticsConfirmation') as string || undefined,
          logisticsDetail: formData.get('logisticsDetail') as string || undefined,
          attachments: tempAttachments.length > 0 ? tempAttachments : existing.attachments || [],
          ...specializedFields,
        });
      }
    } else {
      addLocation({
        id: Date.now(),
        title: formData.get('title') as string || undefined,
        link,
        coords: finalCoords,
        priority: formPriority,
        cat: formCat,
        cost: formData.get('cost') as string || '0',
        newPrice: { amount: priceAmount, currency: priceCurrency },
        slot: formData.get('slot') as string,
        datetime: formData.get('datetime') as string || undefined,
        isPinnedTime,
        checkOutDatetime: formData.get('checkOutDatetime') as string || undefined,
        notes: formData.get('notes') as string,
        images: tempImages,
        day: finalDay,
        variantId: finalVariant,
        globalVariantId: activeGlobalVariantId || 'default',
        reservationStatus: (formData.get('reservationStatus') as ReservationStatus) || 'idea',
        bookingRef: formData.get('bookingRef') as string || undefined,
        logisticsConfirmation: formData.get('logisticsConfirmation') as string || undefined,
        logisticsDetail: formData.get('logisticsDetail') as string || undefined,
        attachments: tempAttachments,
        ...specializedFields,
      });
    }

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
      } else {
        // Non-image files or generic attachments
        const reader = new FileReader(); reader.readAsDataURL(f);
        reader.onload = (e) => {
          setTempAttachments(prev => [...prev, { data: e.target?.result as string, name: f.name }]);
        };
      }
    });
  };

  const handleRouteClick = (e: any, _fromId: number, toId: number) => {
    e.originalEvent.stopPropagation();
    setSelectedLocationId(toId);
  };

  const routePolylines = useMemo(() => {
    const renderRoutesForDay = (dayItems: LocationItem[]) => {
      if (dayItems.length <= 1) return null;
      return dayItems.map((item, idx) => {
        if (idx === dayItems.length - 1) return null;
        const nextItem = dayItems[idx + 1];
        const transportId = `${item.id}-${nextItem.id}`;
        const segment = transports.find(t => t.id === transportId);

        const hasPolyline = segment?.polyline && segment.polyline.length > 0;
        const latlngs = hasPolyline
          ? segment.polyline!
          : [[item.coords!.lat, item.coords!.lng], [nextItem.coords!.lat, nextItem.coords!.lng]] as [number, number][];

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
      });
    };

    // Determine which days to show routes for
    const allAssigned = displayLocations.filter(l => l.day !== 'unassigned' && l.coords && l.cat !== 'free' && !isTransportCat(l.cat));
    const visibleDays = filterDays.length > 0
      ? [...new Set(allAssigned.filter(l => filterDays.includes(l.day)).map(l => l.day))]
      : [...new Set(allAssigned.map(l => l.day))];

    const allRoutes = visibleDays.map(day => {
      const dayVariant = activeDayVariants[day] || 'default';
      const dayItems = allAssigned
        .filter(l => l.day === day && (l.variantId || 'default') === dayVariant)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
      return renderRoutesForDay(dayItems);
    }).filter(Boolean);
    return allRoutes.length > 0 ? <>{allRoutes}</> : null;
  }, [locations, filterDays, transports, activeDayVariants, displayLocations]);

  const showCoordsInForm = (lat: number, lng: number) => {
    const form = document.getElementById('mainForm') as HTMLFormElement;
    if (form) {
      const mapCoordsInput = form.elements.namedItem('mapCoords') as HTMLInputElement;
      if (mapCoordsInput) mapCoordsInput.value = `${lat},${lng}`;
      const coordsDisplay = document.getElementById('coordsDisplay');
      if (coordsDisplay) coordsDisplay.classList.remove('hidden');
      const coordsReadonly = form.elements.namedItem('coordsReadonly') as HTMLInputElement;
      if (coordsReadonly) coordsReadonly.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isAddMode) return;
    resetForm();

    // Auto-assign day if only one day is selected in filter
    if (filterDays.length === 1 && filterDays[0] !== 'all') {
      setPreselectedDay(filterDays[0]);
    }

    setIsFormPanelOpen(true);
    setSelectedLocationId(null);
    setTimeout(() => showCoordsInForm(lat, lng), 0);
  };

  type ViewMode = 'split-horizontal' | 'split-vertical' | 'map-only' | 'board-only';
  const [viewMode, setViewMode] = useState<ViewMode>('split-horizontal');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const availableDays = useMemo(() => {
    let daysList = [...DAYS];
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    if (activeVar && activeVar.startDate && activeVar.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;
      const copyDate = new Date(start);
      daysList = [];
      while (copyDate <= end) {
        daysList.push(`day-${i}`);
        copyDate.setDate(copyDate.getDate() + 1);
        i++;
      }
    }
    return [...daysList, 'unassigned'];
  }, [tripVariants, activeGlobalVariantId]);

  if (isMobile) {
    if (mobileView === 'map') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-nature-bg">
          <MobileMapView routePolylines={routePolylines} />
          <DetailModal onEdit={handleEdit} />
          <LocationForm
            isFormPanelOpen={isFormPanelOpen} setIsFormPanelOpen={setIsFormPanelOpen}
            formId={formId} formPriority={formPriority} setFormPriority={setFormPriority}
            formCat={formCat} setFormCat={setFormCat}
            formSlot={formSlot} setFormSlot={setFormSlot}
            formCurrency={formCurrency} setFormCurrency={setFormCurrency}
            tempImages={tempImages} setTempImages={setTempImages}
            tempAttachments={tempAttachments} setTempAttachments={setTempAttachments}
            handleAddLocation={handleAddLocation} handleFiles={handleFiles} resetForm={resetForm}
            locations={locations} handleEdit={handleEdit}
          />
        </div>
      );
    }
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-nature-bg">
        <MobileTimelineView setMobileView={setMobileView} handleEdit={handleEdit} />
        <DetailModal onEdit={handleEdit} />
        <LocationForm
          isFormPanelOpen={isFormPanelOpen} setIsFormPanelOpen={setIsFormPanelOpen}
          formId={formId} formPriority={formPriority} setFormPriority={setFormPriority}
          formCat={formCat} setFormCat={setFormCat}
          formSlot={formSlot} setFormSlot={setFormSlot}
          formCurrency={formCurrency} setFormCurrency={setFormCurrency}
          tempImages={tempImages} setTempImages={setTempImages}
          tempAttachments={tempAttachments} setTempAttachments={setTempAttachments}
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
      </div>
    );
  }

  const movingItemData = locations.find(l => l.id === movingItemId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-nature-bg">
          <IdeaInbox
            handleEdit={handleEdit}
            handleCardClick={setSelectedLocationId}
            handleAddNew={() => { resetForm(); setIsFormPanelOpen(true); setSelectedLocationId(null); setIsAddMode(false); }}
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

          {moveToDayModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-bold text-nature-primary mb-4">Mover Actividad</h3>
                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scroll">
                  {availableDays.map(day => (
                    <button
                      key={day}
                      onClick={() => {
                        const targetVariant = activeDayVariants[day] || 'default';
                        if (moveToDayModal.itemId) moveToDay({ id: moveToDayModal.itemId, targetDay: day, targetVariant });
                        setMoveToDayModal({ isOpen: false, itemId: null });
                      }}
                      className="text-left px-4 py-3 bg-gray-50 hover:bg-nature-mint/30 rounded-xl text-sm font-bold text-gray-700 transition-colors"
                    >
                      {day === 'unassigned' ? '📥 Buzón de Ideas' : day.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <button onClick={() => setMoveToDayModal({ isOpen: false, itemId: null })} className="mt-4 w-full py-2 text-center text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className={`flex flex-1 w-full h-full overflow-hidden ${viewMode === 'split-horizontal' ? 'flex-col' : viewMode === 'split-vertical' ? 'flex-row' : 'flex-col'}`}>
            {viewMode !== 'board-only' && (
              <div className={`${viewMode === 'map-only' ? 'w-full h-full' : viewMode === 'split-vertical' ? 'flex-1 h-full border-r border-gray-200' : 'w-full h-[55%] border-b border-gray-200'} shrink-0 transition-all duration-300 relative`}>
                <MapView
                  routePolylines={routePolylines}
                  setIsFormPanelOpen={setIsFormPanelOpen}
                  onMapClick={handleMapClick}
                  isAddMode={isAddMode}
                  setIsAddMode={setIsAddMode}
                />
                {/* View mode selector — over the map */}
                <div className="absolute bottom-4 right-4 z-[600]">
                  <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-lg flex items-center gap-1 border border-white">
                    <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50 mr-2" title="Ajustes del Viaje"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                    <div className="w-px h-6 bg-gray-200 mr-2"></div>
                    <button onClick={() => setViewMode('split-horizontal')} className={`p-2 rounded-lg transition-colors ${viewMode === 'split-horizontal' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line></svg></button>
                    <button onClick={() => setViewMode('split-vertical')} className={`p-2 rounded-lg transition-colors ${viewMode === 'split-vertical' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg></button>
                    <button onClick={() => setViewMode('map-only')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map-only' ? 'bg-nature-primary text-white shadow-sm' : 'text-gray-400 hover:text-nature-primary hover:bg-gray-50'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg></button>
                    <button onClick={() => setViewMode('board-only')} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
                  </div>
                </div>
              </div>
            )}

            {viewMode !== 'map-only' && (
              <div className={`${viewMode === 'board-only' ? 'w-full h-full flex flex-col' : viewMode === 'split-vertical' ? 'w-[400px] shrink-0 h-full bg-white border-l border-gray-100 flex flex-col' : 'w-full flex-1 min-h-0 flex flex-col'} transition-all duration-300 relative`}>
                {viewMode === 'split-vertical' && (
                  <div className="p-4 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-nature-primary/50">Día seleccionado</span>
                    </div>
                    <MobileDaySelector
                      selectedDay={(filterDays && filterDays.length === 1) ? filterDays[0] : 'day-1'}
                      onSelectDay={(day) => useAppStore.getState().setFilterDays([day])}
                    />
                  </div>
                )}
                <div className="flex-1 overflow-hidden relative">
                  <ScheduleBoard
                    handleEdit={handleEdit}
                    handleCardClick={setSelectedLocationId}
                    handleAddNewToDay={handleAddNewToDay}
                    handleAddFreeTimeToDay={handleAddFreeTimeToDay}
                    viewMode={viewMode}
                    onRequestMove={(id) => setMovingItemId(id)}
                    mergeTargetId={mergeTargetId}
                    movingItemId={movingItemId}
                    executeMoveHere={handleExecuteMoveHere}
                  />
                </div>
                {viewMode === 'board-only' && (
                  <div className="absolute bottom-4 right-4 z-[600]">
                    <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-lg flex items-center gap-1 border border-white">
                      <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50 mr-2" title="Ajustes del Viaje"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                      <div className="w-px h-6 bg-gray-200 mr-2"></div>
                      <button onClick={() => setViewMode('split-horizontal')} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="12" x2="21" y2="12"></line></svg></button>
                      <button onClick={() => setViewMode('split-vertical')} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg></button>
                      <button onClick={() => setViewMode('map-only')} className="p-2 rounded-lg transition-colors text-gray-400 hover:text-nature-primary hover:bg-gray-50"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg></button>
                      <button onClick={() => setViewMode('board-only')} className="p-2 rounded-lg transition-colors bg-nature-primary text-white shadow-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BARRA FLOTANTE MODO MOVER AQUÍ */}
            {movingItemId && movingItemData && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl z-[1000] flex items-center gap-5 border-4 border-nature-primary animate-in slide-in-from-bottom-10">
                <div className="flex items-center gap-3">
                  <span className="animate-pulse text-2xl">✨</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-nature-mint font-bold uppercase tracking-widest">Modo Edición Rápida</span>
                    <span className="text-sm font-medium">Selecciona un hueco punteado para colocar: <b className="text-white">{movingItemData.title || 'esta actividad'}</b></span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-700 mx-2"></div>
                <button onClick={() => setMovingItemId(null)} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider bg-gray-800 px-4 py-2 rounded-full transition-colors">Cancelar</button>
              </div>
            )}


          </div>
        </div>
        <DetailModal onEdit={handleEdit} />
      </div>
      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeItem ? (
          <div style={{ cursor: 'grabbing', opacity: 0.9, transform: 'scale(1.05)' }}>
            <CardVisual item={activeItem} isOverlay />
          </div>
        ) : activeId?.startsWith('group-') ? (
          <div style={{ cursor: 'grabbing', opacity: 0.9, transform: 'scale(1.05)' }} className="bg-white/90 border-2 border-dashed border-gray-300 rounded-[24px] p-4 font-bold text-gray-500 shadow-xl flex items-center justify-center min-w-[300px] h-[100px]">
            <span className="opacity-50 mr-2">⣿</span> Moviendo Paquete
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
