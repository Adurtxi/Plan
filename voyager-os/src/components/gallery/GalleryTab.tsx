import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { ImageIcon, Layers, MapPin } from 'lucide-react';
import { CAT_ICONS, DAYS, isTransportCat, isAccommodationCat } from '../../constants';
import { useLocations, useTripVariants } from '../../hooks/useTripData';
import { DetailModal } from '../modals/DetailModal';
import { CardActions } from '../ui/CardActions';
import { LocationForm } from '../planner/LocationForm';
import { useUpdateLocation } from '../../hooks/useTripData';
import type { Category, Priority, LocationItem } from '../../types';
import { RAButton } from '../ui/RAButton';

export const GalleryTab = () => {
  const activeGlobalVariantId = useAppStore(s => s.activeGlobalVariantId);
  const openLightbox = useAppStore(s => s.openLightbox);
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const [activeCityFilter, setActiveCityFilter] = useState<string>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'days' | 'cities' | 'tags'>('days');

  // Editing state for LocationForm
  const [formId, setFormId] = useState<number | null>(null);
  const [tempImages, setTempImages] = useState<{ data: string; name: string }[]>([]);
  const [tempAttachments, setTempAttachments] = useState<{ data: string; name: string; type?: string }[]>([]);
  const [formPriority, setFormPriority] = useState<Priority>('optional');
  const [formCat, setFormCat] = useState<Category>('sight');
  const [formSlot, setFormSlot] = useState<string>('Mañana');
  const [formCurrency, setFormCurrency] = useState<string>('EUR');
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false);

  const { mutateAsync: updateLocation } = useUpdateLocation();

  const resetForm = () => {
    setFormId(null); setTempImages([]); setTempAttachments([]); setFormPriority('optional'); setFormCat('sight');
    setFormSlot('Mañana'); setFormCurrency('EUR');
  };

  const handleEdit = (id: number) => {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    setFormId(loc.id);

    if (loc.cat === 'free') {
      return;
    }

    setTempImages(loc.images || []);
    setFormPriority(loc.priority);
    setFormCat(loc.cat);
    setFormSlot(loc.slot || 'Mañana');
    setFormCurrency(loc.newPrice?.currency || 'EUR');
    setTimeout(() => {
      setIsFormPanelOpen(true);
      useAppStore.getState().setSelectedLocationId(null);
      useAppStore.getState().setIsDetailModalOpen(false);
    }, 0);
  };

  const editingLocationId = useAppStore(s => s.editingLocationId);
  const setEditingLocationId = useAppStore(s => s.setEditingLocationId);

  useEffect(() => {
    if (editingLocationId !== null) {
      handleEdit(editingLocationId);
      setEditingLocationId(null);
    }
  }, [editingLocationId]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => {
      if (f.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        if (f.type.startsWith('image/')) {
          setTempImages(prev => [...prev, { data, name: f.name }]);
        } else {
          setTempAttachments(prev => [...prev, { data, name: f.name, type: f.type }]);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  const handleAddLocation = async (data: any) => {
    const link = data.link as string;
    let coords: { lat: number; lng: number } | undefined = undefined;
    const m1 = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const m2 = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (m2) coords = { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
    else if (m1) coords = { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };

    if (!coords) {
      const mapCoordsVal = data.mapCoords as string;
      if (mapCoordsVal) {
        const parts = mapCoordsVal.split(',');
        if (parts.length === 2) {
          coords = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
        }
      }
    }

    const priceAmount = data.priceAmount ? parseFloat(data.priceAmount) : 0;
    const isTransportation = isTransportCat(formCat);
    const isAccommodation = isAccommodationCat(formCat);
    const userDateTime = data.datetime as string;
    const isPinnedTime = data.isPinnedTime === true || data.isPinnedTime === 'on' || ((isTransportation || isAccommodation) && !!userDateTime);

    const rawTags = data.tags as string || '';
    const parsedTags = rawTags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    const durationValue = data.durationMinutes ? parseInt(data.durationMinutes, 10) : undefined;
    const finalDuration = durationValue && !isNaN(durationValue) && durationValue > 0 ? durationValue : undefined;

    const specializedFields = {
      company: data.company || undefined,
      flightNumber: data.flightNumber || undefined,
      terminal: data.terminal || undefined,
      gate: data.gate || undefined,
      platform: data.platform || undefined,
      seat: data.seat || undefined,
      station: data.station || undefined,
      pickupPoint: data.pickupPoint || undefined,
      dropoffPoint: data.dropoffPoint || undefined,
      transportApp: data.transportApp || undefined,
      address: data.address || undefined,
      roomNumber: data.roomNumber || undefined,
      lateCheckout: data.lateCheckout === true || data.lateCheckout === 'on',
      mealType: data.mealType || undefined,
      bestTimeHint: data.bestTimeHint || undefined,
      city: data.city || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    };

    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing) {
        let finalCoords = coords;
        if (!coords) finalCoords = existing.coords || undefined;

        await updateLocation({
          ...existing,
          title: data.title || undefined,
          link,
          coords: finalCoords,
          priority: formPriority,
          cat: formCat,
          cost: data.cost || '0',
          newPrice: { amount: priceAmount, currency: formCurrency || 'EUR' },
          slot: formSlot,
          datetime: data.datetime ? new Date(data.datetime).toISOString() : undefined,
          isPinnedTime,
          checkOutDatetime: data.checkOutDatetime ? new Date(data.checkOutDatetime).toISOString() : undefined,
          notes: data.notes || '',
          images: tempImages.length > 0 ? (tempImages as any) : existing.images,
          reservationStatus: data.reservationStatus || 'idea',
          bookingRef: data.bookingRef || undefined,
          logisticsConfirmation: data.logisticsConfirmation || undefined,
          logisticsDetail: data.logisticsDetail || undefined,
          durationMinutes: finalDuration !== undefined ? finalDuration : existing.durationMinutes,
          attachments: (tempAttachments.length > 0 ? tempAttachments : existing.attachments || []) as any,
          ...specializedFields,
        } as LocationItem);
      }
    }

    setIsFormPanelOpen(false);
    resetForm();
  };

  const { groupedData, dayLabels, availableCities, availableTags } = useMemo(() => {
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    const labels: Record<string, string> = {};

    if (activeVar?.startDate && activeVar?.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;
      const d = new Date(start);
      while (d <= end) {
        labels[`day-${i}`] = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        d.setDate(d.getDate() + 1);
        i++;
      }
    } else {
      DAYS.forEach((d, i) => { labels[`day-${i + 1}`] = d; });
    }
    labels['unassigned'] = 'Buzón de Ideas';

    const withImages = locations.filter(l =>
      l.images &&
      l.images.length > 0 &&
      (l.globalVariantId || 'default') === (activeGlobalVariantId || 'default')
    );

    // Extract unique cities and tags from images
    const cities = new Set<string>();
    const tags = new Set<string>();
    withImages.forEach(l => {
      if (l.city) cities.add(l.city);
      if (l.tags) l.tags.forEach(t => tags.add(t));
    });

    const filteredImages = withImages.filter(item => {
      const matchesCity = activeCityFilter === 'all' || item.city === activeCityFilter;
      const matchesTag = activeTagFilter === 'all' || (item.tags && item.tags.includes(activeTagFilter));
      return matchesCity && matchesTag;
    });

    const grouped: Record<string, typeof locations> = {};

    if (groupBy === 'days') {
      filteredImages.forEach(loc => {
        if (!grouped[loc.day]) grouped[loc.day] = [];
        grouped[loc.day].push(loc);
      });
    } else if (groupBy === 'cities') {
      filteredImages.forEach(loc => {
        const key = loc.city || 'Otra Zona';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(loc);
      });
    } else if (groupBy === 'tags') {
      filteredImages.forEach(loc => {
        if (!loc.tags || loc.tags.length === 0) {
          if (activeTagFilter === 'all') {
            const key = 'Sin Etiquetas';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(loc);
          }
        } else {
          loc.tags.forEach(tag => {
            if (activeTagFilter === 'all' || tag === activeTagFilter) {
              if (!grouped[tag]) grouped[tag] = [];
              grouped[tag].push(loc);
            }
          });
        }
      });
    }

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const timeA = a.datetime || '';
        const timeB = b.datetime || '';
        if (timeA && timeB) return new Date(timeA).getTime() - new Date(timeB).getTime();
        return (a.order ?? a.id) - (b.order ?? b.id);
      });
    });

    return {
      groupedData: grouped,
      dayLabels: labels,
      availableCities: Array.from(cities).sort(),
      availableTags: Array.from(tags).sort()
    };
  }, [locations, tripVariants, activeGlobalVariantId, activeCityFilter, activeTagFilter, groupBy]);

  const sortedGroups = Object.keys(groupedData).sort((a, b) => {
    if (groupBy === 'days') {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
      return (parseInt(a.replace('day-', '')) || 0) - (parseInt(b.replace('day-', '')) || 0);
    }
    if (a === 'Otra Zona' || a === 'Sin Etiquetas') return 1;
    if (b === 'Otra Zona' || b === 'Sin Etiquetas') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex-1 w-full bg-nature-bg h-full overflow-y-auto custom-scroll">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-32">
        <header className="mb-6 md:mb-10 text-center md:text-left flex flex-col items-center md:items-start">
          {/* Segmented Control for Grouping */}
          <div className="inline-flex bg-bg-surface-elevated/60 backdrop-blur border border-border-strong rounded-2xl p-1.5 shadow-sm">
            {[
              { id: 'days', label: 'Días' },
              { id: 'cities', label: 'Zonas' },
              { id: 'tags', label: 'Etiquetas' },
            ].map((option) => (
              <RAButton
                key={option.id}
                variant="ghost"
                onPress={() => setGroupBy(option.id as any)}
                className={`py-2 px-6 rounded-xl text-sm font-bold tracking-widest uppercase ${groupBy === option.id
                  ? 'bg-nature-primary text-white shadow-md'
                  : 'text-text-secondary hover:text-nature-primary hover:bg-bg-surface/50'
                  }`}
                size="sm"
              >
                {option.label}
              </RAButton>
            ))}
          </div>
        </header>

        {(availableCities.length > 0 || availableTags.length > 0) && (
          <div className="flex flex-col gap-3 mb-8 md:mb-12">
            {availableCities.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2">
                <span className="text-[11px] uppercase font-bold text-text-muted shrink-0 mr-2">Zonas</span>
                <RAButton
                  variant="ghost"
                  onPress={() => setActiveCityFilter('all')}
                  className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 ${activeCityFilter === 'all' ? 'bg-nature-primary text-white shadow-md' : 'bg-bg-surface border-2 border-transparent hover:border-border-strong text-text-secondary shadow-sm'}`}
                  size="sm"
                >
                  <MapPin size={12} /> Todas las Zonas
                </RAButton>
                {availableCities.map(c => (
                  <RAButton
                    key={c}
                    variant="ghost"
                    onPress={() => setActiveCityFilter(c)}
                    className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase ${activeCityFilter === c ? 'bg-nature-primary text-white shadow-md' : 'bg-bg-surface border-2 border-transparent hover:border-border-strong text-text-secondary shadow-sm'}`}
                    size="sm"
                  >
                    {c}
                  </RAButton>
                ))}
              </div>
            )}

            {availableTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2 mt-1">
                <span className="text-[11px] uppercase font-bold text-text-muted shrink-0 mr-2">Estilos</span>
                <RAButton
                  variant="ghost"
                  onPress={() => setActiveTagFilter('all')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${activeTagFilter === 'all' ? 'bg-nature-accent text-white shadow-md' : 'bg-nature-mint/30 border border-nature-primary/10 text-nature-primary shadow-sm'}`}
                  size="sm"
                >
                  Todos
                </RAButton>
                {availableTags.map(t => (
                  <RAButton
                    key={t}
                    variant="ghost"
                    onPress={() => setActiveTagFilter(t)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${activeTagFilter === t ? 'bg-nature-accent text-white shadow-md' : 'bg-nature-mint/30 border border-nature-primary/10 text-nature-primary shadow-sm'}`}
                    size="sm"
                  >
                    #{t}
                  </RAButton>
                ))}
              </div>
            )}
          </div>
        )}

        {sortedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-text-secondary py-24 md:py-32 bg-bg-surface border border-border-strong mx-auto max-w-2xl text-center px-4 md:px-8 rounded-[32px]">
            <div className="bg-bg-surface-elevated p-6 rounded-full border border-border-subtle mb-6 inline-block">
              <ImageIcon size={48} strokeWidth={1.5} className="text-text-muted" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-text-primary mb-2">Tu galería está vacía</h3>
            <p className="text-sm md:text-base text-text-secondary max-w-md">Añade fotos desde los detalles de tus actividades en el itinerario para verlas aquí.</p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-20">
            {sortedGroups.map(groupId => (
              <div key={groupId} className="w-full">

                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-sans font-black text-nature-primary capitalize tracking-tight whitespace-nowrap">
                    {groupBy === 'days' ? (dayLabels[groupId] || groupId.replace('-', ' ')) : (groupBy === 'tags' ? `#${groupId}` : groupId)}
                  </h2>
                  <div className="flex-1 h-px bg-nature-primary/20 min-w-[50px]"></div>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                  {groupedData[groupId].map(loc => (
                    <div
                      key={loc.id}
                      className="break-inside-avoid relative rounded-2xl md:rounded-3xl group bg-bg-surface cursor-pointer transition-all duration-300 border border-border-strong hover:border-nature-primary w-full block overflow-hidden"
                      onClick={() => openLightbox(loc.images, 0, loc.id)}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={loc.images[0].data}
                          alt={loc.title || 'Foto'}
                          className="w-full h-auto object-cover block"
                        />

                        <div className="bg-bg-surface/90 backdrop-blur-md p-4 md:p-5 z-10 flex flex-col justify-end pointer-events-none border-t border-border-strong">
                          <h4 className="font-bold text-text-primary text-base md:text-xl leading-tight truncate mb-1">
                            {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                          </h4>
                          {(loc.title || loc.address) && (
                            <p className="text-text-secondary text-[10px] md:text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 truncate">
                              <MapPin size={10} className="shrink-0 md:w-3 md:h-3" /> {loc.address || 'Ubicación guardada'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 flex gap-2 z-20 pointer-events-none">
                        <div className="bg-bg-surface border border-border-strong rounded-xl p-1.5 md:p-2 text-lg md:text-xl leading-none">
                          {CAT_ICONS[loc.cat]}
                        </div>
                        {loc.images.length > 1 && (
                          <div className="bg-black text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 h-fit my-auto">
                            <Layers size={10} className="md:w-3 md:h-3" /> {loc.images.length}
                          </div>
                        )}
                      </div>

                      <CardActions
                        item={loc}
                        className="absolute top-3 right-3 z-30"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DetailModal />
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
};