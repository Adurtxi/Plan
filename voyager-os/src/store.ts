import { create } from 'zustand';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChecklistItem, LocationItem, ImageFile, TransportSegment, TripVariant } from './types';

interface VoyagerDB extends DBSchema {
  locations: { key: number; value: LocationItem };
  checklist: { key: number; value: ChecklistItem; indexes: { 'by-id': number } };
  transports: { key: string; value: TransportSegment };
  tripVariants: { key: string; value: TripVariant };
}

export interface DialogConfig {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message?: string;
  defaultValue?: string;
  inputPlaceholder?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

export interface ToastConfig {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onUndo?: () => void;
}

let dbPromise: Promise<IDBPDatabase<VoyagerDB>>;

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

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VoyagerDB>('VoyagerV3_Nature', 3, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains('locations')) {
          db.createObjectStore('locations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('checklist')) {
          db.createObjectStore('checklist', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('transports')) {
          db.createObjectStore('transports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tripVariants')) {
          db.createObjectStore('tripVariants', { keyPath: 'id' });
        }

        if (oldVersion < 2 && db.objectStoreNames.contains('locations')) {
          const store = transaction.objectStore('locations');
          store.openCursor().then(function cursorIterate(cursor) {
            if (!cursor) return;
            const updateData = { ...cursor.value };
            if (!updateData.variantId) updateData.variantId = 'default';
            if (!updateData.reservationStatus) updateData.reservationStatus = 'idea';
            cursor.update(updateData);
            cursor.continue().then(cursorIterate);
          });
        }
      },
    });
  }
  return dbPromise;
};

interface AppState {
  locations: LocationItem[];
  checklist: ChecklistItem[];
  transports: TransportSegment[];
  tripVariants: TripVariant[];
  activeGlobalVariantId: string;
  filterDays: string[];
  activeDayVariants: Record<string, string>;
  setActiveDayVariant: (dayId: string, variantId: string) => void;
  selectedLocationId: number | null;
  lightboxImages: ImageFile[] | null;
  lightboxIndex: number;

  dialog: DialogConfig | null;
  toasts: ToastConfig[];

  pastLocations: LocationItem[][];
  futureLocations: LocationItem[][];
  saveLocationHistory: () => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;

  showDialog: (config: DialogConfig) => void;
  closeDialog: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info', onUndo?: () => void) => void;
  removeToast: (id: string) => void;

  loadData: () => Promise<void>;

  optimisticLocations: LocationItem[] | null;
  setOptimisticLocations: (locs: LocationItem[]) => void;
  commitOptimisticLocations: () => Promise<void>;
  clearOptimisticLocations: () => void;

  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  movingItemId: number | null;
  setMovingItemId: (id: number | null) => void;
  isDrawingRouteFor: string | null;
  setDrawingRouteFor: (id: string | null) => void;
  reframeMapCoordinates: { lat: number, lng: number } | null;
  setReframeMapCoordinates: (coords: { lat: number, lng: number } | null) => void;

  addTripVariant: (variant: TripVariant) => Promise<void>;
  updateTripVariant: (variant: TripVariant) => Promise<void>;
  deleteTripVariant: (id: string) => Promise<void>;
  setActiveGlobalVariantId: (id: string) => void;

  theme: 'light' | 'dark';
  toggleTheme: () => void;

  addLocation: (loc: LocationItem) => Promise<void>;
  updateLocation: (loc: LocationItem) => Promise<void>;
  updateLocationDay: (id: number, day: string, variantId?: string) => Promise<void>;
  reorderLocation: (activeId: string | number, overId: string | number | null, targetDay: string, targetVariant: string) => Promise<void>;
  executeMoveHere: (itemId: number, targetDay: string, targetVariant: string, targetGroupId?: string, insertBeforeId?: number | null) => Promise<void>;
  mergeLocations: (activeId: number, targetId: number) => Promise<void>;
  ungroupLocationGroup: (groupId: string) => Promise<void>;
  extractFromGroup: (id: number) => Promise<void>;
  groupWithNext: (id: number) => Promise<void>;
  moveToDay: (id: number, targetDay: string, targetVariant: string) => Promise<void>;
  deleteLocation: (id: number) => Promise<void>;

  addTransport: (transport: TransportSegment) => Promise<void>;
  updateTransport: (transport: TransportSegment) => Promise<void>;
  deleteTransport: (id: string) => Promise<void>;
  addRoutePoint: (transportId: string, lat: number, lng: number) => Promise<void>;

