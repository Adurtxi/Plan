import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, CreditCard, Image as ImageIcon } from 'lucide-react';
import type { Category, Priority, LocationItem, ReservationStatus } from '../../types';
import { CAT_ICONS } from '../../constants';

interface LocationFormProps {
  isFormPanelOpen: boolean;
  setIsFormPanelOpen: (isOpen: boolean) => void;
  formId: number | null;
  formPriority: Priority;
  setFormPriority: (p: Priority) => void;
  formCat: Category;
  setFormCat: (c: Category) => void;
  tempImages: { data: string, name: string }[];
  setTempImages: React.Dispatch<React.SetStateAction<{ data: string, name: string }[]>>;
  handleAddLocation: (e: React.FormEvent<HTMLFormElement>) => void;
  handleFiles: (files: FileList | null) => void;
  resetForm: () => void;
  locations: LocationItem[];
  handleEdit: (id: number) => void;
}

export const LocationForm = ({
  isFormPanelOpen, setIsFormPanelOpen, formId, formPriority, setFormPriority, formCat, setFormCat,
  tempImages, setTempImages, handleAddLocation, handleFiles, resetForm, locations,
}: LocationFormProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'time' | 'finance' | 'assets'>('general');
  const [resStatus, setResStatus] = useState<ReservationStatus>('idea');

  // Load existing status when editing
  useEffect(() => {
    if (formId) {
      const existing = locations.find(l => l.id === formId);
      if (existing && existing.reservationStatus) setResStatus(existing.reservationStatus);
    } else {
      setResStatus('idea');
      setActiveTab('general');
    }
  }, [formId, locations]);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Inject custom hidden data into form before submit
    const inputStatus = document.createElement('input');
    inputStatus.type = 'hidden';
    inputStatus.name = 'reservationStatus';
    inputStatus.value = resStatus;
    e.currentTarget.appendChild(inputStatus);

    handleAddLocation(e);
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

  return (
    <div className={`w-full md:w-[480px] shrink-0 bg-white border-r border-gray-100 flex flex-col z-20 shadow-2xl h-full absolute md:relative transform ${isFormPanelOpen ? 'translate-x-0' : '-translate-x-full md:hidden md:translate-x-0'} transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]`}>
      <button type="button" onClick={() => setIsFormPanelOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-gray-400"><X size={24} /></button>

      <div className="p-8 pb-4 bg-gray-50/50">
        <h2 className="text-3xl font-serif text-nature-primary mb-1">{formId ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
        <p className="text-xs text-gray-500">Diseña tu experiencia con precisión.</p>
      </div>

      <div className="flex px-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
        <TabButton id="general" label="Lugar" icon={MapPin} />
        <TabButton id="time" label="Horarios" icon={Calendar} />
        <TabButton id="finance" label="Reserva" icon={CreditCard} />
        <TabButton id="assets" label="Archivos" icon={ImageIcon} />
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scroll">
        <form id="mainForm" onSubmit={onFormSubmit} className="space-y-8">

          <div className={`${activeTab === 'general' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Google Maps Link</label>
              <input name="link" type="url" className="w-full bg-gray-50 border border-gray-100 focus:border-nature-mint focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 outline-none text-xs transition-all" placeholder="https://maps.app.goo.gl/..." required />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(CAT_ICONS) as Category[]).map(cat => (
                <label key={cat} className="cursor-pointer group">
                  <input type="radio" name="cat" value={cat} checked={formCat === cat} onChange={() => setFormCat(cat)} className="peer hidden" />
                  <div className={`aspect-square flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 transition-all text-xl drop-shadow-sm peer-checked:text-white ${cat === 'sight' ? 'peer-checked:bg-nature-primary' : cat === 'food' ? 'peer-checked:bg-nature-accent' : cat === 'hotel' ? 'peer-checked:bg-gray-800' : 'peer-checked:bg-nature-textLight'}`}>
                    {CAT_ICONS[cat as keyof typeof CAT_ICONS]}
                  </div>
                  <span className="text-[9px] text-center block mt-2 text-gray-400 uppercase tracking-wide group-hover:text-nature-primary">{cat}</span>
                </label>
              ))}
            </div>

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
          </div>

          <div className={`${activeTab === 'time' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Momento del día</label>
                <select name="slot" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm outline-none custom-select appearance-none">
                  <option value="Mañana">Mañana</option><option value="Tarde">Tarde</option><option value="Noche">Noche</option>
                </select>
              </div>
              <div className="w-1/2">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Cita exacta (Opcional)</label>
                <input name="datetime" type="datetime-local" className="w-full bg-gray-50 border border-gray-100 focus:bg-white rounded-xl p-3 text-xs outline-none text-nature-primary" />
              </div>
            </div>
            {formCat === 'hotel' && (
              <div>
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Check-Out (Hotel)</label>
                <input name="checkOutDatetime" type="datetime-local" className="w-full bg-gray-50 border border-gray-100 focus:bg-white rounded-xl p-3 text-xs outline-none" />
              </div>
            )}
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Notas Logísticas</label>
              <textarea name="notes" rows={4} className="w-full bg-gray-50 border border-gray-100 focus:bg-white rounded-xl p-4 text-nature-text placeholder-gray-300 resize-none text-sm outline-none leading-relaxed" placeholder="Recordar entradas, dress code..."></textarea>
            </div>
          </div>

          <div className={`${activeTab === 'finance' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-3 block">Estado de la Actividad</label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(['idea', 'pending', 'booked'] as ReservationStatus[]).map(status => (
                  <button type="button" key={status} onClick={() => setResStatus(status)} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${resStatus === status ? 'bg-white text-nature-primary shadow-sm' : 'text-gray-400'}`}>
                    {status === 'idea' ? 'Idea' : status === 'pending' ? 'Falta' : 'Reservado'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Coste/Precio</label>
                <input name="priceAmount" type="number" step="0.01" className="w-full bg-gray-50 border border-gray-100 focus:bg-white rounded-xl p-4 text-lg font-mono outline-none" placeholder="0.00" />
                {/* Legacy cost input hidden to avoid breaking old handlers temporarily */}
                <input name="cost" type="hidden" value="0" />
              </div>
              <div className="flex-[0.4]">
                <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Divisa</label>
                <select name="priceCurrency" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs outline-none">
                  <option value="EUR">€ EUR</option>
                  <option value="USD">$ USD</option>
                  <option value="GBP">£ GBP</option>
                  <option value="JPY">¥ JPY</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Referencia (Booking/Vuelo)</label>
              <input name="bookingRef" type="text" className="w-full bg-gray-50 border text-center font-mono tracking-widest uppercase border-gray-100 focus:bg-white rounded-xl p-3 text-sm outline-none placeholder-gray-200" placeholder="XYZ123" />
            </div>
          </div>

          <div className={`${activeTab === 'assets' ? 'block' : 'hidden'} space-y-6 animate-fade-in`}>
            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-200 hover:border-nature-primary hover:bg-nature-mint/30 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group">
                <ImageIcon size={32} className="text-gray-300 group-hover:text-nature-primary mb-3 transition-colors" />
                <p className="text-xs text-gray-400 group-hover:text-nature-primary font-medium">Buscar o arrastrar imágenes</p>
                <input type="file" multiple hidden accept="image/*" onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </label>
            {tempImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {tempImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.data} alt="temp" className="w-full aspect-square object-cover rounded-xl shadow-sm border border-gray-100" />
                    <button type="button" onClick={() => setTempImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky footer for submit */}
          <div className="pt-6 sticky bottom-0 bg-white border-t border-gray-50">
            <button type="submit" className={`w-full ${formId ? 'bg-gray-800' : 'bg-nature-primary'} text-white font-medium tracking-wide py-4 rounded-xl shadow-floating hover:shadow-2xl transition-all transform active:scale-[0.98]`}>
              {formId ? 'Confirmar Edición' : 'Añadir Actividad'}
            </button>
            {formId && <button type="button" onClick={resetForm} className="w-full text-xs text-gray-400 hover:text-red-500 py-3 font-bold uppercase tracking-widest mt-2">Cancelar</button>}
          </div>
        </form>
      </div>
    </div>
  );
};
