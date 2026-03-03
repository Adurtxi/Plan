import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useReservations } from '../../hooks/useTripData';
import { ReservationCard } from './ReservationCard';
import { ReservationForm } from './ReservationForm';
import type { ReservationItem } from '../../types';
import { RAButton } from '../ui/RAButton';

export const LogisticsTab = () => {
  const { data: reservations = [] } = useReservations();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<ReservationItem | null>(null);

  const handleEdit = (res: ReservationItem) => {
    setEditingRes(res);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTimeout(() => setEditingRes(null), 300);
  };

  const sortedReservations = [...reservations].sort((a, b) => {
    const timeA = a.startDatetime ? new Date(a.startDatetime).getTime() : Infinity;
    const timeB = b.startDatetime ? new Date(b.startDatetime).getTime() : Infinity;
    return timeA - timeB;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-nature-bg relative overflow-hidden">
      <div className="shrink-0 p-4 md:p-8 bg-bg-surface border-b border-border-strong flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between z-10">
        <div>
          <h1 className="text-3xl font-sans text-nature-text leading-tight">Cartera de Reservas</h1>
          <p className="text-text-secondary font-medium text-sm mt-1">
            Gestiona tus vuelos, hoteles, trenes y actividades maestras.
          </p>
        </div>
        <RAButton variant="primary" onPress={() => { setEditingRes(null); setIsFormOpen(true); }} size="md">
          <Plus size={20} /> Añadir Reserva
        </RAButton>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8">
        {sortedReservations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-nature-mint/30 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🎫</span>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">No tienes reservas todavía</h3>
            <p className="text-text-secondary mb-8">
              Añade tus vuelos, trenes, hoteles o tickets de actividades. Luego podrás inyectarlos automáticamente en tu planificación diaria.
            </p>
            <RAButton variant="secondary" onPress={() => { setEditingRes(null); setIsFormOpen(true); }} size="md" className="border-2 border-nature-primary text-nature-primary">
              <Plus size={20} /> Crear mi primera reserva
            </RAButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
            {sortedReservations.map(res => (
              <ReservationCard key={res.id} reservation={res} onEdit={() => handleEdit(res)} />
            ))}
          </div>
        )}
      </div>

      <ReservationForm isOpen={isFormOpen} onClose={handleCloseForm} editTarget={editingRes} />
    </div>
  );
};
