import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, CreditCard, Image as ImageIcon } from 'lucide-react';
import type { Category, Priority, LocationItem, ReservationStatus } from '../../types';
import { getCatGroup, getCatConfig, CAT_LABELS } from '../../constants';
import { CustomSelect } from '../ui/CustomSelect';
import { ActivityTypePicker } from './ActivityTypePicker';
import { useAppStore } from '../../store';
import { useTripVariants } from '../../hooks/useTripData';

interface LocationFormProps {
  isFormPanelOpen: boolean;
  setIsFormPanelOpen: (isOpen: boolean) => void;
  formId: number | null;
  formPriority: Priority;
  setFormPriority: (p: Priority) => void;
  formCat: Category;
  setFormCat: (c: Category) => void;
  formSlot: string;
  setFormSlot: (s: string) => void;
  formCurrency: string;
  setFormCurrency: (c: string) => void;
  tempImages: { data: string, name: string }[];
  setTempImages: React.Dispatch<React.SetStateAction<{ data: string, name: string }[]>>;
  tempAttachments: { data: string, name: string }[];
  setTempAttachments: React.Dispatch<React.SetStateAction<{ data: string, name: string }[]>>;
  handleAddLocation: (e: React.FormEvent<HTMLFormElement>) => void;
  handleFiles: (files: FileList | null) => void;
  resetForm: () => void;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
}

