import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, MapPin, Calendar, CreditCard, Image as ImageIcon } from 'lucide-react';
import type { Category, Priority, LocationItem, ReservationStatus } from '../../types';
import { getCatGroup, getCatConfig, CAT_LABELS } from '../../constants';
import { RASelect } from '../ui/RASelect';
import { RAButton } from '../ui/RAButton';
import { ActivityTypePicker } from './ActivityTypePicker';
import { useAppStore, computeDateForDay } from '../../store';
import { useTripVariants } from '../../hooks/useTripData';
import { combineDayWithTime, calculateCheckoutDatetime, extractTimeFromISO } from '../../utils/dateUtils';

export interface LocationFormInputs {
  title: string;
  link: string;
  mapCoords: string;
  coordsReadonly: string;
  mealType: string;
  bestTimeHint: string;
  city: string;
  tags: string;
  company: string;
  flightNumber: string;
  terminal: string;
  gate: string;
  platform: string;
  seat: string;
  station: string;
  pickupPoint: string;
  dropoffPoint: string;
  transportApp: string;
  address: string;
  roomNumber: string;
  lateCheckout: boolean;
  datetime: string;
  checkOutDatetime: string;
  nights: string | number;
  durHours: string | number;
  durMins: string | number;
  notes: string;
  cost: string;
  priceAmount: string | number;
  bookingRef: string;
  logisticsConfirmation: string;
  logisticsDetail: string;
  isPinnedTime: boolean;
  reservationStatus: string;
  durationMinutes: string;
}

interface LocationFormProps {
  isFormPanelOpen: boolean;
  setIsFormPanelOpen: (isOpen: boolean) => void;
  formId: number | null;
  formPriority: Priority;
  setFormPriority: (p: Priority) => void;
  formCat: Category;
  setFormCat: (c: Category) => void;
  preselectedDay?: string;
  formSlot: string;
  setFormSlot: (s: string) => void;
  formCurrency: string;
  setFormCurrency: (c: string) => void;
  tempImages: { data: string, name: string }[];
  setTempImages: React.Dispatch<React.SetStateAction<{ data: string, name: string }[]>>;
  tempAttachments: { data: string, name: string }[];
  setTempAttachments: React.Dispatch<React.SetStateAction<{ data: string, name: string }[]>>;
  handleAddLocation: (data: any) => void;
  handleFiles: (files: FileList | null) => void;
  resetForm: () => void;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
}

