import { useAppStore } from '../../store';
import { MapView } from './MapView';
import { MobileDaySelector } from './MobileDaySelector';
import { MapBottomSheet } from './MapBottomSheet';

export const MobileMapView = ({ routePolylines }: { routePolylines: React.ReactNode }) => {
  const { filterDays, setFilterDays } = useAppStore();

  // Use the first selected filterDay, or the firstDay if none selected
  const selectedDay = filterDays.length > 0 ? filterDays[0] : 'all';

  const handleSelectDay = (day: string) => {
    // Toggling the same day disables the filter on mobile (shows all days)
    if (filterDays.includes(day)) {
      setFilterDays([]);
    } else {
      setFilterDays([day]);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <header className="bg-white px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 border-b border-gray-100 z-20 shadow-sm shrink-0">
        <h1 className="text-2xl font-serif text-nature-primary mb-3">Mapa</h1>
        <MobileDaySelector selectedDay={selectedDay} onSelectDay={handleSelectDay} />
      </header>

      <div className="flex-1 relative overflow-hidden">
        <MapView
          routePolylines={routePolylines}
          setIsFormPanelOpen={() => { }}
          isAddMode={false}
          setIsAddMode={() => { }}
        />
        <MapBottomSheet selectedDay={selectedDay} />
      </div>
    </div>
  );
};
