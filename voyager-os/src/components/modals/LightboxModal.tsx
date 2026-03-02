import { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { useLocations } from '../../hooks/useTripData';
import { CardActions } from '../ui/CardActions';

export const LightboxModal = () => {
  const { lightboxImages, lightboxIndex, lightboxLocationId, setLightboxIndex, closeLightbox } = useAppStore();
  const { data: locations = [] } = useLocations();

  const loc = useMemo(() => {
    return lightboxLocationId ? locations.find(l => l.id === lightboxLocationId) : null;
  }, [lightboxLocationId, locations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImages) {
        if (e.key === 'ArrowLeft') setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length);
        if (e.key === 'ArrowRight') setLightboxIndex((lightboxIndex + 1) % lightboxImages.length);
        if (e.key === 'Escape') closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImages, lightboxIndex, setLightboxIndex, closeLightbox]);

  if (!lightboxImages || lightboxImages.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center"
      onClick={closeLightbox}
    >
      <button onClick={closeLightbox} className="absolute top-8 right-8 text-white/50 text-4xl hover:text-white transition-colors z-50 font-sans">✕</button>

      {loc && (
        <div className="absolute top-8 w-full max-w-2xl px-6 z-50 text-center pointer-events-none">
          <h2 className="text-white text-2xl font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {loc.title || loc.notes?.split('\n')[0] || 'Ubicación'}
          </h2>
          {loc.address && (
            <p className="text-gray-300 font-medium text-xs mt-2 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{loc.address}</p>
          )}
        </div>
      )}

      <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length) }} className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"><ChevronLeft size={32} /></button>
      <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % lightboxImages.length) }} className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"><ChevronRight size={32} /></button>

      <div className="w-full h-full p-8 pb-32 pt-28 flex items-center justify-center overflow-auto pointer-events-none">
        <img
          src={lightboxImages[lightboxIndex].data}
          className="max-h-full max-w-full object-contain shadow-2xl rounded-sm pointer-events-auto cursor-auto"
          alt="lightbox view"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center gap-6 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center gap-3 px-4 overflow-x-auto max-w-full hide-scroll-mobile">
          {lightboxImages.map((img, idx) => (
            <img key={idx} src={img.data} onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }} className={`w-16 h-16 md:w-20 md:h-20 object-cover border-2 cursor-pointer rounded-lg transition-all ${idx === lightboxIndex ? 'border-nature-mint opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/50'}`} alt="thumbnail" />
          ))}
        </div>

        {loc && (
          <CardActions
            item={loc}
            mode="inline-labeled"
            onCloseParent={closeLightbox}
            className="px-4 max-w-3xl"
          />
        )}
      </div>
    </div>
  );
};
