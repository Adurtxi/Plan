import React, { useState } from 'react';
import { X, Plane, Train, Bus, Hotel, Ticket, Car, FileText, UploadCloud, Trash2, Calendar, Edit2, CheckCircle2, Plus } from 'lucide-react';
import { useAddReservation, useUpdateReservation } from '../../hooks/useTripData';
import type { ReservationItem, ReservationStatus } from '../../types';
import { useAppStore } from '../../store';

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget?: ReservationItem | null;
}

const TYPES = [
  { id: 'flight', label: 'Vuelo', icon: Plane, color: '#4285F4' },
  { id: 'hotel', label: 'Hotel', icon: Hotel, color: '#f59e0b' },
  { id: 'train', label: 'Tren', icon: Train, color: '#10b981' },
  { id: 'bus', label: 'Autobús', icon: Bus, color: '#8b5cf6' },
  { id: 'car-rental', label: 'Alquiler Coche', icon: Car, color: '#64748b' },
  { id: 'activity', label: 'Actividad / Ticket', icon: Ticket, color: '#ec4899' },
  { id: 'other', label: 'Otro', icon: FileText, color: '#9ca3af' },
];

export const ReservationForm: React.FC<ReservationFormProps> = ({ isOpen, onClose, editTarget }) => {
  const { mutateAsync: addReservation } = useAddReservation();
  const { mutateAsync: updateReservation } = useUpdateReservation();
  const { showDialog } = useAppStore();

  const [type, setType] = useState<ReservationItem['type']>('flight');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bookingReference, setBookingReference] = useState('');
  const [status, setStatus] = useState<ReservationStatus>('booked');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  const [costAmount, setCostAmount] = useState('');
  const [costCurrency, setCostCurrency] = useState('EUR');

  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<{ data: string, name: string }[]>([]);

  // Setup form on open
  React.useEffect(() => {
    if (isOpen) {
      if (editTarget) {
        setType(editTarget.type);
        setTitle(editTarget.title);
        setCompany(editTarget.company || '');
        setBookingReference(editTarget.bookingReference || '');
        setStatus(editTarget.reservationStatus);

        if (editTarget.startDatetime) {
          const d = new Date(editTarget.startDatetime);
          setStartDate(d.toISOString().split('T')[0]);
          setStartTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        }
        if (editTarget.endDatetime) {
          const d = new Date(editTarget.endDatetime);
          setEndDate(d.toISOString().split('T')[0]);
          setEndTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        }

        if (editTarget.cost) {
          setCostAmount(editTarget.cost.amount.toString());
          setCostCurrency(editTarget.cost.currency);
        }

        setLink(editTarget.link || '');
        setNotes(editTarget.notes || '');
        setAttachments(editTarget.attachments || []);
      } else {
        // Reset
        setType('flight');
        setTitle('');
        setCompany('');
        setBookingReference('');
        setStatus('booked');
        setStartDate(''); setStartTime('');
        setEndDate(''); setEndTime('');
        setCostAmount(''); setCostCurrency('EUR');
        setLink(''); setNotes(''); setAttachments([]);
      }
    }
  }, [isOpen, editTarget]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(f => {
      const reader = new FileReader();
      if (f.type === 'application/pdf') {
        reader.readAsDataURL(f);
        reader.onload = (re) => {
          setAttachments(prev => [...prev, { data: re.target?.result as string, name: f.name }]);
        };
      } else if (f.type.startsWith('image/')) {
        reader.readAsDataURL(f);
        reader.onload = (re) => {
          const img = new Image(); img.src = re.target?.result as string;
          img.onload = () => {
            const c = document.createElement('canvas'); const max = 1200;
            let w = img.width, h = img.height;
            if (w > max) { h = Math.round((h * max) / w); w = max; }
            c.width = w; c.height = h; c.getContext('2d')?.drawImage(img, 0, 0, w, h);
            setAttachments(prev => [...prev, { data: c.toDataURL('image/jpeg', 0.8), name: f.name }]);
          };
        };
      } else {
        showDialog({
          type: 'alert',
          title: 'Formato no soportado',
          message: 'Solo se admiten archivos PDF o Imágenes para los billetes.'
        });
      }
    });
  };

  const handleSave = async () => {
    if (!title) {
      showDialog({ type: 'alert', title: 'Error', message: 'El título es obligatorio (Ej: Vuelo a Madrid).' });
      return;
    }

    const payload: ReservationItem = {
      id: editTarget ? editTarget.id : `res-${Date.now()}`,
      type,
      title,
      company,
      bookingReference,
      reservationStatus: status,
      attachments,
      notes,
      link,
      cost: costAmount ? { amount: parseFloat(costAmount), currency: costCurrency } : undefined,
    };

    if (startDate && startTime) {
      const d = new Date(`${startDate}T${startTime}`);
      payload.startDatetime = d.toISOString();
    }
    if (endDate && endTime) {
      const d = new Date(`${endDate}T${endTime}`);
      payload.endDatetime = d.toISOString();
    }

    if (editTarget) {
      await updateReservation(payload);
    } else {
      await addReservation(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[5000] flex justify-end bg-nature-primary/20 backdrop-blur-sm transition-all text-sm">
      <div className="w-full md:w-[600px] h-full bg-bg-surface shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-strong bg-bg-surface z-10 shrink-0">
          <h2 className="text-xl font-sans font-bold text-nature-text flex items-center gap-2">
            {editTarget ? <Edit2 size={24} /> : <Plus size={24} />}
            {editTarget ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-bg-surface-elevated hover:text-nature-primary rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll bg-bg-body">

          {/* Type Selection */}
          <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 block">Tipo de Reserva</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${active ? 'bg-nature-mint text-nature-primary border-nature-primary' : 'bg-bg-surface-elevated text-text-secondary border-border-strong hover:bg-bg-surface'}`}
                  >
                    <Icon size={16} /> <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Details */}
          <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Título principal *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'flight' ? 'Vuelo IB3434 a Madrid' : type === 'hotel' ? 'Hotel Riu Plaza' : 'Actividad...'} className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong text-text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Proveedor / Compañía</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Ej: Iberia, Booking.com..." className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong text-text-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Ref. Reserva / PNR</label>
                <input type="text" value={bookingReference} onChange={e => setBookingReference(e.target.value)} placeholder="Ej: Y6T8K2" className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong uppercase font-mono text-text-primary" />
              </div>
            </div>
          </div>

          {/* Dates & Times */}
          <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm space-y-4">
            <h3 className="font-bold text-text-primary border-b border-border-strong pb-2 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-nature-primary" /> Horarios
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">{type === 'hotel' ? 'Día Check-in' : 'Día Salida / Inicio'}</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Hora</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">{type === 'hotel' ? 'Día Check-out' : 'Día Llegada / Fin'}</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Hora</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm">
            <div className="flex items-center justify-between border-b border-border-strong pb-2 mb-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <FileText size={18} className="text-nature-primary" /> Billetes & Vouchers
              </h3>
              <label className="cursor-pointer flex items-center gap-1.5 text-xs font-bold text-nature-primary bg-nature-mint px-3 py-1.5 rounded-lg hover:bg-opacity-80 transition-all">
                <UploadCloud size={14} /> Subir
                <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileUpload} />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-center text-text-muted py-4">Sube los PDFs o capturas de tu billete para tenerlos a mano.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-bg-surface-elevated border border-border-strong rounded-xl">
                    {att.data.startsWith('data:application/pdf') ? <FileText size={20} className="text-red-500" /> : <img src={att.data} className="w-8 h-8 rounded object-cover" alt="prev" />}
                    <span className="flex-1 text-xs font-bold text-text-primary truncate">{att.name}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-bg-surface border-t border-border-strong shrink-0">
          <button onClick={handleSave} className="w-full bg-nature-primary hover:bg-opacity-90 active:scale-[0.98] text-white py-4 rounded-xl font-bold flex justify-center shadow-lg transition-all items-center gap-2">
            <CheckCircle2 size={20} /> Guardar Reserva
          </button>
        </div>
      </div>
    </div>
  );
};
