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

  const { groupedData, dayLabels } = useMemo(() => {
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

    const grouped: Record<string, typeof locations> = {};

    withImages.forEach(loc => {
      if (!grouped[loc.day]) grouped[loc.day] = [];
      grouped[loc.day].push(loc);
    });

    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = a.datetime || '';
        const timeB = b.datetime || '';
        if (timeA && timeB) return new Date(timeA).getTime() - new Date(timeB).getTime();
        return (a.order ?? a.id) - (b.order ?? b.id);
      });
    });

    return { groupedData: grouped, dayLabels: labels };
  }, [locations, tripVariants, activeGlobalVariantId]);

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
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sans font-black text-nature-primary mb-2 md:mb-3 tracking-tight">Galería</h1>
          <p className="text-nature-textLight font-medium text-sm sm:text-base md:text-xl">
            Tu viaje organizado en recuerdos visuales.
          </p>
        </header>

        {sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-24 md:py-32 bg-white border border-gray-200 mx-auto max-w-2xl text-center px-4 md:px-8 rounded-[32px]">
            <div className="bg-white p-6 rounded-full border border-gray-100 mb-6 inline-block">
              <ImageIcon size={48} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-nature-text mb-2">Tu galería está vacía</h3>
            <p className="text-sm md:text-base text-gray-500 max-w-md">Añade fotos desde los detalles de tus actividades en el itinerario para verlas aquí.</p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-20">
            {sortedDays.map(dayId => (
              <div key={dayId} className="w-full">

                <div className="flex items-center gap-4 mb-6 md:mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-4xl font-sans font-black text-nature-primary capitalize tracking-tight whitespace-nowrap">
                    {dayLabels[dayId] || dayId.replace('-', ' ')}
                  </h2>
                  <div className="flex-1 h-px bg-nature-primary/20 min-w-[50px]"></div>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                  {groupedData[dayId].map(loc => (
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