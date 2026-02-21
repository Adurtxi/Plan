import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';

export const LightboxModal = () => {
  const { lightboxImages, lightboxIndex, setLightboxIndex, closeLightbox } = useAppStore();

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
    <div className="fixed inset-0 z-[3000] bg-white/95 backdrop-blur-xl flex flex-col justify-center items-center">
      <button onClick={closeLightbox} className="absolute top-8 right-8 text-nature-text text-4xl hover:text-nature-primary transition-colors z-50 font-serif">✕</button>
      <button onClick={() => setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length)} className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 p-4 text-gray-400 hover:text-nature-primary hover:bg-gray-100 rounded-full transition-all z-50"><ChevronLeft size={32} /></button>
      <button onClick={() => setLightboxIndex((lightboxIndex + 1) % lightboxImages.length)} className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 p-4 text-gray-400 hover:text-nature-primary hover:bg-gray-100 rounded-full transition-all z-50"><ChevronRight size={32} /></button>

      <div className="w-full h-full p-8 flex items-center justify-center overflow-auto">
        <img src={lightboxImages[lightboxIndex].data} className="max-h-full max-w-full object-contain shadow-2xl rounded-sm" alt="lightbox view" />
      </div>

      <div className="absolute bottom-8 left-0 w-full flex justify-center gap-3">
        {lightboxImages.map((img, idx) => (
          <img key={idx} src={img.data} onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }} className={`w-20 h-20 object-cover border-2 cursor-pointer rounded-lg transition-all ${idx === lightboxIndex ? 'border-nature-primary opacity-100' : 'border-transparent opacity-70 hover:opacity-100 hover:border-nature-primary'}`} alt="thumbnail" />
        ))}
      </div>
    </div>
  );
};
