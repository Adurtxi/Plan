import { useMemo } from 'react';
import type { LocationItem, TransportSegment, TripVariant } from '../types';
import { isTransportCat } from '../constants';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function useTimelineCalculator(
  items: LocationItem[],
  transports: TransportSegment[],
  tripVariants: TripVariant[],
  activeGlobalVariantId: string,
) {
  return useMemo(() => {
    // Helper to get integer day index
    const getDayIndex = (dayId?: string) => {
      if (!dayId || dayId === 'unassigned') return 9999;
      const match = dayId.match(/^day-(\d+)$/);
      return match ? parseInt(match[1], 10) : 9999;
    };

    const variant = tripVariants.find(v => v.id === activeGlobalVariantId) || tripVariants.find(v => v.id === 'default');
    const tz = variant?.timezone;

    // Filter out unassigned and sort by day/order globally
    const sortedItems = [...items]
      .filter(loc => loc.day !== 'unassigned')
      .sort((a, b) => {
        const dayA = getDayIndex(a.day);
        const dayB = getDayIndex(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return (a.order ?? a.id) - (b.order ?? b.id);
      });

    // Determine trip start date
    let tripStartDate = new Date();
    tripStartDate.setHours(9, 0, 0, 0);

    if (variant && variant.startDate) {
      tripStartDate = new Date(variant.startDate);
      if (!isNaN(tripStartDate.getTime())) {
        tripStartDate.setHours(9, 0, 0, 0);
      }
    }

    let currentTimeObj = dayjs(tripStartDate);
    if (tz) {
      currentTimeObj = dayjs.tz(dayjs(tripStartDate).format('YYYY-MM-DD') + "T09:00:00", tz);
    }

    let currentDayId = 'day-1';

    const calculatedItems = sortedItems.map((loc, index) => {
      const locDayIndex = getDayIndex(loc.day);
      const expectedDayStartObj = dayjs(tripStartDate).add(locDayIndex - 1, 'day').hour(9).minute(0).second(0);
      let expectedDayStart = tz ? dayjs.tz(expectedDayStartObj.format('YYYY-MM-DD') + "T09:00:00", tz) : expectedDayStartObj;

      // Handle crossing logical days
      if (loc.day !== currentDayId) {
        const locCalDateStr = expectedDayStart.format('YYYY-MM-DD');
        const currentCalDateStr = currentTimeObj.format('YYYY-MM-DD');

        if (currentCalDateStr < locCalDateStr) {
          // We haven't crossed midnight into the new day yet. Jump to the new day's 09:00!
          currentTimeObj = expectedDayStart;
        }
        currentDayId = loc.day;
      }

      let finalTimeObj = currentTimeObj;
      let conflict = false;

      // Check for rigid/pinned times
      if (loc.datetime && loc.isPinnedTime) {
        const explicitTime = tz ? dayjs.tz(loc.datetime, tz) : dayjs(loc.datetime);
        if (currentTimeObj.isAfter(explicitTime)) {
          conflict = true;
        }
        finalTimeObj = explicitTime;
      } else if (loc.datetime && isTransportCat(loc.cat)) {
        const explicitTime = tz ? dayjs.tz(loc.datetime, tz) : dayjs(loc.datetime);
        if (currentTimeObj.isAfter(explicitTime)) { conflict = true; }
        finalTimeObj = explicitTime;
      } else if (loc.datetime && (loc.cat === 'hotel-checkin' || loc.cat === 'hotel-checkout')) {
        const explicitTime = tz ? dayjs.tz(loc.datetime, tz) : dayjs(loc.datetime);
        if (currentTimeObj.isAfter(explicitTime)) { conflict = true; }
        finalTimeObj = explicitTime;
      }

      // Compute transport time to next location
      const duration = loc.durationMinutes || 60;
      let transportTime = 0;
      const nextLoc = index < sortedItems.length - 1 ? sortedItems[index + 1] : null;
      if (nextLoc) {
        const transportId = `${loc.id}-${nextLoc.id}`;
        const segment = transports.find(t => t.id === transportId);
        if (segment && segment.durationCalculated) {
          transportTime = segment.durationCalculated;
        }
      }

      // Advance cascading clock
      currentTimeObj = finalTimeObj.add(duration + transportTime, 'minute');

      return {
        ...loc,
        derivedDatetime: finalTimeObj.toISOString(),
        timeConflict: conflict,
        baseDate: finalTimeObj.toDate()
      } as LocationItem & { timeConflict?: boolean; baseDate?: Date };
    });

    return calculatedItems;
  }, [items, transports, tripVariants, activeGlobalVariantId]);
}
