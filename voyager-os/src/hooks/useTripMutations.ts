import { useMutation, useQueryClient } from '@tanstack/react-query';
import { initDB } from '../lib/db';
import type { LocationItem, TripVariant } from '../types';
import { useAppStore } from '../store';

// Helper for date sync (copied from store/utils)
const computeDateForDay = (dayId: string, tripVariants: TripVariant[], globalVariantId: string): Date | null => {
  if (dayId === 'unassigned') return null;
  const variant = tripVariants.find(v => v.id === globalVariantId) || tripVariants.find(v => v.id === 'default');
  if (!variant?.startDate) return null;

  const start = new Date(variant.startDate);
  const dayIndexMatch = dayId.match(/^day-(\d+)$/);
  if (!dayIndexMatch) return null;

  const dayIndex = parseInt(dayIndexMatch[1], 10) - 1;
  if (isNaN(dayIndex) || dayIndex < 0) return null;

  const targetDate = new Date(start);
  targetDate.setDate(targetDate.getDate() + dayIndex);
  return targetDate;
};

const syncItemDateToDay = (item: LocationItem, targetDayId: string, tripVariants: TripVariant[], globalVariantId: string) => {
  if (!item.datetime || targetDayId === 'unassigned') return;
  const targetDate = computeDateForDay(targetDayId, tripVariants, globalVariantId);
  if (targetDate) {
    const d = new Date(item.datetime);
    d.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    item.datetime = d.toISOString();
  }
};

export const useMoveToDay = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async ({ id, targetDay, targetVariant }: { id: number, targetDay: string, targetVariant: string }) => {
      saveLocationHistory();
      const db = await initDB();
      const item = await db.get('locations', id);

      if (item) {
        const tripVariants = await db.getAll('tripVariants');
        const activeGlobal = useAppStore.getState().activeGlobalVariantId || 'default';

        if (item.day !== targetDay) {
          syncItemDateToDay(item, targetDay, tripVariants, activeGlobal);
        }
        item.day = targetDay;
        item.variantId = targetVariant;
        item.globalVariantId = activeGlobal;
        item.groupId = undefined;
        item.order = Date.now();
        await db.put('locations', item);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      useAppStore.getState().addToast('Ubicación movida', 'success');
    }
  });
};

export const useMergeLocations = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async ({ activeId, targetId }: { activeId: number, targetId: number }) => {
      saveLocationHistory();
      const db = await initDB();
      const item1 = await db.get('locations', activeId);
      const item2 = await db.get('locations', targetId);
      if (!item1 || !item2) return;

      const activeGlobal = useAppStore.getState().activeGlobalVariantId || 'default';
      const newGroupId = item2.groupId || item1.groupId || `group-${Date.now()}`;
      item1.groupId = newGroupId;
      item2.groupId = newGroupId;
      item1.day = item2.day;
      item1.variantId = item2.variantId;
      item1.globalVariantId = item2.globalVariantId || activeGlobal;

      await db.put('locations', item1);
      await db.put('locations', item2);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      useAppStore.getState().addToast('Actividades agrupadas', 'success');
    }
  });
};

export const useGroupWithNext = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (id: number) => {
      const db = await initDB();
      const item = await db.get('locations', id);
      if (!item) return;

      saveLocationHistory();

      const locations = await db.getAll('locations');
      const dayLocs = locations
        .filter(l => l.day === item.day && (l.variantId || 'default') === (item.variantId || 'default'))
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

      const currentIndex = dayLocs.findIndex(l => l.id === id);
      if (currentIndex < 0 || currentIndex >= dayLocs.length - 1) return;

      const nextItem = dayLocs[currentIndex + 1];

      const newGroupId = nextItem.groupId || item.groupId || `group-${Date.now()}`;
      item.groupId = newGroupId;
      nextItem.groupId = newGroupId;
      await db.put('locations', item);
      await db.put('locations', nextItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};

export const useExtractFromGroup = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (id: number) => {
      saveLocationHistory();
      const db = await initDB();
      const item = await db.get('locations', id);
      if (item && item.groupId) {
        item.groupId = undefined;
        await db.put('locations', item);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      useAppStore.getState().addToast('Extraído del grupo', 'info');
    }
  });
};

