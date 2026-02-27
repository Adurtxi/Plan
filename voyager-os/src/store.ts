import { create } from 'zustand';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChecklistItem, LocationItem, ImageFile, TransportSegment, TripVariant } from './types';
import { DAYS } from './constants';

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
  activeTab: 'planner' | 'checklist' | 'analytics';
  filterDays: string[];
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

  movingItemId: number | null;
  setMovingItemId: (id: number | null) => void;

  addTripVariant: (variant: TripVariant) => Promise<void>;
  updateTripVariant: (variant: TripVariant) => Promise<void>;
  deleteTripVariant: (id: string) => Promise<void>;
  setActiveGlobalVariantId: (id: string) => void;

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

  addChecklistItem: (text: string) => Promise<void>;
  toggleChecklistItem: (id: number, done: boolean) => Promise<void>;
  deleteChecklistItem: (id: number) => Promise<void>;

  setActiveTab: (tab: 'planner' | 'checklist' | 'analytics') => void;
  toggleFilterDay: (day: string) => void;
  setSelectedLocationId: (id: number | null) => void;
  openLightbox: (images: ImageFile[], startIndex?: number) => void;
  setLightboxIndex: (index: number) => void;
  closeLightbox: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  locations: [],
  checklist: [],
  transports: [],
  tripVariants: [],
  optimisticLocations: null,
  activeGlobalVariantId: 'default',
  activeTab: 'planner',
  filterDays: [],
  selectedLocationId: null,
  lightboxImages: null,
  lightboxIndex: 0,
  dialog: null,
  toasts: [],
  movingItemId: null,

  setMovingItemId: (id) => set({ movingItemId: id }),

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
    const locations = await db.getAll('locations');

    const validDays = [...DAYS, 'unassigned'];
    for (const loc of locations) {
      if (!validDays.includes(loc.day)) {
        loc.day = 'unassigned';
        await db.put('locations', loc);
      }
      if (!loc.variantId) loc.variantId = 'default';
      if (!loc.reservationStatus) loc.reservationStatus = 'idea';
    }

    const checklist = await db.getAll('checklist');
    const transports = await db.getAll('transports');

    let tripVariants = await db.getAll('tripVariants');
    if (tripVariants.length === 0) {
      const defaultVariant: TripVariant = { id: 'default', name: 'Plan Principal', startDate: null, endDate: null };
      await db.put('tripVariants', defaultVariant);
      tripVariants = [defaultVariant];
    }

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
      await db.put('locations', item);
      await get().loadData();
    }
  },

  moveToDay: async (id, targetDay, targetVariant) => {
    get().saveLocationHistory();
    const db = await initDB();
    const item = await db.get('locations', id);
    if (item) {
      item.day = targetDay;
      item.variantId = targetVariant;
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

    item.day = targetDay;
    item.variantId = targetVariant;
    item.groupId = targetGroupId;

    const targetGroup = locations
      .filter(l => l.day === targetDay && (l.variantId || 'default') === targetVariant && l.id !== itemId)
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

    const targetGroup = locations.filter(l =>
      l.day === day &&
      (l.variantId || 'default') === variantId &&
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
      item.day = day;
      item.variantId = variantId;
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

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleFilterDay: (day) => set(state => ({
    filterDays: state.filterDays.includes(day)
      ? state.filterDays.filter(d => d !== day)
      : [...state.filterDays, day]
  })),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  openLightbox: (images, startIndex = 0) => set({ lightboxImages: images, lightboxIndex: startIndex }),
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxImages: null, lightboxIndex: 0 }),
}));