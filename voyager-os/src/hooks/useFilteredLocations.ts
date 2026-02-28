import { useMemo } from 'react';
import { useAppStore } from '../store';

export const useFilteredLocations = () => {
  const { locations, filterDays, activeGlobalVariantId, activeDayVariants } = useAppStore();

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      // 1. Exclude unassigned
      if (loc.day === 'unassigned') return false;

      // 2. Filter by Day (if any selected). If filterDays is empty, show all days.
      if (filterDays.length > 0 && !filterDays.includes(loc.day)) return false;

      // 3. Filter by Variant
      const locGlobal = loc.globalVariantId || 'default';
      const locDay = loc.variantId || 'default';

      const activeGlobal = activeGlobalVariantId || 'default';
      const activeDay = activeDayVariants[loc.day] || 'default';

      return locGlobal === activeGlobal && locDay === activeDay;
    });
  }, [locations, filterDays, activeGlobalVariantId, activeDayVariants]);

  return filteredLocations;
};
