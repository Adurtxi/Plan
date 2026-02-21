import { create } from 'zustand';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChecklistItem, LocationItem, ImageFile, TransportSegment } from './types';
import { DAYS } from './constants';

interface VoyagerDB extends DBSchema {
  locations: { key: number; value: LocationItem };
  checklist: { key: number; value: ChecklistItem; indexes: { 'by-id': number } };
  transports: { key: string; value: TransportSegment };
}

let dbPromise: Promise<IDBPDatabase<VoyagerDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VoyagerDB>('VoyagerV3_Nature', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('locations')) {
          db.createObjectStore('locations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('checklist')) {
          db.createObjectStore('checklist', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('transports')) {
          db.createObjectStore('transports', { keyPath: 'id' });
        }

        // Migration logic for old items
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
  activeTab: 'planner' | 'checklist' | 'analytics';
  filterDay: string;
  selectedLocationId: number | null;
  lightboxImages: ImageFile[] | null;
  lightboxIndex: number;

  // Data actions
  loadData: () => Promise<void>;
  addLocation: (loc: LocationItem) => Promise<void>;
  updateLocation: (loc: LocationItem) => Promise<void>; // Replaces and expands updateLocationDay
  updateLocationDay: (id: number, day: string, variantId?: string) => Promise<void>; // Kept for backwards compatibility
  deleteLocation: (id: number) => Promise<void>;

  addTransport: (transport: TransportSegment) => Promise<void>;
  updateTransport: (transport: TransportSegment) => Promise<void>;
  deleteTransport: (id: string) => Promise<void>;

  addChecklistItem: (text: string) => Promise<void>;
  toggleChecklistItem: (id: number, done: boolean) => Promise<void>;
  deleteChecklistItem: (id: number) => Promise<void>;

  // UI actions
  setActiveTab: (tab: 'planner' | 'checklist' | 'analytics') => void;
  setFilterDay: (day: string) => void;
  setSelectedLocationId: (id: number | null) => void;
  openLightbox: (images: ImageFile[], startIndex?: number) => void;
  setLightboxIndex: (index: number) => void;
  closeLightbox: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  locations: [],
  checklist: [],
  transports: [],
  activeTab: 'planner',
  filterDay: 'all',
  selectedLocationId: null,
  lightboxImages: null,
  lightboxIndex: 0,

  loadData: async () => {
    const db = await initDB();
    const locations = await db.getAll('locations');

    // Auto-fix broken locations from the drag-and-drop bug
    const validDays = [...DAYS, 'unassigned'];
    for (const loc of locations) {
      if (!validDays.includes(loc.day)) {
        loc.day = 'unassigned';
        await db.put('locations', loc);
      }
      // Migrate strictly offline
      if (!loc.variantId) loc.variantId = 'default';
      if (!loc.reservationStatus) loc.reservationStatus = 'idea';
    }

    const checklist = await db.getAll('checklist');
    const transports = await db.getAll('transports');
    set({ locations, checklist, transports });
  },

  addLocation: async (loc) => {
    const db = await initDB();
    await db.put('locations', loc);
    await get().loadData();
  },

  updateLocation: async (loc) => {
    const db = await initDB();
    await db.put('locations', loc);
    await get().loadData();
  },

  updateLocationDay: async (id, day, variantId) => {
    const db = await initDB();
    const item = await db.get('locations', id);
    if (item) {
      item.day = day;
      if (variantId) item.variantId = variantId;
      await db.put('locations', item);
      await get().loadData();
    }
  },

  deleteLocation: async (id) => {
    const db = await initDB();
    await db.delete('locations', id);
    // Also cleanup associated transports
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
  setFilterDay: (day) => set({ filterDay: day }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  openLightbox: (images, startIndex = 0) => set({ lightboxImages: images, lightboxIndex: startIndex }),
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxImages: null, lightboxIndex: 0 }),
}));