  addChecklistItem: (text: string) => Promise<void>;
  toggleChecklistItem: (id: number, done: boolean) => Promise<void>;
  deleteChecklistItem: (id: number) => Promise<void>;

  mobileView: 'plan' | 'map';
  setMobileView: (view: 'plan' | 'map') => void;
  toggleFilterDay: (day: string) => void;
  setFilterDays: (days: string[]) => void;
  setSelectedLocationId: (id: number | null) => void;
  lightboxLocationId: number | null;
  openLightbox: (images: ImageFile[], startIndex?: number, locationId?: number | null) => void;
  setLightboxIndex: (index: number) => void;
  closeLightbox: () => void;

  isTripSettingsOpen: boolean;
  setIsTripSettingsOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  locations: [],
  checklist: [],
  transports: [],
  tripVariants: [],
  optimisticLocations: null,
  activeGlobalVariantId: 'default',
  mobileView: 'plan',
  setMobileView: (view) => set({ mobileView: view }),
  filterDays: [],
  activeDayVariants: {},
  setActiveDayVariant: (dayId, variantId) => set(state => ({ activeDayVariants: { ...state.activeDayVariants, [dayId]: variantId } })),
  selectedLocationId: null,
  lightboxImages: null,
  lightboxIndex: 0,
  dialog: null,
  toasts: [],
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  movingItemId: null,

  setMovingItemId: (id) => set({ movingItemId: id }),

  isTripSettingsOpen: false,
  setIsTripSettingsOpen: (isOpen) => set({ isTripSettingsOpen: isOpen }),

  isDrawingRouteFor: null,
  setDrawingRouteFor: (transportId) => set({ isDrawingRouteFor: transportId }),

  reframeMapCoordinates: null,
  setReframeMapCoordinates: (coords) => set({ reframeMapCoordinates: coords }),

  theme: (localStorage.getItem('voyager-theme') as 'light' | 'dark') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  toggleTheme: () => set(state => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('voyager-theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { theme: newTheme };
  }),

