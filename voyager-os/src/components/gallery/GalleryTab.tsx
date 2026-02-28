import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { Image as ImageIcon, MapPin, Layers } from 'lucide-react';
import { CAT_ICONS, getCatGroup, DAYS } from '../../constants';

export const GalleryTab = () => {
  const { locations, tripVariants, activeGlobalVariantId, openLightbox } = useAppStore();

  const { groupedData, dayLabels } = useMemo(() => {
    const activeVar = tripVariants.find(v => v.id === activeGlobalVariantId);
    const labels: Record<string, string> = {};

    // Calcular las fechas reales si existen
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

    // Filtrar solo las que tienen imágenes
    const withImages = locations.filter(l =>
      l.images &&
      l.images.length > 0 &&
      (l.globalVariantId || 'default') === (activeGlobalVariantId || 'default')
    );

    // Agrupar: grouped[dia][grupoCategoria] = LocationItem[]
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

  return (
    <div className="flex-1 bg-nature-bg p-8 md:p-16 overflow-y-auto custom-scroll w-full pb-32">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-sans text-nature-primary mb-4">Galería Visual</h1>
          <p className="text-nature-textLight font-light text-lg">Tu itinerario organizado por fotos y momentos.</p>
        </header>

        {sortedDays.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 py-24 bg-white rounded-bento shadow-soft">
            <ImageIcon size={64} strokeWidth={1} className="mb-6 opacity-40 text-gray-300" />
            <p className="text-xl font-medium text-nature-text">Tu galería está vacía</p>
            <p className="text-sm mt-2 font-light">Añade fotos desde los detalles de tus actividades en el mapa o itinerario.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {sortedDays.map(dayId => (
              <div key={dayId} className="space-y-8 animate-fade-in-up">
                <div className="border-b-2 border-nature-primary/10 pb-3">
                  <h2 className="text-3xl font-sans font-bold text-nature-primary capitalize">
                    {dayLabels[dayId] || dayId}
                  </h2>
                </div>

                <div className="space-y-10 pl-0 md:pl-4">
                  {(Object.keys(groupedData[dayId]) as Array<keyof typeof groupNames>).map(catGroup => (
                    <div key={catGroup}>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-4">
                        {groupNames[catGroup as keyof typeof groupNames]}
                        <span className="bg-gray-200 h-px flex-1"></span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {groupedData[dayId][catGroup].map(loc => (
                          <div
                            key={loc.id}
                            className="group cursor-pointer relative rounded-2xl overflow-hidden aspect-square shadow-sm hover:shadow-floating border border-gray-100 transition-all duration-500 hover:-translate-y-1"
                            onClick={() => openLightbox(loc.images)}
                          >
                            <img
                              src={loc.images[0].data}
                              alt={loc.title || 'Foto'}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-sm">
                              <span className="text-xl leading-none">{CAT_ICONS[loc.cat]}</span>
                            </div>

                            {loc.images.length > 1 && (
                              <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <Layers size={10} /> {loc.images.length}
                              </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                              <h4 className="text-white font-bold text-base md:text-lg leading-tight truncate drop-shadow-md">
                                {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
                              </h4>
                              {(loc.title || loc.address) && (
                                <p className="text-gray-200 text-[10px] uppercase tracking-wider font-bold mt-2 flex items-center gap-1.5 truncate">
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
    </div>
  );
};
