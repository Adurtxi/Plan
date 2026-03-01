import { useEffect } from 'react';
import { X, Trash2, Copy, Clock, UploadCloud, Plane, MapPin, Building2, Ticket, Layers } from 'lucide-react';
import { useAppStore } from '../../store';
import { CAT_ICONS, CAT_LABELS, CAT_COLORS, getCatGroup, isTransportCat, isAccommodationCat } from '../../constants';
import { useLocations, useAddLocation, useUpdateLocation, useDeleteLocation } from '../../hooks/useTripData';

interface DetailModalProps {
  onEdit: (id: number) => void;
}

export const DetailModal = ({ onEdit }: DetailModalProps) => {
  const { selectedLocationId, setSelectedLocationId, openLightbox, showDialog, addToast } = useAppStore();
  const { data: locations = [] } = useLocations();
  const { mutateAsync: addLocation } = useAddLocation();
  const { mutateAsync: updateLocation } = useUpdateLocation();
  const { mutateAsync: deleteLocation } = useDeleteLocation();

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
      groupId: undefined,
      datetime: undefined,
      title: `${selectedLocation.title || selectedLocation.cat} (Copia)`
    };
    addLocation(newLoc);
    setSelectedLocationId(newLoc.id);
    addToast('Actividad duplicada', 'success');
  };

  const formattedTime = selectedLocation.datetime ? new Date(selectedLocation.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isFreeTime = selectedLocation.cat === 'free';
  const catGroup = getCatGroup(selectedLocation.cat);
  const catColor = CAT_COLORS[selectedLocation.cat] || '#2D5A27';
  const catLabel = CAT_LABELS[selectedLocation.cat] || selectedLocation.cat;
  const catIcon = CAT_ICONS[selectedLocation.cat] || '📍';

  // ─── Transport Detail Pane ───
  const TransportDetailPane = () => (
    <div className="space-y-6">
      {/* Big icon + type */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${catColor}15` }}>
          {catIcon}
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: catColor }}>{catLabel}</span>
          <h2 className="text-3xl font-sans text-nature-text leading-tight">
            {selectedLocation.title || catLabel}
          </h2>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {selectedLocation.company && (
          <InfoChip label="Compañía" value={selectedLocation.company} icon={<Plane size={12} />} />
        )}
        {selectedLocation.flightNumber && (
          <InfoChip label="Nº Vuelo/Línea" value={selectedLocation.flightNumber} mono />
        )}
        {selectedLocation.terminal && (
          <InfoChip label="Terminal" value={selectedLocation.terminal} />
        )}
        {selectedLocation.gate && (
          <InfoChip label="Puerta" value={selectedLocation.gate} />
        )}
        {selectedLocation.station && (
          <InfoChip label="Estación" value={selectedLocation.station} icon={<Building2 size={12} />} />
        )}
        {selectedLocation.platform && (
          <InfoChip label="Andén" value={selectedLocation.platform} />
        )}
        {selectedLocation.seat && (
          <InfoChip label="Asiento" value={selectedLocation.seat} mono />
        )}
        {(selectedLocation.logisticsConfirmation || selectedLocation.bookingRef) && (
          <InfoChip label="PNR / Confirmación" value={selectedLocation.logisticsConfirmation || selectedLocation.bookingRef || ''} mono highlight />
        )}
        {selectedLocation.pickupPoint && (
          <InfoChip label="Recogida" value={selectedLocation.pickupPoint} icon={<MapPin size={12} />} />
        )}
        {selectedLocation.dropoffPoint && (
          <InfoChip label="Destino/Devolución" value={selectedLocation.dropoffPoint} icon={<MapPin size={12} />} />
        )}
        {selectedLocation.city && (
          <InfoChip label="Ciudad / ZONA" value={selectedLocation.city} icon={<MapPin size={12} />} />
        )}
        {selectedLocation.transportApp && (
          <InfoChip label="App" value={selectedLocation.transportApp} />
        )}
      </div>

      {/* Time */}
      <div className="flex gap-3 flex-wrap">
        {formattedTime && (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1.5 border border-blue-100">
            <Clock size={12} /> {formattedTime}
          </span>
        )}
        {selectedLocation.durationMinutes && (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-blue-50 text-blue-500 flex items-center gap-1.5 border border-blue-100">
            <Clock size={12} /> {selectedLocation.durationMinutes >= 60 ? `${Math.floor(selectedLocation.durationMinutes / 60)}h ${selectedLocation.durationMinutes % 60 ? (selectedLocation.durationMinutes % 60) + 'm' : ''}` : `${selectedLocation.durationMinutes}m`}
          </span>
        )}
        {selectedLocation.newPrice?.amount ? (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint text-nature-primary">
            {selectedLocation.newPrice.amount.toFixed(2)} {selectedLocation.newPrice.currency === 'EUR' ? '€' : selectedLocation.newPrice.currency}
          </span>
        ) : null}
      </div>

      {/* Attachments (tickets) */}
      {selectedLocation.attachments?.length > 0 && (
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2 block">Billetes / Documentos</span>
          <div className="space-y-2">
            {selectedLocation.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Ticket size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-blue-700 truncate">{att.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {selectedLocation.notes && (
        <div className="prose prose-sm text-gray-600 font-light leading-relaxed whitespace-pre-wrap">{selectedLocation.notes}</div>
      )}
    </div>
  );

  // ─── Accommodation Detail Pane ───
  const AccommodationDetailPane = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-amber-50">🏨</div>
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600">{catLabel}</span>
          <h2 className="text-3xl font-sans text-nature-text leading-tight">
            {selectedLocation.title || selectedLocation.hotelName || 'Hotel'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {selectedLocation.address && (
          <InfoChip label="Dirección" value={selectedLocation.address} icon={<MapPin size={12} />} fullWidth />
        )}
        {selectedLocation.city && (
          <InfoChip label="Ciudad / ZONA" value={selectedLocation.city} icon={<MapPin size={12} />} />
        )}
        {selectedLocation.roomNumber && (
          <InfoChip label="Habitación" value={selectedLocation.roomNumber} />
        )}
        {(selectedLocation.logisticsConfirmation || selectedLocation.bookingRef) && (
          <InfoChip label="Confirmación" value={selectedLocation.logisticsConfirmation || selectedLocation.bookingRef || ''} mono highlight />
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        {formattedTime && (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1.5 border border-amber-100">
            <Clock size={12} /> {selectedLocation.cat === 'hotel-checkin' ? 'Check-in' : 'Check-out'}: {formattedTime}
          </span>
        )}
        {selectedLocation.checkOutDatetime && (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-1.5 border border-amber-100">
            <Clock size={12} /> {selectedLocation.cat === 'hotel-checkin' ? 'Check-out' : 'Check-in'}: {new Date(selectedLocation.checkOutDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {selectedLocation.lateCheckout && (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">🌙 Late Checkout</span>
        )}
        {selectedLocation.newPrice?.amount ? (
          <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint text-nature-primary">
            {selectedLocation.newPrice.amount.toFixed(2)} {selectedLocation.newPrice.currency === 'EUR' ? '€' : selectedLocation.newPrice.currency}
          </span>
        ) : null}
      </div>

      {selectedLocation.notes && (
        <div className="prose prose-sm text-gray-600 font-light leading-relaxed whitespace-pre-wrap">{selectedLocation.notes}</div>
      )}
    </div>
  );

  // ─── Generic Info Chip ───
  const InfoChip = ({ label, value, icon, mono, highlight, fullWidth }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean; highlight?: boolean; fullWidth?: boolean }) => (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-nature-mint/20 border-nature-primary/20' : 'bg-gray-50 border-gray-100'} ${fullWidth ? 'col-span-2' : ''}`}>
      <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400 block mb-1">{label}</span>
      <div className={`flex items-center gap-1.5 text-sm font-bold ${highlight ? 'text-nature-primary' : 'text-nature-text'} ${mono ? 'font-mono tracking-widest uppercase' : ''}`}>
        {icon} {value}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-nature-primary/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLocationId(null)}></div>
      <div className="bg-white rounded-none md:rounded-bento shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-auto md:max-h-[85vh] w-full md:max-w-4xl relative z-10 animate-[fadeIn_0.3s_ease-out]">

        {/* LEFT PANE - GALLERY (only for activities and accommodation with images) */}
        {catGroup === 'activity' && (
          <div className="md:w-5/12 bg-gray-100 relative h-64 md:h-auto group overflow-hidden">
            {selectedLocation.images?.length > 0 ? (
              <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory custom-scroll hide-scroll-mobile">
                {selectedLocation.images.map((img, i) => (
                  <div key={i} className="min-w-full h-full snap-center relative cursor-pointer" onClick={() => openLightbox(selectedLocation.images, i, selectedLocation.id)}>
                    <img src={img.data} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105" alt="gallery" />
                    {i === 0 && selectedLocation.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                        <Layers size={10} /> 1 / {selectedLocation.images.length}
                      </div>
                    )}
                  </div>
                ))}
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

        {/* Accommodation gallery */}
        {catGroup === 'accommodation' && selectedLocation.images?.length > 0 && (
          <div className="md:w-5/12 bg-gray-100 relative h-64 md:h-auto group overflow-hidden">
            <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory custom-scroll hide-scroll-mobile">
              {selectedLocation.images.map((img, i) => (
                <div key={i} className="min-w-full h-full snap-center relative cursor-pointer" onClick={() => openLightbox(selectedLocation.images)}>
                  <img src={img.data} className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105" alt="gallery" />
                  {i === 0 && selectedLocation.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                      <Layers size={10} /> 1 / {selectedLocation.images.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT PANE - DETAILS */}
        <div className={`${catGroup === 'activity' || (catGroup === 'accommodation' && selectedLocation.images?.length > 0) ? 'md:w-7/12' : 'w-full'} p-10 overflow-y-auto custom-scroll flex flex-col`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{catIcon}</span>
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: catColor }}>{catLabel}</span>
            </div>

            <div className="flex items-center gap-1.5 opacity-80 overflow-x-auto no-scrollbar max-w-[200px]">
              {selectedLocation.tags?.map((tag, i) => (
                <span key={i} className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-nature-mint/30 text-nature-primary border border-nature-primary/10 whitespace-nowrap">#{tag}</span>
              ))}
            </div>

            <button onClick={() => setSelectedLocationId(null)} className="text-gray-400 hover:text-nature-primary transition-colors ml-auto"><X size={24} /></button>
          </div>

          {/* ── Render by type ── */}
          {isTransportCat(selectedLocation.cat) ? (
            <TransportDetailPane />
          ) : isAccommodationCat(selectedLocation.cat) ? (
            <AccommodationDetailPane />
          ) : isFreeTime ? (
            <div>
              <h2 className="text-4xl font-sans text-nature-text mb-6 leading-tight">{selectedLocation.title || 'Tiempo Libre'}</h2>
              <div className="flex gap-3 mb-8 flex-wrap">
                {selectedLocation.durationMinutes && (
                  <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1.5">
                    <Clock size={12} /> {selectedLocation.durationMinutes >= 60 ? `${Math.floor(selectedLocation.durationMinutes / 60)}h ${selectedLocation.durationMinutes % 60 ? (selectedLocation.durationMinutes % 60) + 'm' : ''}` : `${selectedLocation.durationMinutes}m`}
                  </span>
                )}
              </div>
              <div className="prose prose-sm text-gray-600 font-light leading-relaxed whitespace-pre-wrap">
                {selectedLocation.notes || "Bloque de tiempo sin asignar. Úsalo para descansar o reasignarlo más tarde."}
              </div>
            </div>
          ) : (
            /* Activity detail - the classic view */
            <div>
              <h2 className="text-4xl font-sans text-nature-text mb-6 leading-tight">
                {selectedLocation.title || selectedLocation.notes?.split("\n")[0] || "Ubicación sin nombre"}
              </h2>
              <div className="flex gap-3 mb-8 items-center flex-wrap">
                {selectedLocation.city && (
                  <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-primary text-white flex items-center gap-1.5 shadow-sm">
                    <MapPin size={12} /> {selectedLocation.city}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
                  {selectedLocation.priority === 'necessary' ? 'Esencial' : 'Opcional'}
                </span>
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
                <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-nature-mint text-nature-primary">
                  {selectedLocation.newPrice?.amount
                    ? `${selectedLocation.newPrice.amount.toFixed(2)} ${selectedLocation.newPrice.currency === 'EUR' ? '€' : selectedLocation.newPrice.currency}`
                    : (selectedLocation.cost ? `${selectedLocation.cost} €` : '0 €')}
                </span>
                {selectedLocation.mealType && (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">
                    {selectedLocation.mealType === 'breakfast' ? '🌅 Desayuno' : selectedLocation.mealType === 'lunch' ? '☀️ Almuerzo' : selectedLocation.mealType === 'dinner' ? '🌙 Cena' : selectedLocation.mealType === 'snack' ? '🍿 Snack' : '🍺 Tapas'}
                  </span>
                )}
                {selectedLocation.bestTimeHint && (
                  <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700">📸 {selectedLocation.bestTimeHint}</span>
                )}
              </div>
              <div className="prose prose-sm text-gray-600 mb-8 font-light leading-relaxed whitespace-pre-wrap">
                {selectedLocation.notes || "Añade notas útiles para esta actividad."}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-auto pt-6 border-t border-gray-100">
            {selectedLocation.link && selectedLocation.link.startsWith('http') && (
              <a href={selectedLocation.link} target="_blank" rel="noreferrer" className="flex-1 max-w-[140px] text-center py-3 rounded-xl bg-nature-primary text-white font-medium hover:bg-opacity-90 transition-all text-sm">Ver Mapa</a>
            )}
            <button onClick={() => {
              setSelectedLocationId(null);
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