  showDialog: (config) => set({ dialog: config }),
  closeDialog: () => set({ dialog: null }),
  addToast: (message, type = 'success', onUndo) => {
    const id = Date.now().toString();
    set(state => ({ toasts: [...state.toasts, { id, message, type, onUndo }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, onUndo ? 8000 : 4000);
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  setOptimisticLocations: (locs) => set({ optimisticLocations: locs }),
  commitOptimisticLocations: async () => {
    const { optimisticLocations } = get();
    if (!optimisticLocations) return;

    get().saveLocationHistory();

    const db = await initDB();
    const tx = db.transaction('locations', 'readwrite');
    await tx.store.clear();
    for (const loc of optimisticLocations) {
      await tx.store.put(loc);
    }
    await tx.done;

    set({ optimisticLocations: null });
    await get().loadData();
  },
  clearOptimisticLocations: () => set({ optimisticLocations: null }),

  pastLocations: [],
  futureLocations: [],

  saveLocationHistory: () => {
    const { locations, pastLocations } = get();
    const newPast = [...pastLocations, JSON.parse(JSON.stringify(locations))].slice(-20);
    set({ pastLocations: newPast, futureLocations: [] });
  },

  undo: async () => {
    const { pastLocations, locations, futureLocations } = get();
    if (pastLocations.length === 0) return;

    const previousState = pastLocations[pastLocations.length - 1];
    const newPast = pastLocations.slice(0, -1);

    set({
      pastLocations: newPast,
      futureLocations: [JSON.parse(JSON.stringify(locations)), ...futureLocations]
    });

    const db = await initDB();
    const tx = db.transaction('locations', 'readwrite');
    await tx.store.clear();
    for (const loc of previousState) {
      await tx.store.put(loc);
    }
    await tx.done;

    await get().loadData();
    get().addToast('Acción deshecha', 'info');
  },

  redo: async () => {
    const { pastLocations, locations, futureLocations } = get();
    if (futureLocations.length === 0) return;

    const nextState = futureLocations[0];
    const newFuture = futureLocations.slice(1);

    set({
      pastLocations: [...pastLocations, JSON.parse(JSON.stringify(locations))],
      futureLocations: newFuture
    });

    const db = await initDB();
    const tx = db.transaction('locations', 'readwrite');
    await tx.store.clear();
    for (const loc of nextState) {
      await tx.store.put(loc);
    }
    await tx.done;

    await get().loadData();
    get().addToast('Acción rehecha', 'info');
  },

  loadData: async () => {
    const db = await initDB();

    let tripVariants = await db.getAll('tripVariants');
    if (tripVariants.length === 0) {
      const defaultVariant: TripVariant = { id: 'default', name: 'Plan Principal', startDate: null, endDate: null };
      await db.put('tripVariants', defaultVariant);
      tripVariants = [defaultVariant];
    }
    const globalVariantIds = tripVariants.map(v => v.id);

    const locations = await db.getAll('locations');

    for (const loc of locations) {
      if (!loc.variantId) loc.variantId = 'default';

      // Migration: if globalVariantId is missing, check if the old variantId is actually a global plan ID
      if (!loc.globalVariantId) {
        if (globalVariantIds.includes(loc.variantId)) {
          loc.globalVariantId = loc.variantId;
          loc.variantId = 'default';
        } else {
          loc.globalVariantId = 'default';
        }
        await db.put('locations', loc);
      }

      if (!loc.reservationStatus) loc.reservationStatus = 'idea';

      // Migration v4: remap old categories to new specialized ones
      const legacyCat = loc.cat as string;
      if (legacyCat === 'logistics' && loc.logisticsType) {
        (loc as any).cat = loc.logisticsType; // 'hotel-checkin' etc. are now valid Category values
        loc.logisticsType = undefined;
        await db.put('locations', loc);
      } else if (legacyCat === 'flight') {
        (loc as any).cat = 'flight-departure';
        await db.put('locations', loc);
      } else if (legacyCat === 'transport') {
        (loc as any).cat = 'taxi';
        await db.put('locations', loc);
      } else if (legacyCat === 'hotel') {
        (loc as any).cat = 'hotel-checkin';
        await db.put('locations', loc);
      }
    }

    const checklist = await db.getAll('checklist');
    const transports = await db.getAll('transports');

    set({ locations, checklist, transports, tripVariants });
  },

  addTripVariant: async (variant) => {
    const db = await initDB();
    await db.put('tripVariants', variant);
    await get().loadData();
  },

  updateTripVariant: async (variant) => {
    const db = await initDB();
    await db.put('tripVariants', variant);
    await get().loadData();
  },

  deleteTripVariant: async (id) => {
    if (id === 'default') return;
    const db = await initDB();
    await db.delete('tripVariants', id);
    await get().loadData();
  },

  setActiveGlobalVariantId: (id) => set({ activeGlobalVariantId: id, filterDays: [] }),

  addLocation: async (loc) => {
    get().saveLocationHistory();
    const db = await initDB();
    await db.put('locations', loc);
    await get().loadData();
  },

  updateLocation: async (loc) => {
    get().saveLocationHistory();
    const db = await initDB();
    await db.put('locations', loc);
    await get().loadData();
  },

  updateLocationDay: async (id, day, variantId) => {
    const db = await initDB();
    const item = await db.get('locations', id);
    if (item) {
      get().saveLocationHistory();
      item.day = day;
      if (variantId) item.variantId = variantId;
      if (!item.globalVariantId) item.globalVariantId = get().activeGlobalVariantId || 'default';
      await db.put('locations', item);
      await get().loadData();
    }
  },

  moveToDay: async (id, targetDay, targetVariant) => {
    get().saveLocationHistory();
    const db = await initDB();
    const item = await db.get('locations', id);
    if (item) {
      if (item.day !== targetDay) {
        syncItemDateToDay(item, targetDay, get().tripVariants, get().activeGlobalVariantId || 'default');
      }
      item.day = targetDay;
      item.variantId = targetVariant;
      item.globalVariantId = get().activeGlobalVariantId || 'default';
      item.groupId = undefined;
      item.order = Date.now();
      await db.put('locations', item);
      await get().loadData();
      get().addToast('Ubicación movida', 'success');
    }
  },

  executeMoveHere: async (itemId, targetDay, targetVariant, targetGroupId, insertBeforeId) => {
    get().saveLocationHistory();
    const db = await initDB();
    const locations = await db.getAll('locations');

    const item = locations.find(l => l.id === itemId);
    if (!item) return;

    if (item.day !== targetDay) {
      syncItemDateToDay(item, targetDay, get().tripVariants, get().activeGlobalVariantId || 'default');
    }
    item.day = targetDay;
    item.variantId = targetVariant;
    item.globalVariantId = get().activeGlobalVariantId || 'default';
    item.groupId = targetGroupId;

    const targetGroup = locations
      .filter(l => l.day === targetDay && (l.variantId || 'default') === targetVariant && (l.globalVariantId || 'default') === (get().activeGlobalVariantId || 'default') && l.id !== itemId)
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

    set({ movingItemId: null });
    await get().loadData();
  },

  mergeLocations: async (activeId, targetId) => {
    get().saveLocationHistory();
    const db = await initDB();
    const item1 = await db.get('locations', activeId);
    const item2 = await db.get('locations', targetId);
    if (!item1 || !item2) return;

    const newGroupId = item2.groupId || item1.groupId || `group-${Date.now()}`;
    item1.groupId = newGroupId;
    item2.groupId = newGroupId;
    item1.day = item2.day;
    item1.variantId = item2.variantId;
    item1.globalVariantId = item2.globalVariantId || get().activeGlobalVariantId || 'default';

    await db.put('locations', item1);
    await db.put('locations', item2);
    await get().loadData();
    get().addToast('Actividades agrupadas', 'success');
  },

  reorderLocation: async (activeId, overId, day, variantId) => {
    get().saveLocationHistory();
    const db = await initDB();
    const locations = await db.getAll('locations');

    const isGroupDrag = typeof activeId === 'string' && activeId.startsWith('group-');
    const activeGroupId = isGroupDrag ? (activeId as string).replace('group-', '') : null;

    const activeItems = isGroupDrag
      ? locations.filter(l => l.groupId === activeGroupId).sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id))
      : locations.filter(l => l.id.toString() === activeId.toString());

    if (activeItems.length === 0) return;

    const currentActiveGlobal = get().activeGlobalVariantId || 'default';
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
        syncItemDateToDay(item, day, get().tripVariants, currentActiveGlobal);
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

    await get().loadData();
  },

  ungroupLocationGroup: async (groupId) => {
    get().saveLocationHistory();
    const db = await initDB();
    const locations = await db.getAll('locations');

    for (const l of locations) {
      if (l.groupId === groupId) {
        l.groupId = undefined;
        await db.put('locations', l);
      }
    }
    await get().loadData();
  },

  extractFromGroup: async (id) => {
    get().saveLocationHistory();
    const db = await initDB();
    const item = await db.get('locations', id);
    if (item && item.groupId) {
      item.groupId = undefined;
      await db.put('locations', item);
      await get().loadData();
      get().addToast('Extraído del grupo', 'info');
    }
  },

  groupWithNext: async (id) => {
    const db = await initDB();
    const item = await db.get('locations', id);
    if (!item) return;

    get().saveLocationHistory();

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

    await get().loadData();
  },

  deleteLocation: async (id) => {
    get().saveLocationHistory();
    const db = await initDB();
    await db.delete('locations', id);
    const transports = await db.getAll('transports');
    for (const t of transports) {
      if (t.fromLocationId === id || t.toLocationId === id) {
        await db.delete('transports', t.id);
      }
    }
    await get().loadData();
  },

  addTransport: async (transport) => {
    const db = await initDB();
    await db.put('transports', transport);
    await get().loadData();
  },

  updateTransport: async (transport) => {
    const db = await initDB();
    await db.put('transports', transport);
    await get().loadData();
  },

  deleteTransport: async (id) => {
    const db = await initDB();
    await db.delete('transports', id);
    await get().loadData();
  },

  addRoutePoint: async (transportId, lat, lng) => {
    const db = await initDB();
    const transport = await db.get('transports', transportId);
    if (!transport) return;

    if (!transport.polyline) {
      transport.polyline = [];
    }

    transport.polyline.push([lat, lng]);
    transport.durationCalculated = 0; // Clear auto duration since it's custom drawn now
    await db.put('transports', transport);
    await get().loadData();
  },

  addChecklistItem: async (text) => {
    const db = await initDB();
    await db.add('checklist', { id: Date.now(), text, done: false });
    await get().loadData();
  },

  toggleChecklistItem: async (id, done) => {
    const db = await initDB();
    const item = await db.get('checklist', id);
    if (item) {
      item.done = done;
      await db.put('checklist', item);
      await get().loadData();
    }
  },

  deleteChecklistItem: async (id) => {
    const db = await initDB();
    await db.delete('checklist', id);
    await get().loadData();
  },

  toggleFilterDay: (day) => set(state => ({
    filterDays: state.filterDays.includes(day)
      ? state.filterDays.filter(d => d !== day)
      : [...state.filterDays, day]
  })),
  setFilterDays: (days) => set({ filterDays: days }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  lightboxLocationId: null,
  openLightbox: (images, startIndex = 0, locationId = null) => set({ lightboxImages: images, lightboxIndex: startIndex, lightboxLocationId: locationId }),
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxImages: null, lightboxIndex: 0, lightboxLocationId: null }),
}));