import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../../store';
import { ImageIcon, Layers, MapPin, Info, Map, Navigation } from 'lucide-react';
import { CAT_ICONS, getCatGroup, DAYS } from '../../constants';
import { hapticFeedback } from '../../utils/haptics';
import { DetailModal } from '../modals/DetailModal';
import { useLocations, useTripVariants } from '../../hooks/useTripData';

export const GalleryTab = () => {
  const { activeGlobalVariantId, openLightbox, setFilterDays, setSelectedLocationId, setMobileView } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { data: tripVariants = [] } = useTripVariants();
  const navigate = useNavigate();

  const { groupedData, dayLabels } = useMemo(() => {
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    const labels: Record<string, string> = {};

    if (activeVar?.startDate && activeVar?.endDate) {
      const start = new Date(activeVar.startDate);
      const end = new Date(activeVar.endDate);
      let i = 1;
      const d = new Date(start);
      while (d <= end) {
        labels[`day - ${i} `] = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        d.setDate(d.getDate() + 1);
        i++;
      }
    } else {
      DAYS.forEach((d, i) => { labels[`day - ${i + 1} `] = d; });
    }
    labels['unassigned'] = 'Buzón de Ideas';

    const withImages = locations.filter(l =>
      l.images &&
      l.images.length > 0 &&
      (l.globalVariantId || 'default') === (activeGlobalVariantId || 'default')
    );

    const grouped: Record<string, Record<string, typeof locations>> = {};

    withImages.forEach(loc => {
      if (!grouped[loc.day]) grouped[loc.day] = {};
      const group = getCatGroup(loc.cat);
      if (!grouped[loc.day][group]) grouped[loc.day][group] = [];
      grouped[loc.day][group].push(loc);
    });

    return { groupedData: grouped, dayLabels: labels };
  }, [locations, tripVariants, activeGlobalVariantId]);

  const groupNames = {
    activity: 'Actividades',
    accommodation: 'Alojamiento',
    transport: 'Transporte',
    free: 'Tiempo Libre'
  };

  const sortedDays = Object.keys(groupedData).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    return (parseInt(a.replace('day-', '')) || 0) - (parseInt(b.replace('day-', '')) || 0);
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
    setSelectedLocationId(loc.id);
  };

  const handleEditFromGallery = (id: number) => {
    // Si queremos editar desde la galería, enviamos al planificador
    navigate('/');
    setFilterDays([locations.find(l => l.id === id)?.day || 'unassigned']);
    setSelectedLocationId(id);
  };

  const handleOpenGoogleMaps = (loc: any) => {
    if (!loc?.coords) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.coords.lat},${loc.coords.lng}`, '_blank');
  };

  return (
    <div className="flex-1 bg-nature-bg p-4 md:p-16 overflow-y-auto custom-scroll w-full pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-sans text-nature-primary mb-2 md:mb-4">Galería Visual</h1>
          <p className="text-nature-textLight font-light text-base md:text-lg">Tu itinerario organizado por fotos y momentos.</p>
        </header>

        {sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-24 bg-white rounded-bento shadow-soft">
            <ImageIcon size={64} strokeWidth={1} className="mb-6 opacity-40 text-gray-300" />
            <p className="text-xl font-medium text-nature-text">Tu galería está vacía</p>
            <p className="text-sm mt-2 font-light">Añade fotos desde los detalles de tus actividades en el mapa o itinerario.</p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-16">
            {sortedDays.map(dayId => (
              <div key={dayId} className="space-y-6 md:space-y-8 animate-fade-in-up">
                <div className="border-b-2 border-nature-primary/10 pb-3">
                  <h2 className="text-2xl md:text-3xl font-sans font-bold text-nature-primary capitalize">
                    {dayLabels[dayId] || dayId}
                  </h2>
                </div>

                <div className="space-y-8 pl-0 md:pl-4">
                  {(Object.keys(groupedData[dayId]) as Array<keyof typeof groupNames>).map(catGroup => (
                    <div key={catGroup}>
                      <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-4">
                        {groupNames[catGroup as keyof typeof groupNames]}
                        <span className="bg-gray-200 h-px flex-1"></span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {groupedData[dayId][catGroup].map(loc => (
                          <div
                            key={loc.id}
                            className="group relative flex flex-col gap-3"
                          >
                            <div className="relative rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-floating border border-gray-100 transition-all duration-500 md:group-hover:-translate-y-1">
                              <img
                                src={loc.images[0].data}
                                alt={loc.title || 'Foto'}
                                className="w-full h-full object-cover cursor-pointer transition-transform duration-700 md:group-hover:scale-110"
                                onClick={() => openLightbox(loc.images, 0, loc.id)}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-sm z-10">
                                <span className="text-xl leading-none">{CAT_ICONS[loc.cat]}</span>
                              </div>

                              {loc.images.length > 1 && (
                                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                                  <Layers size={10} /> {loc.images.length}
                                </div>
                              )}

                              {/* Acciones Rápidas */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 z-20">
                                <button
                                  onClick={() => handleShowDetail(loc)}
                                  className="bg-white/95 dark:bg-gray-800/95 dark:text-gray-100 p-3 rounded-full shadow-lg hover:bg-nature-mint hover:text-nature-primary dark:hover:bg-nature-mint dark:hover:text-nature-primary transition-colors cursor-pointer"
                                  title="Ver detalles"
                                >
                                  <Info size={20} />
                                </button>
                                <button
                                  onClick={() => handleGoToMap(loc)}
                                  className="bg-white/95 dark:bg-gray-800/95 dark:text-gray-100 p-3 rounded-full shadow-lg hover:bg-nature-mint hover:text-nature-primary dark:hover:bg-nature-mint dark:hover:text-nature-primary transition-colors cursor-pointer"
                                  title="Ver en mapa"
                                >
                                  <Map size={20} />
                                </button>
                                {loc.coords && (
                                  <button
                                    onClick={() => handleOpenGoogleMaps(loc)}
                                    className="bg-white/95 dark:bg-gray-800/95 dark:text-gray-100 p-3 rounded-full shadow-lg hover:bg-nature-mint hover:text-nature-primary dark:hover:bg-nature-mint dark:hover:text-nature-primary transition-colors cursor-pointer"
                                    title="Google Maps"
                                  >
                                    <Navigation size={20} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="px-1 text-left">
                              <h4 className="font-bold text-gray-800 text-base md:text-lg leading-tight truncate">
                                {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                              </h4>
                              {(loc.title || loc.address) && (
                                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mt-1.5 md:mt-2 flex items-center gap-1.5 truncate">
                                  <MapPin size={10} className="shrink-0" /> {loc.address || 'Ubicación guardada'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <DetailModal onEdit={handleEditFromGallery} />
    </div>
  );
};

