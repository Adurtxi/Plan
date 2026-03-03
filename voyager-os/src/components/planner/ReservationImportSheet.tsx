import React from 'react';
import { X, Calendar, Ticket, PlusCircle } from 'lucide-react';
import { useReservations, useAddLocation } from '../../hooks/useTripData';
import { useAppStore } from '../../store';
import type { LocationItem, ReservationItem } from '../../types';
import { CAT_ICONS, CAT_COLORS } from '../../constants';
import { useTripVariants } from '../../hooks/useTripData';
import { RAButton } from '../ui/RAButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetDay: string;
}

export const ReservationImportSheet: React.FC<Props> = ({ isOpen, onClose, targetDay }) => {
  const { data: reservations = [] } = useReservations();
  const { mutateAsync: addLocation } = useAddLocation();
  const { data: tripVariants = [] } = useTripVariants();
  const addToast = useAppStore(s => s.addToast);
  const activeGlobal = useAppStore(s => s.activeGlobalVariantId) || 'default';

  if (!isOpen) return null;

  const getDayIdFromDate = (dateStr?: string) => {
    if (targetDay !== 'unassigned') return targetDay;
    if (!dateStr) return 'unassigned';

    const activeVar = tripVariants.find(v => v.id === activeGlobal);
    if (!activeVar?.startDate) return 'unassigned';

    const start = new Date(activeVar.startDate);
    const target = new Date(dateStr);

    // Calculate difference in days (ignoring time)
    const diffTime = Math.abs(target.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If it's before the trip or after reasonable bounds, put in unassigned
    if (target < start || diffDays > 60) return 'unassigned';

    return `day-${diffDays + 1}`;
  };

  const handleImport = async (res: ReservationItem) => {
    // Basic shared properties
    const baseLoc: Partial<LocationItem> = {
      variantId: 'default',
      globalVariantId: activeGlobal,
      reservationStatus: 'idea',
      title: res.title,
      company: res.company,
      bookingRef: res.bookingReference,
      link: res.link,
      notes: res.notes,
      attachments: res.attachments,
      // parent link
      linkedReservationId: res.id,
      isLinkedChild: true,
      day: getDayIdFromDate(res.startDatetime),
      order: Date.now()
    };

    if (res.cost) {
      baseLoc.newPrice = res.cost;
    }

    try {
      if (res.type === 'hotel') {
        const checkIn: LocationItem = {
          ...baseLoc,
          id: Date.now(),
          order: Date.now(), // first
          cat: 'hotel-checkin',
          datetime: res.startDatetime,
          city: '', // would need parsing
        } as LocationItem;

        const checkOut: LocationItem = {
          id: Date.now() + 1,
          order: Date.now() + 1, // second
          cat: 'hotel-checkout',
          day: getDayIdFromDate(res.endDatetime),
          title: `Salida de ${res.title}`,
          datetime: res.endDatetime,
          city: '',
        } as LocationItem;

        await addLocation(checkIn);
        await addLocation(checkOut);

      } else {
        // flights, buses, generic activities mapping to 1 or 2 items depending on duration
        let cat: LocationItem['cat'] = 'sight';
        if (res.type === 'flight') cat = 'flight-departure';
        else if (res.type === 'bus' || res.type === 'train') cat = 'bus-departure';
        else if (res.type === 'car-rental') cat = 'car-rental';
        else if (res.type === 'activity') cat = 'sight';
        else cat = 'sight';

        // Check if start and end are on different days (requires 2 cards? user requested start/end if different days, but for simplicity let's make 1 card with duration or 2 cards if specified. "1 tarjeta con inicio fin, a no ser de que sea en dias distintos")

        const startD = res.startDatetime ? new Date(res.startDatetime) : null;
        const endD = res.endDatetime ? new Date(res.endDatetime) : null;

        let diffDays = false;
        if (startD && endD) {
          diffDays = startD.toDateString() !== endD.toDateString();
        }

        if (diffDays) {
          // 2 cards
          const dep: LocationItem = {
            ...baseLoc,
            id: Date.now(),
            cat,
            title: `[Ida] ${res.title}`,
            datetime: res.startDatetime,
            city: '',
          } as LocationItem;

          const arr: LocationItem = {
            ...baseLoc,
            id: Date.now() + 1,
            cat,
            day: getDayIdFromDate(res.endDatetime),
            title: `[Vuelta] ${res.title}`,
            datetime: res.endDatetime,
            city: '',
          } as LocationItem;

          await addLocation(dep);
          await addLocation(arr);

        } else {
          // 1 card
          const single: LocationItem = {
            ...baseLoc,
            id: Date.now(),
            cat,
            datetime: res.startDatetime, // Start is priority
            city: '',
          } as LocationItem;

          if (startD && endD) {
            single.durationMinutes = Math.round((endD.getTime() - startD.getTime()) / 60000);
          }

          await addLocation(single);
        }
      }

      addToast(`Reserva añadida al plan (${targetDay === 'unassigned' ? 'Ideas' : targetDay})`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Error al añadir la reserva', 'error');
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-nature-primary/20 backdrop-blur-sm z-[4500] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-bg-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[4500] max-h-[85vh] flex flex-col will-change-transform animate-[slideUp_0.3s_ease-out] border-t border-border-strong">
        <div className="w-12 h-1.5 bg-bg-surface-elevated border border-border-strong rounded-full mx-auto my-3 shrink-0" />

        <div className="px-6 pb-4 border-b border-border-strong flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold font-sans text-text-primary">Inyectar Reserva</h2>
            <p className="text-sm text-text-secondary">Convierte una reserva maestra en tarjetas del plan.</p>
          </div>
          <RAButton variant="icon" aria-label="Cerrar" onPress={onClose} className="p-2 bg-bg-surface-elevated text-text-muted hover:text-nature-primary hover:bg-nature-mint/30">
            <X size={20} />
          </RAButton>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scroll">
          {reservations.length === 0 ? (
            <div className="text-center py-10">
              <Ticket size={48} className="mx-auto text-text-muted mb-3" />
              <p className="text-text-secondary font-medium">No hay reservas configuradas.</p>
              <p className="text-xs text-text-muted mt-1">Ve a la pestaña de "Logística" para añadir reservas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => {
                const Icon = CAT_ICONS[res.type === 'flight' ? 'flight-departure' : res.type === 'hotel' ? 'hotel-checkin' : res.type] || Ticket;
                const color = CAT_COLORS[res.type === 'flight' ? 'flight-departure' : res.type === 'hotel' ? 'hotel-checkin' : res.type] || '#9ca3af';

                return (
                  <div key={res.id} className="group relative overflow-hidden bg-bg-surface-elevated border border-border-strong rounded-2xl p-4 flex items-center gap-4 hover:border-nature-primary/30 transition-all">
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }}></div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-text-primary text-sm truncate">{res.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                        {res.company && <span className="truncate">{res.company}</span>}
                        {res.startDatetime && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-text-muted"></span>
                            <Calendar size={12} className="shrink-0" />
                            <span>{new Date(res.startDatetime).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <RAButton
                      variant="icon"
                      aria-label="Importar reserva"
                      onPress={() => handleImport(res)}
                      className="bg-nature-mint/30 text-nature-primary p-2 flex items-center justify-center rounded-xl hover:bg-nature-primary hover:text-white shrink-0"
                    >
                      <PlusCircle size={20} />
                    </RAButton>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
