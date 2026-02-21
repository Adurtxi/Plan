import { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store';

interface DetailModalProps {
  onEdit: (id: number) => void;
}

export const DetailModal = ({ onEdit }: DetailModalProps) => {
  const { locations, selectedLocationId, setSelectedLocationId, deleteLocation, openLightbox } = useAppStore();
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedLocationId && e.key === 'Escape') setSelectedLocationId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLocationId, setSelectedLocationId]);

  if (!selectedLocation) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nature-primary/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLocationId(null)}></div>
      <div className="bg-white rounded-bento shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] w-full max-w-4xl relative z-10 animate-[fadeIn_0.3s_ease-out]">
        <div className="md:w-5/12 bg-gray-100 relative h-64 md:h-auto group cursor-pointer overflow-hidden" onClick={() => { if (selectedLocation.images.length) openLightbox(selectedLocation.images) }}>
          {selectedLocation.images?.length > 0 ? (
            <img src={selectedLocation.images[0].data} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300"><span className="text-4xl mb-2">📷</span><span className="text-xs">Sin fotos</span></div>
          )}
          {selectedLocation.images?.length > 0 && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-bold border border-white px-4 py-2 rounded-full backdrop-blur-md">Ver Galería</span>
            </div>
          )}
        </div>
        <div className="md:w-7/12 p-10 overflow-y-auto custom-scroll flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-nature-textLight">{selectedLocation.cat}</span>
            <button onClick={() => setSelectedLocationId(null)} className="text-gray-400 hover:text-nature-primary transition-colors"><X size={24} /></button>
          </div>
          <h2 className="text-4xl font-serif text-nature-text mb-6 leading-tight">{selectedLocation.title || selectedLocation.notes.split("\n")[0] || "Ubicación sin nombre"}</h2>
          <div className="flex gap-3 mb-8">
            <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">{selectedLocation.priority === 'necessary' ? 'Esencial' : 'Opcional'}</span>
            <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint text-nature-primary">{selectedLocation.cost ? `${selectedLocation.cost} €` : '0 €'}</span>
          </div>
          <div className="prose prose-sm text-gray-600 mb-8 font-light leading-relaxed whitespace-pre-wrap">{selectedLocation.notes}</div>

          <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
            <a href={selectedLocation.link} target="_blank" rel="noreferrer" className="flex-1 text-center py-3 rounded-xl bg-nature-primary text-white font-medium hover:bg-opacity-90 transition-all text-sm">Ver Mapa</a>
            <button onClick={() => onEdit(selectedLocation.id)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-medium">Editar</button>
            <button onClick={() => { if (confirm("¿Eliminar este destino?")) { deleteLocation(selectedLocation.id); setSelectedLocationId(null); } }} className="px-4 py-3 rounded-xl text-red-400 hover:bg-red-50 transition-all"><Trash2 size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
