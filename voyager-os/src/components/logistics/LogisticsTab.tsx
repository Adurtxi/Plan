import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useReservations } from '../../hooks/useTripData';
import { ReservationForm } from './ReservationForm';
import { ReservationCard } from './ReservationCard';

export const LogisticsTab = () => {
  const { data: reservations = [] } = useReservations();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const sortedReservations = [...reservations].sort((a, b) => {
    const timeA = a.startDatetime ? new Date(a.startDatetime).getTime() : Infinity;
    const timeB = b.startDatetime ? new Date(b.startDatetime).getTime() : Infinity;
    return timeA - timeB;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-nature-bg relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 p-4 md:p-8 bg-white border-b border-nature-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between z-10">
        <div>
          <h1 className="text-3xl font-sans text-nature-text leading-tight">Cartera de Reservas</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            Gestiona tus vuelos, hoteles, trenes y actividades maestras.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-nature-primary text-white px-5 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} /> Añadir Reserva
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8">
        {sortedReservations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-nature-mint/30 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">🎫</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes reservas todavía</h3>
            <p className="text-gray-500 mb-8">
              Añade tus vuelos, trenes, hoteles o tickets de actividades. Luego podrás inyectarlos automáticamente en tu planificación diaria.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-white border-2 border-nature-primary text-nature-primary px-6 py-3 rounded-xl font-bold hover:bg-nature-mint/10 transition-all shadow-sm"
            >
              <Plus size={20} /> Crear mi primera reserva
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
            {sortedReservations.map(res => (
              <ReservationCard key={res.id} reservation={res} onEdit={() => { }} />
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Form */}
      <ReservationForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};
