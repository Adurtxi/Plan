import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plane, Train, Bus, Hotel, Ticket, Car, FileText, UploadCloud, Trash2, Calendar, Edit2, CheckCircle2, Plus } from 'lucide-react';
import { useAddReservation, useUpdateReservation } from '../../hooks/useTripData';
import type { ReservationItem, ReservationStatus } from '../../types';
import { useAppStore } from '../../store';
import { RASheet } from '../ui/RASheet';
import { RAButton } from '../ui/RAButton';

interface ReservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget?: ReservationItem | null;
}

interface ReservationFormInputs {
  type: ReservationItem['type'];
  title: string;
  company: string;
  bookingReference: string;
  status: ReservationStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  costAmount: string;
  costCurrency: string;
  link: string;
  notes: string;
}

const DEFAULTS: ReservationFormInputs = {
  type: 'flight',
  title: '',
  company: '',
  bookingReference: '',
  status: 'booked',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  costAmount: '',
  costCurrency: 'EUR',
  link: '',
  notes: '',
};

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
  const showDialog = useAppStore(s => s.showDialog);

  const { register, handleSubmit, reset, watch, setValue } = useForm<ReservationFormInputs>({
    defaultValues: DEFAULTS,
  });

  const type = watch('type');

  // Attachments stay as local state since they hold binary data and aren't plain form values
  const [attachments, setAttachments] = useState<{ data: string; name: string }[]>([]);

  // Populate form on open
  useEffect(() => {
    if (isOpen) {
      if (editTarget) {
        const values: ReservationFormInputs = {
          type: editTarget.type,
          title: editTarget.title,
          company: editTarget.company || '',
          bookingReference: editTarget.bookingReference || '',
          status: editTarget.reservationStatus,
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          costAmount: editTarget.cost ? editTarget.cost.amount.toString() : '',
          costCurrency: editTarget.cost ? editTarget.cost.currency : 'EUR',
          link: editTarget.link || '',
          notes: editTarget.notes || '',
        };

        if (editTarget.startDatetime) {
          const d = new Date(editTarget.startDatetime);
          values.startDate = d.toISOString().split('T')[0];
          values.startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        if (editTarget.endDatetime) {
          const d = new Date(editTarget.endDatetime);
          values.endDate = d.toISOString().split('T')[0];
          values.endTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        reset(values);
        setAttachments(editTarget.attachments || []);
      } else {
        reset(DEFAULTS);
        setAttachments([]);
      }
    }
  }, [isOpen, editTarget, reset]);

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

  const onSubmit = async (data: ReservationFormInputs) => {
    if (!data.title) {
      showDialog({ type: 'alert', title: 'Error', message: 'El título es obligatorio (Ej: Vuelo a Madrid).' });
      return;
    }

    const payload: ReservationItem = {
      id: editTarget ? editTarget.id : `res-${Date.now()}`,
      type: data.type,
      title: data.title,
      company: data.company,
      bookingReference: data.bookingReference,
      reservationStatus: data.status,
      attachments,
      notes: data.notes,
      link: data.link,
      cost: data.costAmount ? { amount: parseFloat(data.costAmount), currency: data.costCurrency } : undefined,
    };

    if (data.startDate && data.startTime) {
      payload.startDatetime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
    }
    if (data.endDate && data.endTime) {
      payload.endDatetime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
    }

    if (editTarget) {
      await updateReservation(payload);
    } else {
      await addReservation(payload);
    }

    onClose();
  };

  return (
    <RASheet isOpen={isOpen} onClose={onClose} className="md:w-[600px]">

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border-strong bg-bg-surface z-10 shrink-0">
        <h2 className="text-xl font-sans font-bold text-text-primary flex items-center gap-2">
          {editTarget ? <Edit2 size={24} /> : <Plus size={24} />}
          {editTarget ? 'Editar Reserva' : 'Nueva Reserva'}
        </h2>
        <RAButton variant="icon" aria-label="Cerrar formulario" onPress={onClose}>
          <X size={24} />
        </RAButton>
      </div>

      {/* Scrollable Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scroll bg-bg-body">

        {/* Type Selection */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm">
          <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 block">Tipo de Reserva</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <RAButton
                  key={t.id}
                  variant={active ? 'primary' : 'secondary'}
                  onPress={() => setValue('type', t.id as ReservationItem['type'])}
                  size="sm"
                  className={active ? 'bg-nature-mint text-nature-primary border-nature-primary' : ''}
                >
                  <Icon size={16} /> <span>{t.label}</span>
                </RAButton>
              );
            })}
          </div>
        </div>

        {/* Basic Details */}
        <div className="bg-bg-surface p-5 rounded-2xl border border-border-strong shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Título principal *</label>
            <input type="text" {...register('title', { required: true })} placeholder={type === 'flight' ? 'Vuelo IB3434 a Madrid' : type === 'hotel' ? 'Hotel Riu Plaza' : 'Actividad...'} className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong text-text-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Proveedor / Compañía</label>
              <input type="text" {...register('company')} placeholder="Ej: Iberia, Booking.com..." className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Ref. Reserva / PNR</label>
              <input type="text" {...register('bookingReference')} placeholder="Ej: Y6T8K2" className="w-full p-3 bg-bg-surface-elevated rounded-xl focus:bg-bg-surface focus:ring-2 focus:ring-nature-primary outline-none transition-all border border-border-strong uppercase font-mono text-text-primary" />
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
              <input type="date" {...register('startDate')} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Hora</label>
              <input type="time" {...register('startTime')} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">{type === 'hotel' ? 'Día Check-out' : 'Día Llegada / Fin'}</label>
              <input type="date" {...register('endDate')} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1 block">Hora</label>
              <input type="time" {...register('endTime')} className="w-full p-3 bg-bg-surface-elevated rounded-xl border border-border-strong text-text-primary" />
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
                  <RAButton variant="icon" aria-label="Eliminar adjunto" onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={16} />
                  </RAButton>
                </div>
              ))}
            </div>
          )}
        </div>

      </form>

      {/* Footer */}
      <div className="p-6 bg-bg-surface border-t border-border-strong shrink-0">
        <RAButton variant="primary" onPress={() => handleSubmit(onSubmit)()} className="w-full" size="lg">
          <CheckCircle2 size={20} /> Guardar Reserva
        </RAButton>
      </div>
    </RASheet>
  );
};
