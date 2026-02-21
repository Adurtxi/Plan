import { useState, useMemo, useEffect } from 'react';
import { Polyline } from 'react-leaflet';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { LocationForm } from './LocationForm';
import { MapView } from './MapView';
import { ScheduleBoard } from './ScheduleBoard';
import { DetailModal } from '../modals/DetailModal';
import { IdeaInbox } from './IdeaInbox';
import { MobileTimelineView } from './MobileTimelineView';
import { useAppStore } from '../../store';
import { useResponsive } from '../../hooks/useResponsive';
import { CardVisual } from '../ui/SortableCard';
import type { Category, Priority, ReservationStatus } from '../../types';

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
};

export const PlannerTab = () => {
  const { locations, filterDay, updateLocationDay, addLocation, setSelectedLocationId } = useAppStore();
  const { isMobile } = useResponsive();

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = useMemo(() => locations.find(l => l.id.toString() === activeId), [activeId, locations]);

  const [formId, setFormId] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<{ data: string, name: string }[]>([]);
  const [formPriority, setFormPriority] = useState<Priority>('optional');
  const [formCat, setFormCat] = useState<Category>('sight');
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);

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
      }
    }

    if (targetDay) {
      updateLocationDay(Number(active.id), targetDay, targetVariant);
    }
  };

  const handleEdit = (id: number) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    setFormId(loc.id); setTempImages(loc.images); setFormPriority(loc.priority); setFormCat(loc.cat);
    setTimeout(() => {
      const form = document.getElementById('mainForm') as HTMLFormElement;
      if (form) {
        (form.elements.namedItem('link') as HTMLInputElement).value = loc.link;
        (form.elements.namedItem('cost') as HTMLInputElement).value = loc.cost;
        (form.elements.namedItem('slot') as HTMLSelectElement).value = loc.slot;
        (form.elements.namedItem('notes') as HTMLTextAreaElement).value = loc.notes;
      }
      setIsFormPanelOpen(true); setSelectedLocationId(null);
    }, 0);
  };

  const resetForm = () => {
    setFormId(null); setTempImages([]); setFormPriority('optional'); setFormCat('sight');
    (document.getElementById('mainForm') as HTMLFormElement)?.reset();
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

    let finalCoords = coords; let finalDay = 'unassigned';
    let finalVariant = 'default';
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

    resetForm(); setIsFormPanelOpen(false);
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

  useEffect(() => {
    let isMounted = true;
    if (filterDay === 'all' || filterDay === 'unassigned') {
      setOsrmRoute(null);
      return;
    }

    const dayItems = locations.filter(l => l.day === filterDay && l.coords);
    const weight: Record<string, number> = { "Mañana": 1, "Tarde": 2, "Noche": 3 };
    dayItems.sort((a, b) => (weight[a.slot] || 4) - (weight[b.slot] || 4));

    if (dayItems.length > 1) {
      const coordinates = dayItems.map(i => `${i.coords!.lng},${i.coords!.lat}`).join(';');
      const cacheKey = `osrm_${Math.abs(hashString(coordinates))}`;

      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setOsrmRoute(JSON.parse(cached));
      } else {
        fetch(`https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (isMounted && data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
              localStorage.setItem(cacheKey, JSON.stringify(coords));
              setOsrmRoute(coords);
            } else if (isMounted) {
              setOsrmRoute(null);
            }
          })
          .catch(err => {
            console.error("OSRM Error:", err);
            if (isMounted) setOsrmRoute(null);
          });
      }
    } else {
      setOsrmRoute(null);
    }

    return () => { isMounted = false; };
  }, [locations, filterDay]);

  const routePolylines = useMemo(() => {
    if (filterDay === 'all' || filterDay === 'unassigned') return null;
    const dayItems = locations.filter(l => l.day === filterDay && l.coords);
    const weight: Record<string, number> = { "Mañana": 1, "Tarde": 2, "Noche": 3 };
    dayItems.sort((a, b) => (weight[a.slot] || 4) - (weight[b.slot] || 4));

    if (dayItems.length > 1) {
      const latlngs = osrmRoute || dayItems.map(i => [i.coords!.lat, i.coords!.lng] as [number, number]);
      return (
        <>
          <Polyline positions={latlngs} color="white" weight={7} opacity={0.7} lineCap="round" lineJoin="round" />
          <Polyline positions={latlngs} color="#2D5A27" weight={3} dashArray={osrmRoute ? undefined : "10, 10"} opacity={1} />
        </>
      )
    }
    return null;
  }, [locations, filterDay, osrmRoute]);

  if (isMobile) {
    return <MobileTimelineView />;
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex-1 flex overflow-hidden relative">
        <IdeaInbox
          handleEdit={handleEdit}
          handleAddNew={() => { resetForm(); setIsFormPanelOpen(true); setSelectedLocationId(null); }}
        />
        <LocationForm
          isFormPanelOpen={isFormPanelOpen} setIsFormPanelOpen={setIsFormPanelOpen}
          formId={formId} formPriority={formPriority} setFormPriority={setFormPriority}
          formCat={formCat} setFormCat={setFormCat} tempImages={tempImages} setTempImages={setTempImages}
          handleAddLocation={handleAddLocation} handleFiles={handleFiles} resetForm={resetForm}
          locations={locations} handleEdit={handleEdit}
        />
        <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-nature-bg">
          <MapView routePolylines={routePolylines} setIsFormPanelOpen={setIsFormPanelOpen} />
          <ScheduleBoard handleEdit={handleEdit} />
        </div>
        <DetailModal onEdit={handleEdit} />
      </div>
      <DragOverlay>
        {activeItem ? <CardVisual item={activeItem} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