export const LocationForm = ({
  isFormPanelOpen, setIsFormPanelOpen, formId, formPriority, setFormPriority, formCat, setFormCat,
  formSlot, setFormSlot, formCurrency, setFormCurrency, preselectedDay,
  tempImages, setTempImages, tempAttachments, setTempAttachments, handleAddLocation, handleFiles, resetForm, locations,
}: LocationFormProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'time' | 'finance' | 'assets'>('general');
  const [resStatus, setResStatus] = useState<ReservationStatus>('idea');
  const [durHours, setDurHours] = useState<number | string>('');
  const [durMins, setDurMins] = useState<number | string>('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [tagInputValue, setTagInputValue] = useState('');

  const activeGlobalVariantId = useAppStore(s => s.activeGlobalVariantId);
  const setIsTripSettingsOpen = useAppStore(s => s.setIsTripSettingsOpen);
  const { data: tripVariants = [] } = useTripVariants();
  const activeVariant = tripVariants.find(v => v.id === activeGlobalVariantId);
  const predefinedCities = activeVariant?.cities || [];

  const { register, handleSubmit, watch, reset, setValue } = useForm<LocationFormInputs>();

  const catGroup = getCatGroup(formCat);
  const catConfig = getCatConfig(formCat);

  useEffect(() => {
    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing) {
        if (existing.reservationStatus) setResStatus(existing.reservationStatus);
        if (existing.durationMinutes !== undefined) {
          setDurHours(Math.floor(existing.durationMinutes / 60) || '');
          setDurMins(existing.durationMinutes % 60 || '');
        } else {
          setDurHours('');
          setDurMins('');
        }

        // Initialize tags
        if (existing.tags) {
          setCurrentTags([...existing.tags]);
        } else {
          setCurrentTags([]);
        }

        // Reset form values
        reset({
          title: existing.title || '',
          link: existing.link || '',
          cost: existing.cost || '0',
          priceAmount: existing.newPrice?.amount || '',
          notes: existing.notes || '',
          datetime: extractTimeFromISO(existing.datetime),
          checkOutDatetime: extractTimeFromISO(existing.checkOutDatetime),
          nights: existing.nights || 1,
          bookingRef: existing.bookingRef || '',
          logisticsConfirmation: existing.logisticsConfirmation || '',
          logisticsDetail: existing.logisticsDetail || '',
          isPinnedTime: !!existing.isPinnedTime,
          company: existing.company || '',
          flightNumber: existing.flightNumber || '',
          terminal: existing.terminal || '',
          gate: existing.gate || '',
          platform: existing.platform || '',
          seat: existing.seat || '',
          station: existing.station || '',
          pickupPoint: existing.pickupPoint || '',
          dropoffPoint: existing.dropoffPoint || '',
          transportApp: existing.transportApp || '',
          address: existing.address || '',
          roomNumber: existing.roomNumber || '',
          bestTimeHint: existing.bestTimeHint || '',
          city: existing.city || '',
          lateCheckout: !!existing.lateCheckout,
          mealType: existing.mealType || '',
          mapCoords: existing.coords ? `${existing.coords.lat},${existing.coords.lng}` : '',
          coordsReadonly: existing.coords ? `${existing.coords.lat.toFixed(6)}, ${existing.coords.lng.toFixed(6)}` : ''
        });
      }
    } else {
      setResStatus('idea');
      setActiveTab('general');
      setDurHours('');
      setDurMins('');
      setCurrentTags([]);

      reset({
        title: '', link: '', cost: '0', priceAmount: '', notes: '',
        datetime: '', checkOutDatetime: '', nights: 1, bookingRef: '', logisticsConfirmation: '', logisticsDetail: '',
        isPinnedTime: false, company: '', flightNumber: '', terminal: '', gate: '', platform: '', seat: '',
        station: '', pickupPoint: '', dropoffPoint: '', transportApp: '', address: '', roomNumber: '',
        bestTimeHint: '', city: '', lateCheckout: false, mealType: '', mapCoords: '', coordsReadonly: ''
      });
    }
  }, [formId, preselectedDay]);

  // Handle Map Coordinate Updates
  useEffect(() => {
    const handleUpdateCoords = (e: any) => {
      const { lat, lng } = e.detail;
      setValue('mapCoords', `${lat},${lng}`);
      setValue('coordsReadonly', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };
    window.addEventListener('update-map-coords', handleUpdateCoords);
    return () => window.removeEventListener('update-map-coords', handleUpdateCoords);
  }, [setValue]);

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

  const onSubmit = (data: LocationFormInputs) => {
    data.reservationStatus = resStatus;
    const totalMins = (Number(durHours || 0) * 60) + Number(durMins || 0);
    data.durationMinutes = totalMins > 0 ? totalMins.toString() : '';
    data.tags = currentTags.join(',');

    const targetDay = formId ? locations.find(l => l.id === formId)?.day : preselectedDay;
    const targetDate = targetDay && targetDay !== 'unassigned' ? computeDateForDay(targetDay, tripVariants, activeGlobalVariantId) : null;

    if (targetDate && data.datetime) {
      data.datetime = combineDayWithTime(targetDate, data.datetime);
      data.isPinnedTime = true;
    } else {
      data.datetime = '';
      data.isPinnedTime = false;
    }

    if (targetDate && data.checkOutDatetime) {
      data.checkOutDatetime = calculateCheckoutDatetime(targetDate, Number(data.nights || 1), data.checkOutDatetime);
    } else {
      data.checkOutDatetime = '';
    }

    handleAddLocation(data);
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
      className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === id ? 'border-nature-primary text-nature-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}
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
    <div className={`w-full md:w-[480px] shrink-0 bg-bg-surface border-r border-border-strong flex flex-col z-[520] shadow-[10px_0_30px_rgba(0,0,0,0.1)] h-full absolute top-0 bottom-0 left-0 transform ${isFormPanelOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
      <RAButton variant="icon" aria-label="Cerrar formulario" onPress={() => setIsFormPanelOpen(false)} className="absolute top-4 right-4 z-50 bg-bg-surface-elevated/50 backdrop-blur"><X size={24} /></RAButton>

      <div className="p-8 pb-4 bg-bg-surface/50">
        <div className="flex items-center gap-3 mb-1">
          {catConfig && <span className="text-3xl">{catConfig.icon}</span>}
          <h2 className="text-3xl font-sans text-nature-primary">{formTitle}</h2>
        </div>
        <p className="text-xs text-text-muted">
          {catGroup === 'transport' ? 'Configura los detalles de tu trayecto.' :
            catGroup === 'accommodation' ? 'Configura tu estancia.' :
              'Diseña tu experiencia con precisión.'}
        </p>
      </div>

      <div className="flex px-6 border-b border-border-strong overflow-x-auto no-scrollbar">
        <TabButton id="general" label={tabLabels.general} icon={MapPin} />
        {catGroup === 'activity' && <TabButton id="time" label={tabLabels.time} icon={Calendar} />}
        <TabButton id="finance" label={tabLabels.finance} icon={CreditCard} />
        <TabButton id="assets" label={tabLabels.assets} icon={ImageIcon} />
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scroll">
        <form id="mainForm" onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* ═══ TAB: GENERAL ═══ */}
          <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>

            {/* Type Picker */}
            <ActivityTypePicker value={formCat} onChange={setFormCat} />

            {/* Title */}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">
                {catGroup === 'accommodation' ? 'Nombre del Hotel' : catGroup === 'transport' ? 'Título / Descripción' : 'Título (Opcional)'}
              </label>
              <input {...register('title')} type="text" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary placeholder-text-muted outline-none text-xs transition-all font-bold"
                placeholder={catGroup === 'accommodation' ? 'Ej. Hotel Hilton Barcelona' : catGroup === 'transport' ? 'Ej. Vuelo a Madrid' : 'Ej. Visita al Coliseo'} />
            </div>

            {/* ── Activity-specific fields ── */}
            {catGroup === 'activity' && (
              <>
                <div>
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Google Maps Link (Opcional)</label>
                  <input {...register('link')} type="url" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary placeholder-text-muted outline-none text-xs transition-all" placeholder="https://maps.app.goo.gl/..." />
                  <input {...register('mapCoords')} type="hidden" />
                </div>

                <div id="coordsDisplay" className={watch('mapCoords') ? 'block' : 'hidden'}>
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">📍 Coordenadas</label>
                  <input {...register('coordsReadonly')} type="text" readOnly className="w-full bg-nature-mint/20 border border-nature-primary/20 rounded-xl p-4 text-nature-primary outline-none text-xs font-mono cursor-default" />
                </div>

                {formCat === 'food' && (
                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Tipo de Comida</label>
                    <div className="flex gap-2 flex-wrap">
                      {(['breakfast', 'lunch', 'dinner', 'snack', 'tapas'] as const).map(meal => (
                        <label key={meal} className="cursor-pointer">
                          <input type="radio" {...register('mealType')} value={meal} className="peer hidden" />
                          <div className="px-3 py-2 rounded-lg border border-border-strong text-xs font-bold text-text-muted peer-checked:bg-nature-accent peer-checked:text-white peer-checked:border-nature-accent transition-all">
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
                    <input {...register('bestTimeHint')} type="text" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary placeholder-text-muted outline-none text-xs transition-all" placeholder="Ej. Golden hour 18:30, amanecer..." />
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
                      <select {...register('city')} className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary outline-none text-xs transition-all font-bold cursor-pointer">
                        <option value="">Seleccionar ciudad...</option>
                        {predefinedCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    ) : (
                      <>
                        <input {...register('city')} list="cities-list" type="text" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary placeholder-text-muted outline-none text-xs transition-all" placeholder="Ej. Dubai Marina, Tokio..." />
                        <datalist id="cities-list">
                          {availableCities.map(city => <option key={city} value={city} />)}
                        </datalist>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Etiquetas (Enter para añadir)</label>
                    <div className="w-full bg-bg-surface-elevated border border-border-strong focus-within:border-nature-mint focus-within:bg-bg-surface rounded-xl p-2.5 flex flex-wrap gap-2 transition-all min-h-[50px] items-center">
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
                        className="flex-1 min-w-[100px] bg-transparent outline-none text-xs text-text-primary placeholder-text-muted"
                        placeholder={currentTags.length === 0 ? "Ej. playa, relax..." : ""}
                      />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input type="radio" name="priority" value="optional" checked={formPriority === 'optional'} onChange={() => setFormPriority('optional')} className="peer hidden" />
                    <div className="py-3 text-center rounded-xl bg-bg-surface border border-border-strong text-xs font-medium text-text-secondary peer-checked:bg-nature-mint peer-checked:text-nature-primary peer-checked:border-nature-mint transition-all">Opcional</div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="priority" value="necessary" checked={formPriority === 'necessary'} onChange={() => setFormPriority('necessary')} className="peer hidden" />
                    <div className="py-3 text-center rounded-xl bg-bg-surface border border-border-strong text-xs font-medium text-text-secondary peer-checked:bg-nature-primary peer-checked:text-white peer-checked:border-nature-primary transition-all">Esencial</div>
                  </label>
                </div>
              </>
            )}

            {/* ── Transport-specific fields ── */}
            {catGroup === 'transport' && (
              <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500 italic text-lg">✈️</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#93c5fd]">Detalles del Transporte</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-[#60a5fa] uppercase mb-2 block">Compañía</label>
                    <input {...register('company')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none" placeholder="Ej. Ryanair, Alsa..." />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-[#60a5fa] uppercase mb-2 block">
                      {formCat.startsWith('flight') ? 'Nº Vuelo' : formCat.startsWith('train') ? 'Nº Tren/Línea' : 'Nº Línea'}
                    </label>
                    <input {...register('flightNumber')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none" placeholder="FR1234" />
                  </div>
                </div>

                {(formCat.startsWith('flight') || formCat === 'airport-wait') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Terminal</label>
                      <input {...register('terminal')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="T1, T4S..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerta</label>
                      <input {...register('gate')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="B24" />
                    </div>
                  </div>
                )}

                {(formCat.startsWith('bus') || formCat.startsWith('train')) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Estación</label>
                      <input {...register('station')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Estación Sur..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Andén</label>
                      <input {...register('platform')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Andén 3" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Asiento</label>
                    <input {...register('seat')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="12A" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Confirmación / PNR</label>
                    <input {...register('logisticsConfirmation')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none text-text-primary" placeholder="ABC123" />
                  </div>
                </div>

                {formCat === 'taxi' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto de Recogida</label>
                      <input {...register('pickupPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Hotel lobby..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">App / Servicio</label>
                      <input {...register('transportApp')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Uber, Bolt..." />
                    </div>
                  </div>
                )}

                {formCat === 'car-rental' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto Recogida</label>
                      <input {...register('pickupPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Aeropuerto T1..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto Devolución</label>
                      <input {...register('dropoffPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Ciudad centro..." />
                    </div>
                  </div>
                )}

                {formCat === 'transfer' && (
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Punto de Recogida</label>
                    <input {...register('pickupPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Terminal 2 Llegadas..." />
                  </div>
                )}

                {(formCat === 'ferry') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerto Salida</label>
                      <input {...register('pickupPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Puerto de Barcelona..." />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-wider font-bold text-blue-700/60 uppercase mb-2 block">Puerto Llegada</label>
                      <input {...register('dropoffPoint')} type="text" className="w-full bg-bg-surface border border-blue-500/20 focus:border-blue-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Puerto de Palma..." />
                    </div>
                  </div>
                )}

                {/* Hidden fields for coords and link (transport can optionally have them) */}
                <input {...register('link')} type="hidden" />
                <input {...register('mapCoords')} type="hidden" />
              </div>
            )}

            {/* ── Accommodation-specific fields ── */}
            {catGroup === 'accommodation' && (
              <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-600 text-lg">🏨</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fbbf24]">Detalles del Alojamiento</span>
                </div>

                <div>
                  <label className="text-[9px] tracking-wider font-bold text-[#f59e0b] uppercase mb-2 block">Dirección</label>
                  <input {...register('address')} type="text" className="w-full bg-bg-surface border border-amber-500/20 focus:border-amber-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="C/ Gran Via 123, Barcelona..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-[#f59e0b] uppercase mb-2 block">Nº Habitación</label>
                    <input {...register('roomNumber')} type="text" className="w-full bg-bg-surface border border-amber-500/20 focus:border-amber-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="Suite 401" />
                  </div>
                  <div>
                    <label className="text-[9px] tracking-wider font-bold text-[#f59e0b] uppercase mb-2 block">Confirmación</label>
                    <input {...register('logisticsConfirmation')} type="text" className="w-full bg-bg-surface border border-amber-500/20 focus:border-amber-400 rounded-xl p-3 text-xs font-mono tracking-widest uppercase outline-none text-text-primary" placeholder="CONF123" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] tracking-wider font-bold text-amber-700/60 uppercase mb-2 block">Google Maps Link (Opcional)</label>
                  <input {...register('link')} type="url" className="w-full bg-bg-surface border border-amber-500/20 focus:border-amber-400 rounded-xl p-3 text-xs outline-none text-text-primary" placeholder="https://maps.app.goo.gl/..." />
                  <input {...register('mapCoords')} type="hidden" />
                </div>

                <div id="coordsDisplay" className={watch('mapCoords') ? 'block' : 'hidden'}>
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">📍 Coordenadas</label>
                  <input {...register('coordsReadonly')} type="text" readOnly className="w-full bg-nature-mint/20 border border-nature-primary/20 rounded-xl p-4 text-nature-primary outline-none text-xs font-mono cursor-default" />
                </div>

                {formCat === 'hotel-checkout' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('lateCheckout')} className="accent-amber-600 w-4 h-4" />
                    <span className="text-xs font-bold text-amber-700">Late Checkout</span>
                  </label>
                )}
              </div>
            )}

            {/* ── Transport / Accommodation Shared Time Fields ── */}
            {catGroup !== 'activity' && (
              <div className="bg-nature-mint/10 p-6 rounded-2xl border border-nature-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-nature-primary text-lg">🕒</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-nature-primary/50">Horarios</span>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
                        <span>
                          {catGroup === 'transport' ? (formCat.includes('arrival') ? 'Hora Llegada' : 'Hora Salida') :
                            catGroup === 'accommodation' ? (formCat === 'hotel-checkout' ? 'Hora Check-out' : 'Hora Check-in') :
                              'Inicio (Opcional)'}
                        </span>
                      </label>
                      <input {...register('datetime')} type="time" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-xs outline-none text-nature-primary transition-all font-mono" />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {catGroup === 'accommodation' && formCat === 'hotel-checkin' ? (
                      <div className="w-1/2">
                        <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Noches</label>
                        <select {...register('nights')} className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-xs outline-none transition-all cursor-pointer font-bold text-nature-primary">
                          {[...Array(14)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} Noche{i > 0 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="w-1/2">
                        <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Duración</label>
                        <div className="flex bg-bg-surface-elevated border border-border-strong focus-within:border-nature-mint focus-within:bg-bg-surface rounded-xl overflow-hidden transition-all">
                          <input type="number" min="0" value={durHours} onChange={e => setDurHours(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="H" />
                          <div className="w-px bg-border-strong my-2"></div>
                          <input type="number" min="0" max="59" step="5" value={durMins} onChange={e => setDurMins(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-nature-text" placeholder="Min" />
                        </div>
                      </div>
                    )}
                    <div className="w-1/2">
                      <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">
                        {catGroup === 'accommodation' ? (formCat === 'hotel-checkin' ? 'Hora Check-out' : 'Check-in') : 'Fin / Hora Llegada'}
                      </label>
                      <input {...register('checkOutDatetime')} type="time" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-xs outline-none transition-all font-mono text-gray-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Notas</label>
                    <textarea {...register('notes')} rows={4} className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-nature-text placeholder-gray-300 resize-none text-sm outline-none leading-relaxed transition-all"
                      placeholder={catGroup === 'transport' ? 'Info del trayecto, escalas...' : catGroup === 'accommodation' ? 'Wifi, desayuno incluido...' : 'Recordar entradas, dress code...'}></textarea>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ═══ TAB: HORARIOS ═══ */}
          {catGroup === 'activity' && (
            <div className={`${activeTab === 'time' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Momento del día</label>
                  <RASelect
                    aria-label="Momento del día"
                    items={[
                      { id: 'Mañana', label: 'Mañana' },
                      { id: 'Tarde', label: 'Tarde' },
                      { id: 'Noche', label: 'Noche' }
                    ]}
                    value={formSlot}
                    onChange={setFormSlot}
                    buttonClassName="w-full bg-bg-surface-elevated border border-border-strong rounded-xl p-3 text-sm text-text-primary font-bold"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
                    <span>Inicio (Opcional)</span>
                    <label className="flex items-center gap-1 cursor-pointer" title="Fijar esta hora exacta (No recálcular)">
                      <input type="checkbox" {...register('isPinnedTime')} className="accent-nature-primary w-3 h-3" />
                      <span className="normal-case text-[9px] text-nature-primary opacity-80">Fijar Hora</span>
                    </label>
                  </label>
                  <input {...register('datetime')} type="time" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-xs outline-none text-nature-primary transition-all font-mono" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Fin / Hora Llegada</label>
                  <input {...register('checkOutDatetime')} type="time" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-xs outline-none transition-all font-mono" />
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Duración</label>
                  <div className="flex bg-bg-surface-elevated border border-border-strong focus-within:border-nature-mint focus-within:bg-bg-surface rounded-xl overflow-hidden transition-all">
                    <input type="number" min="0" value={durHours} onChange={e => setDurHours(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-text-primary" placeholder="H" />
                    <div className="w-px bg-border-strong my-2"></div>
                    <input type="number" min="0" max="59" step="5" value={durMins} onChange={e => setDurMins(e.target.value)} className="w-1/2 bg-transparent p-3 text-sm outline-none text-center font-bold text-text-primary" placeholder="Min" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Notas</label>
                <textarea {...register('notes')} rows={4} className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-text-primary placeholder-text-muted resize-none text-sm outline-none leading-relaxed transition-all"
                  placeholder="Recordar entradas, dress code..."></textarea>
              </div>
            </div>
          )}

          {/* ═══ TAB: RESERVA ═══ */}
          <div className={`${activeTab === 'finance' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-3 block">Estado</label>
              <div className="flex bg-bg-surface-elevated rounded-xl p-1">
                {(['idea', 'pending', 'booked'] as ReservationStatus[]).map(status => (
                  <button type="button" key={status} onClick={() => setResStatus(status)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${resStatus === status ? 'bg-bg-surface text-nature-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
                    {status === 'idea' ? 'Idea' : status === 'pending' ? 'Falta' : 'Reservado'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Coste/Precio</label>
                <input {...register('priceAmount')} type="number" step="0.01" className="w-full bg-bg-surface-elevated border border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-4 text-lg font-mono outline-none transition-all text-text-primary" placeholder="0.00" />
                <input {...register('cost')} type="hidden" value="0" />
              </div>
              <div className="flex-[0.5]">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Divisa</label>
                <RASelect
                  aria-label="Divisa"
                  items={[
                    { id: 'EUR', label: '€ EUR' },
                    { id: 'USD', label: '$ USD' },
                    { id: 'GBP', label: '£ GBP' },
                    { id: 'JPY', label: '¥ JPY' },
                    { id: 'AED', label: 'د.إ AED' },
                    { id: 'SGD', label: 'S$ SGD' },
                    { id: 'MYR', label: 'RM MYR' },
                  ]}
                  value={formCurrency}
                  onChange={setFormCurrency}
                  buttonClassName="w-full bg-bg-surface-elevated border border-border-strong rounded-xl p-4 text-sm font-bold text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Referencia (Booking/Vuelo)</label>
              <input {...register('bookingRef')} type="text" className="w-full bg-bg-surface-elevated border text-center font-mono tracking-widest uppercase border-border-strong focus:border-nature-mint focus:bg-bg-surface rounded-xl p-3 text-sm outline-none placeholder-text-muted transition-all text-text-primary" placeholder="XYZ123" />
            </div>
          </div>

          {/* ═══ TAB: ARCHIVOS ═══ */}
          <div className={`${activeTab === 'assets' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-border-strong hover:border-nature-primary hover:bg-nature-mint/30 bg-bg-surface-elevated rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group shadow-sm hover:shadow-md">
                <ImageIcon size={32} className="text-text-muted group-hover:text-nature-primary mb-3 transition-colors" />
                <p className="text-xs text-text-muted group-hover:text-nature-primary font-medium">
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
                      <img src={img.data} alt="temp" className="w-full aspect-square object-cover rounded-xl shadow-sm border border-border-strong" />
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
          <div className="pt-6 sticky bottom-0 bg-bg-surface border-t border-border-strong">
            <RAButton
              variant="primary"
              className={`w-full ${formId ? 'bg-gray-800' : ''}`}
              size="lg"
              type="submit"
              style={!formId && catConfig ? { backgroundColor: catConfig.color } : {}}
            >
              {formId ? 'Confirmar Edición' : `Añadir ${CAT_LABELS[formCat] || 'Actividad'}`}
            </RAButton>
            {formId && <RAButton variant="ghost" onPress={resetForm} className="w-full text-xs text-text-muted hover:text-red-500 uppercase tracking-widest mt-2" size="sm">Cancelar</RAButton>}
          </div>
        </form>
      </div >
    </div >
  );
};
