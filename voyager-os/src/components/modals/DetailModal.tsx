import { useEffect } from 'react';
import { X, Trash2, Copy, Clock, UploadCloud } from 'lucide-react';
import { useAppStore } from '../../store';

interface DetailModalProps {
  onEdit: (id: number) => void;
}

export const DetailModal = ({ onEdit }: DetailModalProps) => {
  const { locations, selectedLocationId, setSelectedLocationId, deleteLocation, openLightbox, showDialog, addToast, updateLocation, addLocation } = useAppStore();
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedLocationId && e.key === 'Escape') setSelectedLocationId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocationId, setSelectedLocationId]);

  if (!selectedLocation) return null;

  const handleQuickUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const files = e.target?.files;
      if (!files) return;
      const newImages: { data: string, name: string }[] = [];
      let processed = 0;

      Array.from(files as FileList).forEach(f => {
        if (f.type.startsWith('image/')) {
          const reader = new FileReader(); reader.readAsDataURL(f);
          reader.onload = (re) => {
            const img = new Image(); img.src = re.target?.result as string;
            img.onload = () => {
              const c = document.createElement("canvas"); const max = 1000;
              let w = img.width, h = img.height;
              if (w > max) { h = Math.round((h * max) / w); w = max; }
              c.width = w; c.height = h; c.getContext("2d")?.drawImage(img, 0, 0, w, h);
              newImages.push({ data: c.toDataURL("image/webp", 0.8), name: f.name });
              processed++;
              if (processed === files.length) {
                updateLocation({ ...selectedLocation, images: [...(selectedLocation.images || []), ...newImages] });
                addToast('Fotos añadidas a la galería', 'success');
              }
            };
          }
        } else {
          processed++;
        }
      });
    };
    input.click();
  };

  const handleDuplicate = () => {
    const newLoc = {
      ...selectedLocation,
      id: Date.now(),
      groupId: undefined, // Don't inherit groups
      datetime: undefined, // Clear time to avoid conflicts
      title: `${selectedLocation.title || selectedLocation.cat} (Copia)`
    };
    addLocation(newLoc);
    setSelectedLocationId(newLoc.id);
    addToast('Actividad duplicada', 'success');
  };

  const formattedTime = selectedLocation.datetime ? new Date(selectedLocation.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isFreeTime = selectedLocation.cat === 'free';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nature-primary/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLocationId(null)}></div>
      <div className="bg-white rounded-bento shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] w-full max-w-4xl relative z-10 animate-[fadeIn_0.3s_ease-out]">
        {/* LEFT PANE - GALLERY */}
        {!isFreeTime && (
          <div className="md:w-5/12 bg-gray-100 relative h-64 md:h-auto group overflow-hidden">
            {selectedLocation.images?.length > 0 ? (
              <div className="w-full h-full cursor-pointer" onClick={() => openLightbox(selectedLocation.images)}>
                <img src={selectedLocation.images[0].data} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-bold border border-white px-4 py-2 rounded-full backdrop-blur-md">Ver Galería</span>
                </div>
              </div>
            ) : (
              <button onClick={handleQuickUpload} className="w-full h-full flex flex-col items-center justify-center text-nature-primary/40 bg-nature-mint/10 border-r border-gray-100 hover:bg-nature-mint/20 hover:text-nature-primary transition-all">
                <UploadCloud size={48} strokeWidth={1} className="mb-3 opacity-50" />
                <span className="text-sm font-medium">Añadir Fotos</span>
                <span className="text-[10px] mt-1 text-gray-400">Click para subir galería</span>
              </button>
            )}
          </div>
        )}

        {/* RIGHT PANE - DETAILS */}
        <div className={`${isFreeTime ? 'w-full' : 'md:w-7/12'} p-10 overflow-y-auto custom-scroll flex flex-col`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-nature-textLight">{selectedLocation.cat}</span>
            <button onClick={() => setSelectedLocationId(null)} className="text-gray-400 hover:text-nature-primary transition-colors"><X size={24} /></button>
          </div>
          <h2 className="text-4xl font-serif text-nature-text mb-6 leading-tight">
            {isFreeTime ? selectedLocation.title || 'Tiempo Libre' : selectedLocation.title || selectedLocation.notes?.split("\n")[0] || "Ubicación sin nombre"}
          </h2>

          <div className="flex gap-3 mb-8 items-center flex-wrap">
            {!isFreeTime && (
              <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                {selectedLocation.priority === 'necessary' ? 'Esencial' : 'Opcional'}
              </span>
            )}
            {formattedTime && (
              <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1.5">
                <Clock size={12} /> {formattedTime}
              </span>
            )}
            {selectedLocation.durationMinutes && (
              <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint/30 text-nature-primary flex items-center gap-1.5 border border-nature-primary/20">
                <Clock size={12} /> {selectedLocation.durationMinutes >= 60 ? `${Math.floor(selectedLocation.durationMinutes / 60)}h ${selectedLocation.durationMinutes % 60 ? (selectedLocation.durationMinutes % 60) + 'm' : ''}` : `${selectedLocation.durationMinutes}m`}
              </span>
            )}
            {!isFreeTime && (
              <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint text-nature-primary">
                {selectedLocation.newPrice?.amount
                  ? `${selectedLocation.newPrice.amount.toFixed(2)} ${selectedLocation.newPrice.currency === 'EUR' ? '€' : selectedLocation.newPrice.currency}`
                  : (selectedLocation.cost ? `${selectedLocation.cost} €` : '0 €')}
              </span>
            )}
          </div>

          <div className="prose prose-sm text-gray-600 mb-8 font-light leading-relaxed whitespace-pre-wrap">
            {selectedLocation.notes || (isFreeTime ? "Bloque de tiempo sin asignar. Úsalo para descansar o reasignarlo más tarde." : "Añade notas útiles para esta actividad.")}
          </div>

          <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
            {!isFreeTime && selectedLocation.link && selectedLocation.link.startsWith('http') && (
              <a href={selectedLocation.link} target="_blank" rel="noreferrer" className="flex-1 max-w-[140px] text-center py-3 rounded-xl bg-nature-primary text-white font-medium hover:bg-opacity-90 transition-all text-sm">Ver Mapa</a>
            )}
            <button onClick={() => {
              setSelectedLocationId(null);
              // Small delay to let modal close before opening form
              setTimeout(() => onEdit(selectedLocation.id), 50);
            }} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium">
              Editar
            </button>
            <button onClick={handleDuplicate} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-nature-primary transition-all" title="Duplicar">
              <Copy size={20} />
            </button>
            <button onClick={() => {
              showDialog({
                type: 'confirm',
                title: 'Eliminar destino',
                message: `¿Seguro que quieres eliminar "${selectedLocation.title || selectedLocation.cat}" de tu viaje?`,
                confirmText: 'Eliminar',
                isDestructive: true,
                onConfirm: () => {
                  deleteLocation(selectedLocation.id);
                  setSelectedLocationId(null);
                  addToast('Actividad eliminada', 'success');
                }
              });
            }} className="px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all"><Trash2 size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
