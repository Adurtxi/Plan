import React from 'react';
import { Plane, Hotel, Train, Bus, Car, Ticket, FileText, Calendar, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import type { ReservationItem } from '../../types';
import { useDeleteReservation } from '../../hooks/useTripData';
import { useAppStore } from '../../store';

const ICONS: Record<string, React.ElementType> = {
  'flight': Plane,
  'hotel': Hotel,
  'train': Train,
  'bus': Bus,
  'car-rental': Car,
  'activity': Ticket,
  'other': FileText
};

const COLORS: Record<string, string> = {
  'flight': '#4285F4',
  'hotel': '#f59e0b',
  'train': '#10b981',
  'bus': '#8b5cf6',
  'car-rental': '#64748b',
  'activity': '#ec4899',
  'other': '#9ca3af'
};

interface Props {
  reservation: ReservationItem;
  onEdit: (r: ReservationItem) => void;
}

export const ReservationCard: React.FC<Props> = ({ reservation, onEdit }) => {
  const { mutateAsync: deleteRes } = useDeleteReservation();
  const { showDialog, openDocumentViewer } = useAppStore();

  const Icon = ICONS[reservation.type] || FileText;
  const color = COLORS[reservation.type] || '#9ca3af';

  const handleDelete = () => {
    showDialog({
      type: 'confirm',
      title: 'Eliminar Reserva',
      message: `¿Borrar la reserva maestra "${reservation.title}"? Perderás las fotos adjuntas. (Las actividades en el plan no se borrarán).`,
      confirmText: 'Sí, Eliminar',
      isDestructive: true,
      onConfirm: () => {
        deleteRes(reservation.id);
      }
    });
  };

  const formattedStartLabel = reservation.type === 'hotel' ? 'Check-in' : 'Inicio';
  const formattedEndLabel = reservation.type === 'hotel' ? 'Check-out' : 'Fin';

  return (
    <div className="bg-bg-surface rounded-2xl p-5 border border-border-strong shadow-sm hover:shadow-md transition-shadow flex flex-col group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: color }}></div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pl-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, color: color }}>
            <Icon size={20} />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-base text-text-primary truncate">{reservation.title}</h3>
            {reservation.company && <p className="text-xs text-text-secondary font-medium truncate">{reservation.company}</p>}
          </div>
        </div>

        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(reservation)} className="p-1.5 text-text-muted hover:text-blue-600 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
          <button onClick={handleDelete} className="p-1.5 text-text-muted hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Body Items */}
      <div className="flex-1 space-y-3 pl-3">
        {reservation.bookingReference && (
          <div className="flex items-center gap-2 text-sm bg-bg-surface-elevated p-2 rounded-lg border border-border-strong truncate w-max max-w-full">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest shrink-0">REF/PNR</span>
            <span className="font-mono font-bold text-gray-700">{reservation.bookingReference}</span>
          </div>
        )}

        {rowInfo(formattedStartLabel, reservation.startDatetime)}
        {rowInfo(formattedEndLabel, reservation.endDatetime)}

        {reservation.cost && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">
              {reservation.cost.amount} {reservation.cost.currency}
            </span>
          </div>
        )}
      </div>

      {/* Footer (Attachments and Link) */}
      <div className="mt-4 pt-4 border-t border-border-strong pl-3 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {reservation.attachments && reservation.attachments.length > 0 ? (
            reservation.attachments.map((att, i) => (
              <button
                key={i}
                onClick={() => openDocumentViewer({ url: att.data, name: att.name, type: att.data.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg' })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors active:scale-95"
              >
                <Ticket size={14} /> {att.name.length > 15 ? att.name.substring(0, 15) + '...' : att.name}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-text-muted">Sin doc. adjuntos</span>
          )}
        </div>

        {reservation.link && (
          <a
            href={reservation.link}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 bg-bg-surface-elevated text-text-secondary rounded-lg hover:bg-border-strong"
            title="Ir al enlace original"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

    </div>
  );
};

function rowInfo(label: string, dt?: string) {
  if (!dt) return null;
  const d = new Date(dt);
  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <Calendar size={14} className="text-text-muted shrink-0" />
      <span className="font-bold w-14 shrink-0">{label}:</span>
      {d.toLocaleDateString()} a las <b>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
    </div>
  );
}