export const LocationForm = ({
  isFormPanelOpen, setIsFormPanelOpen, formId, formPriority, setFormPriority, formCat, setFormCat,
  formSlot, setFormSlot, formCurrency, setFormCurrency,
  tempImages, setTempImages, tempAttachments, setTempAttachments, handleAddLocation, handleFiles, resetForm, locations,
}: LocationFormProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'time' | 'finance' | 'assets'>('general');
  const [resStatus, setResStatus] = useState<ReservationStatus>('idea');
  const [durHours, setDurHours] = useState<number | string>('');
  const [durMins, setDurMins] = useState<number | string>('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');

  const { activeGlobalVariantId, setIsTripSettingsOpen } = useAppStore();
  const { data: tripVariants = [] } = useTripVariants();
  const activeVariant = tripVariants.find(v => v.id === activeGlobalVariantId);
  const predefinedCities = activeVariant?.cities || [];

  const catGroup = getCatGroup(formCat);
  const catConfig = getCatConfig(formCat);

  // Load existing status when editing
  useEffect(() => {
    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing && existing.reservationStatus) setResStatus(existing.reservationStatus);
      if (existing && existing.durationMinutes !== undefined) {
        setDurHours(Math.floor(existing.durationMinutes / 60) || '');
        setDurMins(existing.durationMinutes % 60 || '');
      } else {
        setDurHours('');
        setDurMins('');
      }

      // Initialize tags
      if (existing && existing.tags) {
        setCurrentTags([...existing.tags]);
      } else {
        setCurrentTags([]);
      }
    } else {
      setResStatus('idea');
      setActiveTab('general');
      setDurHours('');
      setDurMins('');
      setCurrentTags([]);
    }
  }, [formId, locations]);

  // Extract unique cities for datalist
  const availableCities = Array.from(new Set(locations.map(l => l.city).filter(Boolean))) as string[];

  // Global paste handler
  useEffect(() => {
    if (!isFormPanelOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.clipboardData) {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          handleFiles(e.clipboardData.files);
          setActiveTab('assets');
          return;
        }

        const text = e.clipboardData.getData('text');
        if (text) {
          const form = document.getElementById('mainForm') as HTMLFormElement;
          if (form) {
            const titleInput = form.elements.namedItem('title') as HTMLInputElement;
            if (titleInput) {
              const linkInput = form.elements.namedItem('link') as HTMLInputElement;
              if (text.startsWith('http') && linkInput && !linkInput.value) {
                linkInput.value = text;
              } else {
                titleInput.value = text;
              }
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isFormPanelOpen, handleFiles]);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const inputStatus = document.createElement('input');
    inputStatus.type = 'hidden';
    inputStatus.name = 'reservationStatus';
    inputStatus.value = resStatus;
    e.currentTarget.appendChild(inputStatus);

    const totalMins = (Number(durHours || 0) * 60) + Number(durMins || 0);
    const inputDur = document.createElement('input');
    inputDur.type = 'hidden';
    inputDur.name = 'durationMinutes';
    inputDur.value = totalMins > 0 ? totalMins.toString() : '';
    e.currentTarget.appendChild(inputDur);

    // Inject tags
    const inputTags = document.createElement('input');
    inputTags.type = 'hidden';
    inputTags.name = 'tags';
    inputTags.value = currentTags.join(',');
    e.currentTarget.appendChild(inputTags);

    handleAddLocation(e);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      const val = tagInputValue.trim().replace(/,/g, '');
      if (val && !currentTags.includes(val)) {
        setCurrentTags([...currentTags, val]);
      }
      setTagInputValue('');
    } else if (e.key === 'Backspace' && !tagInputValue && currentTags.length > 0) {
      setCurrentTags(currentTags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(t => t !== tagToRemove));
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === id ? 'border-nature-primary text-nature-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
    >
      <Icon size={14} /> {label}
    </button>
  );

  // Derive tab labels based on category
  const formTitle = formId
    ? `Editar ${CAT_LABELS[formCat] || 'Actividad'}`
    : `${catGroup === 'transport' ? 'Nuevo Transporte' : catGroup === 'accommodation' ? 'Nuevo Alojamiento' : 'Nueva Actividad'}`;

  const tabLabels = {
    general: catGroup === 'transport' ? 'Transporte' : catGroup === 'accommodation' ? 'Hotel' : 'Lugar',
    time: 'Horarios',
    finance: 'Reserva',
    assets: catGroup === 'transport' ? 'Billete' : 'Archivos',
  };

  return (
    <div className={`w-full md:w-[480px] shrink-0 bg-white border-r border-gray-100 flex flex-col z-[520] shadow-[10px_0_30px_rgba(0,0,0,0.1)] h-full absolute top-0 bottom-0 left-0 transform ${isFormPanelOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
      <button type="button" onClick={() => setIsFormPanelOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-nature-primary z-50 bg-white/50 rounded-full backdrop-blur transition-colors"><X size={24} /></button>

      <div className="p-8 pb-4 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-1">
          {catConfig && <span className="text-3xl">{catConfig.icon}</span>}
          <h2 className="text-3xl font-sans text-nature-primary">{formTitle}</h2>
        </div>
        <p className="text-xs text-gray-500">
          {catGroup === 'transport' ? 'Configura los detalles de tu trayecto.' :
            catGroup === 'accommodation' ? 'Configura tu estancia.' :
              'Diseña tu experiencia con precisión.'}
        </p>
      </div>

      <div className="flex px-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
        <TabButton id="general" label={tabLabels.general} icon={MapPin} />
        <TabButton id="time" label={tabLabels.time} icon={Calendar} />
        <TabButton id="finance" label={tabLabels.finance} icon={CreditCard} />
        <TabButton id="assets" label={tabLabels.assets} icon={ImageIcon} />
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scroll">
        <form id="mainForm" onSubmit={onFormSubmit} className="space-y-8">

          {/* ═══ TAB: GENERAL ═══ */}
          <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>

            {/* Type Picker */}
            <ActivityTypePicker value={formCat} onChange={setFormCat} />

            {/* Title */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">
                {catGroup === 'accommodation' ? 'Nombre del Hotel' : catGroup === 'transport' ? 'Título / Descripción' : 'Título (Opcional)'}
              </label>
              <input name="title" type="text" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 outline-none text-xs transition-all font-bold"
                placeholder={catGroup === 'accommodation' ? 'Ej. Hotel Hilton Barcelona' : catGroup === 'transport' ? 'Ej. Vuelo a Madrid' : 'Ej. Visita al Coliseo'} />
            </div>

            {/* ── Activity-specific fields ── */}
            {catGroup === 'activity' && (
              <>
                <div>
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Google Maps Link (Opcional)</label>
                  <input name="link" type="url" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 outline-none text-xs transition-all" placeholder="https://maps.app.goo.gl/..." />
                  <input name="mapCoords" type="hidden" />
                </div>

                <div id="coordsDisplay" className="hidden">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">📍 Coordenadas</label>
                  <input name="coordsReadonly" type="text" readOnly className="w-full bg-nature-mint/20 border border-nature-primary/20 rounded-xl p-4 text-nature-primary outline-none text-xs font-mono cursor-default" />
                </div>

                {formCat === 'food' && (
                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Tipo de Comida</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['breakfast', 'lunch', 'dinner', 'snack', 'tapas'] as const).map(meal => (
                        <label key={meal} className="cursor-pointer">
                          <input type="radio" name="mealType" value={meal} className="peer hidden" />
                          <div className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-400 peer-checked:bg-nature-accent peer-checked:text-white peer-checked:border-nature-accent transition-all">
                            {meal === 'breakfast' ? '🌅 Desayuno' : meal === 'lunch' ? '☀️ Almuerzo' : meal === 'dinner' ? '🌙 Cena' : meal === 'snack' ? '🍿 Snack' : '🍺 Tapas'}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formCat === 'photos' && (
                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Mejor Momento para Fotos</label>
                    <input name="bestTimeHint" type="text" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 outline-none text-xs transition-all" placeholder="Ej. Golden hour 18:30, amanecer..." />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase block">Ciudad / Zona</label>
                      {predefinedCities.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setIsTripSettingsOpen(true)}
                          className="text-[9px] text-nature-primary hover:underline font-bold uppercase tracking-wider"
                        >
                          Configurar Ciudades
                        </button>
                      )}
                    </div>
                    {predefinedCities.length > 0 ? (
                      <select name="city" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text outline-none text-xs transition-all font-bold cursor-pointer">
                        <option value="">Seleccionar ciudad...</option>
                        {predefinedCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    ) : (
                      <>
                        <input name="city" list="cities-list" type="text" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 outline-none text-xs transition-all" placeholder="Ej. Dubai Marina, Tokio..." />
                        <datalist id="cities-list">
                          {availableCities.map(city => <option key={city} value={city} />)}
                        </datalist>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Etiquetas (Enter para añadir)</label>
                    <div className="w-full bg-gray-50 border border-gray-100 focus-within:border-nature-mint focus-within:bg-white rounded-xl p-2.5 flex flex-wrap gap-2 transition-all min-h-[50px] items-center">
                      {currentTags.map(tag => (
                        <span key={tag} className="bg-nature-mint text-nature-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                          #{tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 bg-white/50 rounded-full p-0.5 transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={tagInputValue}
                        onChange={(e) => setTagInputValue(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        className="flex-1 min-w-[100px] bg-transparent outline-none text-xs text-nature-text placeholder-gray-300"
                        placeholder={currentTags.length === 0 ? "Ej. playa, relax..." : ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input type="radio" name="priority" value="optional" checked={formPriority === 'optional'} onChange={() => setFormPriority('optional')} className="peer hidden" />
                    <div className="py-3 text-center rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-400 peer-checked:bg-nature-mint peer-checked:text-nature-primary peer-checked:border-nature-mint transition-all">Opcional</div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="priority" value="necessary" checked={formPriority === 'necessary'} onChange={() => setFormPriority('necessary')} className="peer hidden" />
                    <div className="py-3 text-center rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-400 peer-checked:bg-nature-primary peer-checked:text-white peer-checked:border-nature-primary transition-all">Esencial</div>
                  </label>
                </div>
              </>
            )}

            {/* ── Transport-specific fields ── */}
            {catGroup === 'transport' && (
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500 italic text-lg">✈️</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-800/40">Detalles del Transporte</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Compañía</label>
                    <input name="company" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Ej. Ryanair, Alsa..." />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">
                      {formCat.startsWith('flight') ? 'Nº Vuelo' : formCat.startsWith('train') ? 'Nº Tren/Línea' : 'Nº Línea'}
                    </label>
                    <input name="flightNumber" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none" placeholder="FR1234" />
                  </div>
                </div>

                {(formCat.startsWith('flight') || formCat === 'airport-wait') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Terminal</label>
                      <input name="terminal" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="T1, T4S..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerta</label>
                      <input name="gate" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="B24" />
                    </div>
                  </div>
                )}

                {(formCat.startsWith('bus') || formCat.startsWith('train')) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Estación</label>
                      <input name="station" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Estación Sur..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Andén</label>
                      <input name="platform" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Andén 3" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Asiento</label>
                    <input name="seat" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="12A" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Confirmación / PNR</label>
                    <input name="logisticsConfirmation" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none" placeholder="ABC123" />
                  </div>
                </div>

                {formCat === 'taxi' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto de Recogida</label>
                      <input name="pickupPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Hotel lobby..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">App / Servicio</label>
                      <input name="transportApp" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Uber, Bolt..." />
                    </div>
                  </div>
                )}

                {formCat === 'car-rental' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto Recogida</label>
                      <input name="pickupPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Aeropuerto T1..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto Devolución</label>
                      <input name="dropoffPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Ciudad centro..." />
                    </div>
                  </div>
                )}

                {formCat === 'transfer' && (
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto de Recogida</label>
                    <input name="pickupPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Terminal 2 Llegadas..." />
                  </div>
                )}

                {(formCat === 'ferry') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerto Salida</label>
                      <input name="pickupPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Puerto de Barcelona..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerto Llegada</label>
                      <input name="dropoffPoint" type="text" className="w-full bg-white border border-blue-100 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Puerto de Palma..." />
                    </div>
                  </div>
                )}

                {/* Hidden fields for coords and link (transport can optionally have them) */}
                <input name="link" type="hidden" />
                <input name="mapCoords" type="hidden" />
              </div>
            )}

            {/* ── Accommodation-specific fields ── */}
            {catGroup === 'accommodation' && (
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-600 text-lg">🏨</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800/40">Detalles del Alojamiento</span>
                </div>

                <div>
                  <label className="text-[9px] tracking-wider font-bold text-amber-700/60 uppercase mb-2 block">Dirección</label>
                  <input name="address" type="text" className="w-full bg-white border border-amber-100 focus:border-amber-400 rounded-xl p-3 text-xs outline-none" placeholder="C/ Gran Via 123, Barcelona..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-amber-700/60 uppercase mb-2 block">Nº Habitación</label>
                    <input name="roomNumber" type="text" className="w-full bg-white border border-amber-100 focus:border-amber-400 rounded-xl p-3 text-xs outline-none" placeholder="Suite 401" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-amber-700/60 uppercase mb-2 block">Confirmación</label>
                    <input name="logisticsConfirmation" type="text" className="w-full bg-white border border-amber-100 focus:border-amber-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none" placeholder="CONF123" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] tracking-wider font-bold text-amber-700/60 uppercase mb-2 block">Google Maps Link (Opcional)</label>
                  <input name="link" type="url" className="w-full bg-white border border-amber-100 focus:border-amber-400 rounded-xl p-3 text-xs outline-none" placeholder="https://maps.app.goo.gl/..." />
                  <input name="mapCoords" type="hidden" />
                </div>

                <div id="coordsDisplay" className="hidden">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">📍 Coordenadas</label>
                  <input name="coordsReadonly" type="text" readOnly className="w-full bg-nature-mint/20 border border-nature-primary/20 rounded-xl p-4 text-nature-primary outline-none text-xs font-mono cursor-default" />
                </div>

                {formCat === 'hotel-checkout' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="lateCheckout" className="accent-amber-600 w-4 h-4" />
                    <span className="text-xs font-bold text-amber-700">Late Checkout</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* ═══ TAB: HORARIOS ═══ */}
          <div className={`${activeTab === 'time' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div className="flex gap-4">
              {catGroup === 'activity' && (
                <div className="w-1/2">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Momento del día</label>
                  <CustomSelect
                    name="slot"
                    value={formSlot}
                    onChange={setFormSlot}
                    options={[
                      { value: 'Mañana', label: 'Mañana' },
                      { value: 'Tarde', label: 'Tarde' },
                      { value: 'Noche', label: 'Noche' }
                    ]}
                    buttonClassName="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-nature-text font-bold"
                  />
                </div>
              )}
              <div className={catGroup === 'activity' ? 'w-1/2' : 'flex-1'}>
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
                  <span>
                    {catGroup === 'transport' ? (formCat.includes('arrival') ? 'Hora Llegada' : 'Hora Salida') :
                      catGroup === 'accommodation' ? (formCat === 'hotel-checkout' ? 'Hora Check-out' : 'Hora Check-in') :
                        'Inicio (Opcional)'}
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer" title="Fijar esta hora exacta (No recálcular)">
                    <input type="checkbox" name="isPinnedTime" className="accent-nature-primary w-3 h-3" />
                    <span className="normal-case text-[9px] text-nature-primary opacity-80">Fijar Hora</span>
                  </label>
                </label>
                <input name="datetime" type="datetime-local" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-3 text-xs outline-none text-nature-primary transition-all" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">
                  {catGroup === 'accommodation' ? (formCat === 'hotel-checkin' ? 'Check-out' : 'Check-in') : 'Fin / Hora Llegada'}
                </label>
                <input name="checkOutDatetime" type="datetime-local" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-3 text-xs outline-none transition-all" />
              </div>
              <div className="w-1/2">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Duración</label>
                <div className="flex bg-gray-50 border border-gray-100 focus-within:border-nature-mint focus-within:bg-white rounded-xl overflow-hidden transition-all">
                  <input type="number" min="0" value={durHours} onChange={e => setDurHours(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="H" />
                  <div className="w-px bg-gray-200 my-2"></div>
                  <input type="number" min="0" max="59" step="5" value={durMins} onChange={e => setDurMins(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="Min" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Notas</label>
              <textarea name="notes" rows={4} className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 resize-none text-sm outline-none leading-relaxed transition-all"
                placeholder={catGroup === 'transport' ? 'Info del trayecto, escalas...' : catGroup === 'accommodation' ? 'Wifi, desayuno incluido...' : 'Recordar entradas, dress code...'}></textarea>
            </div>
          </div>

          {/* ═══ TAB: RESERVA ═══ */}
          <div className={`${activeTab === 'finance' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-3 block">Estado</label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(['idea', 'pending', 'booked'] as ReservationStatus[]).map(status => (
                  <button type="button" key={status} onClick={() => setResStatus(status)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${resStatus === status ? 'bg-white text-nature-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {status === 'idea' ? 'Idea' : status === 'pending' ? 'Falta' : 'Reservado'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Coste/Precio</label>
                <input name="priceAmount" type="number" step="0.01" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-lg font-mono outline-none transition-all" placeholder="0.00" />
                <input name="cost" type="hidden" value="0" />
              </div>
              <div className="flex-[0.5]">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Divisa</label>
                <CustomSelect
                  name="priceCurrency"
                  value={formCurrency}
                  onChange={setFormCurrency}
                  options={[
                    { value: 'EUR', label: '€ EUR' },
                    { value: 'USD', label: '$ USD' },
                    { value: 'GBP', label: '£ GBP' },
                    { value: 'JPY', label: '¥ JPY' },
                    { value: 'AED', label: 'د.إ AED' },
                    { value: 'SGD', label: 'S$ SGD' },
                    { value: 'MYR', label: 'RM MYR' },
                  ]}
                  buttonClassName="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold text-nature-text"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Referencia (Booking/Vuelo)</label>
              <input name="bookingRef" type="text" className="w-full bg-gray-50 border text-center font-mono tracking-widest uppercase border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-3 text-sm outline-none placeholder-gray-200 transition-all" placeholder="XYZ123" />
            </div>
          </div>

          {/* ═══ TAB: ARCHIVOS ═══ */}
          <div className={`${activeTab === 'assets' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-200 hover:border-nature-primary hover:bg-nature-mint/30 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group shadow-sm hover:shadow-md">
                <ImageIcon size={32} className="text-gray-300 group-hover:text-nature-primary mb-3 transition-colors" />
                <p className="text-xs text-gray-400 group-hover:text-nature-primary font-medium">
                  {catGroup === 'transport' ? 'Billetes, Boarding Pass, Confirmaciones' : 'Fotos y Documentos'}
                </p>
                <input type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </label>

            {tempImages.length > 0 && (
              <div>
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Imágenes</label>
                <div className="grid grid-cols-4 gap-2">
                  {tempImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.data} alt="temp" className="w-full aspect-square object-cover rounded-xl shadow-sm border border-gray-100" />
                      <button type="button" onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-400 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tempAttachments.length > 0 && (
              <div>
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Documentos / Adjuntos</label>
                <div className="space-y-2">
                  {tempAttachments.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-nature-mint/10 border border-nature-primary/10 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-lg">📄</span>
                        <span className="text-xs font-bold text-nature-primary truncate">{f.name}</span>
                      </div>
                      <button type="button" onClick={() => setTempAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-red-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky footer for submit */}
          <div className="pt-6 sticky bottom-0 bg-white border-t border-gray-50">
            <button type="submit" className={`w-full ${formId ? 'bg-gray-800' : 'bg-nature-primary'} text-white font-bold tracking-wide py-4 text-sm rounded-xl shadow-[0_10px_20px_-10px_rgba(45,90,39,0.5)] hover:shadow-2xl hover:-translate-y-0.5 transition-all transform active:scale-[0.98]`}
              style={!formId && catConfig ? { backgroundColor: catConfig.color } : {}}>
              {formId ? 'Confirmar Edición' : `Añadir ${CAT_LABELS[formCat] || 'Actividad'}`}
            </button>
            {formId && <button type="button" onClick={resetForm} className="w-full text-xs text-gray-400 hover:text-red-500 py-3 font-bold uppercase tracking-widest mt-2 transition-colors">Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
};
