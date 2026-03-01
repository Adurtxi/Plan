import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../../store';
import { ImageIcon, Layers, MapPin, Map, Navigation, MoreVertical, Edit2 } from 'lucide-react';
import { CAT_ICONS, DAYS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import { useLocations, useTripVariants } from '../../hooks/useTripData';

export const GalleryTab = () => {
  const { activeGlobalVariantId, openLightbox, setFilterDays, setSelectedLocationId, setMobileView } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [activeCityFilter, setActiveCityFilter] = useState<string>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<'days' | 'cities' | 'tags'>('days');

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

  const handleGoToMap = (loc: any) => {
    hapticFeedback.light();
    navigate('/');
    setFilterDays([loc.day]);
    setSelectedLocationId(loc.id);
    setMobileView('map');
  };

  const handleShowDetail = (loc: any) => {
    hapticFeedback.light();
    navigate('/');
    setFilterDays([loc.day]);
    setSelectedLocationId(loc.id);
  };

  const handleOpenGoogleMaps = (loc: any) => {
    if (!loc?.coords) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.coords.lat},${loc.coords.lng}`, '_blank');
  };

  const toggleMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="flex-1 w-full bg-nature-bg h-full overflow-y-auto custom-scroll" onClick={() => setActiveMenuId(null)}>
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 pb-32">
        <header className="mb-6 md:mb-10 text-center md:text-left flex flex-col items-center md:items-start">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans font-black text-nature-primary mb-2 md:mb-3 tracking-tight">Galería</h1>
          <p className="text-nature-textLight font-medium text-sm sm:text-base md:text-xl mb-6">
            Tu viaje organizado en recuerdos visuales.
          </p>

          {/* Segmented Control for Grouping */}
          <div className="inline-flex bg-white/60 backdrop-blur border border-gray-200 rounded-2xl p-1.5 shadow-sm">
            {[
              { id: 'days', label: 'Días' },
              { id: 'cities', label: 'Zonas' },
              { id: 'tags', label: 'Etiquetas' },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setGroupBy(option.id as any)}
                className={`py-2 px-6 rounded-xl text-sm font-bold tracking-widest uppercase transition-all duration-300 ${groupBy === option.id
                  ? 'bg-nature-primary text-white shadow-md scale-100'
                  : 'text-gray-500 hover:text-nature-primary hover:bg-white/50 scale-95'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {(availableCities.length > 0 || availableTags.length > 0) && (
          <div className="flex flex-col gap-3 mb-8 md:mb-12">
            {availableCities.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2">
                <span className="text-[11px] uppercase font-bold text-gray-400 shrink-0 mr-2">Filtro Zonas</span>
                <button
                  onClick={() => setActiveCityFilter('all')}
                  className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeCityFilter === 'all' ? 'bg-nature-primary text-white shadow-md' : 'bg-white border-2 border-transparent hover:border-gray-200 text-gray-500 shadow-sm'}`}
                >
                  Todas
                </button>
                {availableCities.map(city => (
                  <button
                    key={city}
                    onClick={() => setActiveCityFilter(city)}
                    className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeCityFilter === city ? 'bg-nature-primary text-white shadow-md' : 'bg-white border-2 border-transparent hover:border-gray-200 text-gray-500 shadow-sm'}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}

            {availableTags.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-2">
                <span className="text-[11px] uppercase font-bold text-gray-400 shrink-0 mr-2">Filtro Tags</span>
                <button
                  onClick={() => setActiveTagFilter('all')}
                  className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeTagFilter === 'all' ? 'bg-nature-primary text-white shadow-md' : 'bg-white border-2 border-transparent hover:border-gray-200 text-gray-500 shadow-sm'}`}
                >
                  Todas
                </button>
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTagFilter(tag)}
                    className={`shrink-0 px-4 py-2 mx-0.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeTagFilter === tag ? 'bg-nature-primary text-white shadow-md' : 'bg-white border-2 border-transparent hover:border-gray-200 text-gray-500 shadow-sm'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {sortedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-24 md:py-32 bg-white border border-gray-200 mx-auto max-w-2xl text-center px-4 md:px-8 rounded-[32px]">
            <div className="bg-white p-6 rounded-full border border-gray-100 mb-6 inline-block">
              <ImageIcon size={48} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-nature-text mb-2">Tu galería está vacía</h3>
            <p className="text-sm md:text-base text-gray-500 max-w-md">Añade fotos desde los detalles de tus actividades en el itinerario para verlas aquí.</p>
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
                      className="break-inside-avoid relative rounded-2xl md:rounded-3xl group bg-white cursor-pointer transition-all duration-300 border border-gray-200 hover:border-nature-primary w-full block overflow-hidden"
                      onClick={() => openLightbox(loc.images, 0, loc.id)}
                    >
                      <div className="relative w-full h-full">
                        <img
                          src={loc.images[0].data}
                          alt={loc.title || 'Foto'}
                          className="w-full h-auto object-cover block"
                        />

                        <div className="bg-gray-900 p-4 md:p-5 z-10 flex flex-col justify-end pointer-events-none border-t border-gray-800">
                          <h4 className="font-bold text-white text-base md:text-xl leading-tight truncate mb-1">
                            {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                          </h4>
                          {(loc.title || loc.address) && (
                            <p className="text-gray-300 text-[10px] md:text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 truncate">
                              <MapPin size={10} className="shrink-0 md:w-3 md:h-3" /> {loc.address || 'Ubicación guardada'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 flex gap-2 z-20 pointer-events-none">
                        <div className="bg-white border border-gray-200 rounded-xl p-1.5 md:p-2 text-lg md:text-xl leading-none">
                          {CAT_ICONS[loc.cat]}
                        </div>
                        {loc.images.length > 1 && (
                          <div className="bg-black text-white text-[10px] md:text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0 h-fit my-auto">
                            <Layers size={10} className="md:w-3 md:h-3" /> {loc.images.length}
                          </div>
                        )}
                      </div>

                      <div className="absolute top-3 right-3 z-30">
                        <button
                          onClick={(e) => toggleMenu(e, loc.id)}
                          className="bg-black text-white hover:bg-nature-primary p-2 rounded-full transition-colors border border-gray-800"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === loc.id && (
                          <div className="absolute top-12 right-0 bg-white rounded-2xl border border-gray-200 py-1.5 w-48 z-50 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { handleShowDetail(loc); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors">
                              <Edit2 size={16} className="text-nature-primary" /> Editar
                            </button>
                            <button onClick={() => { handleGoToMap(loc); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors">
                              <Map size={16} className="text-nature-accent" /> Ver en Mapa
                            </button>
                            {loc.coords && (
                              <button onClick={() => { handleOpenGoogleMaps(loc); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm font-bold text-gray-700 transition-colors border-t border-gray-100 mt-1 pt-2.5">
                                <Navigation size={16} className="text-blue-500" /> Google Maps
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};