export const useUngroupLocationGroup = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async (groupId: string) => {
      saveLocationHistory();
      const db = await initDB();
      const locations = await db.getAll('locations');

      for (const l of locations) {
        if (l.groupId === groupId) {
          l.groupId = undefined;
          await db.put('locations', l);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};

export const useExecuteMoveHere = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async ({ itemId, targetDay, targetVariant, targetGroupId, insertBeforeId }: { itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null }) => {
      saveLocationHistory();
      const db = await initDB();
      const locations = await db.getAll('locations');

      const item = locations.find(l => l.id === itemId);
      if (!item) return;

      const tripVariants = await db.getAll('tripVariants');
      const activeGlobal = useAppStore.getState().activeGlobalVariantId || 'default';

      if (item.day !== targetDay) {
        syncItemDateToDay(item, targetDay, tripVariants, activeGlobal);
      }
      item.day = targetDay;
      item.variantId = targetVariant;
      item.globalVariantId = activeGlobal;
      item.groupId = targetGroupId;

      const targetGroup = locations
        .filter(l => l.day === targetDay && (l.variantId || 'default') === targetVariant && (l.globalVariantId || 'default') === activeGlobal && l.id !== itemId)
        .sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

      let insertIndex = targetGroup.length;
      if (insertBeforeId) {
        const idx = targetGroup.findIndex(l => l.id === insertBeforeId);
        if (idx !== -1) insertIndex = idx;
      }

      targetGroup.splice(insertIndex, 0, item);

      for (let i = 0; i < targetGroup.length; i++) {
        targetGroup[i].order = i;
        await db.put('locations', targetGroup[i]);
      }

      useAppStore.getState().setMovingItemId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};

export const useReorderLocation = () => {
  const queryClient = useQueryClient();
  const saveLocationHistory = useAppStore(s => s.saveLocationHistory);

  return useMutation({
    mutationFn: async ({ activeId, overId, day, variantId }: { activeId: string | number, overId: string | number | null, day: string, variantId: string }) => {
      saveLocationHistory();
      const db = await initDB();
      const locations = await db.getAll('locations');

      const isGroupDrag = typeof activeId === 'string' && activeId.startsWith('group-');
      const activeGroupId = isGroupDrag ? (activeId as string).replace('group-', '') : null;

      const activeItems = isGroupDrag
        ? locations.filter(l => l.groupId === activeGroupId).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
        : locations.filter(l => l.id.toString() === activeId.toString());

      if (activeItems.length === 0) return;

      const tripVariants = await db.getAll('tripVariants');
      const currentActiveGlobal = useAppStore.getState().activeGlobalVariantId || 'default';

      const targetGroup = locations.filter(l =>
        l.day === day &&
        (l.variantId || 'default') === variantId &&
        (l.globalVariantId || 'default') === currentActiveGlobal &&
        !activeItems.find(a => a.id === l.id)
      ).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));

      const isOverGroupContainer = typeof overId === 'string' && overId.startsWith('group-');
      const overGroupId = isOverGroupContainer ? (overId as string).replace('group-', '') : null;

      let inheritedGroupId: string | undefined = undefined;
      if (isOverGroupContainer && overGroupId) {
        inheritedGroupId = overGroupId;
      } else if (overId) {
        const overItemLoc = locations.find(l => l.id.toString() === overId.toString());
        if (overItemLoc?.groupId) {
          inheritedGroupId = overItemLoc.groupId;
        }
      }

      activeItems.forEach(item => {
        if (item.day !== day) {
          syncItemDateToDay(item, day, tripVariants, currentActiveGlobal);
        }
        item.day = day;
        item.variantId = variantId;
        item.globalVariantId = currentActiveGlobal;
        if (!isGroupDrag) {
          item.groupId = inheritedGroupId;
        }
      });

      if (overId) {
        let insertIndex = -1;
        if (isOverGroupContainer) {
          insertIndex = targetGroup.findIndex(l => l.groupId === overGroupId);
        } else {
          insertIndex = targetGroup.findIndex(l => l.id.toString() === overId.toString());
        }

        if (insertIndex >= 0) {
          targetGroup.splice(insertIndex, 0, ...activeItems);
        } else {
          targetGroup.push(...activeItems);
        }
      } else {
        targetGroup.push(...activeItems);
      }

      for (let i = 0; i < targetGroup.length; i++) {
        targetGroup[i].order = i;
        await db.put('locations', targetGroup[i]);
      }
    },
    // We can handle optimistic updates within the ScheduleBoard instead
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  });
};
