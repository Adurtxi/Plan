import { create } from 'zustand';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LocationItem, ImageFile } from './types';
import { QueryClient } from '@tanstack/react-query';

// ==========================================
// Shared query client reference (set from main.tsx)
// ==========================================
let _queryClient: QueryClient | null = null;
export const setQueryClient = (qc: QueryClient) => { _queryClient = qc; };
const getQueryClient = () => {
  if (!_queryClient) throw new Error('QueryClient not set. Call setQueryClient() in main.tsx');
  return _queryClient;
};

// ==========================================
// DB Schema (only needed for undo/redo)
// ==========================================
interface VoyagerDB extends DBSchema {
  locations: { key: number; value: LocationItem };
  checklist: { key: number; value: any; indexes: { 'by-id': number } };
  transports: { key: string; value: any };
  tripVariants: { key: string; value: any };
  reservations: { key: string; value: any };
}

let dbPromise: Promise<IDBPDatabase<VoyagerDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VoyagerDB>('VoyagerV3_Nature', 4, {
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
        if (!db.objectStoreNames.contains('reservations')) {
          db.createObjectStore('reservations', { keyPath: 'id' });
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

// ==========================================
// Types
// ==========================================

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

interface AppState {
  // --- UI / Selection ---
  activeGlobalVariantId: string;
  setActiveGlobalVariantId: (id: string) => void;
  filterDays: string[];
  toggleFilterDay: (day: string) => void;
  setFilterDays: (days: string[]) => void;
  activeDayVariants: Record<string, string>;
  setActiveDayVariant: (dayId: string, variantId: string) => void;

  selectedLocationId: number | null;
  setSelectedLocationId: (id: number | null) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (isOpen: boolean) => void;

  // --- Editing ---
  editingLocationId: number | null;
  setEditingLocationId: (id: number | null) => void;

  // --- Lightbox ---
  lightboxImages: ImageFile[] | null;
  lightboxIndex: number;
  lightboxLocationId: number | null;
  openLightbox: (images: ImageFile[], startIndex?: number, locationId?: number | null) => void;
  setLightboxIndex: (index: number) => void;
  closeLightbox: () => void;

  // --- Document Viewer ---
  viewerDocument: { url: string; type: string; name: string } | null;
  openDocumentViewer: (doc: { url: string; type: string; name: string }) => void;
  closeDocumentViewer: () => void;

  // --- Dialog / Toast ---
  dialog: DialogConfig | null;
  toasts: ToastConfig[];
  showDialog: (config: DialogConfig) => void;
  closeDialog: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info', onUndo?: () => void) => void;
  removeToast: (id: string) => void;

  // --- Optimistic DnD ---
  optimisticLocations: LocationItem[] | null;
  setOptimisticLocations: (locs: LocationItem[]) => void;
  clearOptimisticLocations: () => void;

  // --- Drag state ---
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  movingItemId: number | null;
  setMovingItemId: (id: number | null) => void;
  isDrawingRouteFor: string | null;
  setDrawingRouteFor: (id: string | null) => void;
  reframeMapCoordinates: { lat: number, lng: number } | null;
  setReframeMapCoordinates: (coords: { lat: number, lng: number } | null) => void;

  // --- Theme ---
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // --- Mobile ---
  mobileView: 'plan' | 'map';
  setMobileView: (view: 'plan' | 'map') => void;

  // --- Trip Settings ---
  isTripSettingsOpen: boolean;
  setIsTripSettingsOpen: (isOpen: boolean) => void;

  // --- Undo / Redo ---
  pastLocations: LocationItem[][];
  futureLocations: LocationItem[][];
  saveLocationHistory: () => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

// ==========================================
// Store
// ==========================================

export const useAppStore = create<AppState>((set, get) => ({
  // --- UI / Selection ---
  activeGlobalVariantId: 'default',
  setActiveGlobalVariantId: (id) => set({ activeGlobalVariantId: id, filterDays: [] }),
  filterDays: [],
  toggleFilterDay: (day) => set(state => ({
    filterDays: state.filterDays.includes(day)
      ? state.filterDays.filter(d => d !== day)
      : [...state.filterDays, day]
  })),
  setFilterDays: (days) => set({ filterDays: days }),
  activeDayVariants: {},
  setActiveDayVariant: (dayId, variantId) => set(state => ({ activeDayVariants: { ...state.activeDayVariants, [dayId]: variantId } })),

  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  isDetailModalOpen: false,
  setIsDetailModalOpen: (isOpen) => set({ isDetailModalOpen: isOpen }),

  // --- Editing ---
  editingLocationId: null,
  setEditingLocationId: (id) => set({ editingLocationId: id }),

  // --- Lightbox ---
  lightboxImages: null,
  lightboxIndex: 0,
  lightboxLocationId: null,
  openLightbox: (images, startIndex = 0, locationId = null) => set({ lightboxImages: images, lightboxIndex: startIndex, lightboxLocationId: locationId }),
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxImages: null, lightboxIndex: 0, lightboxLocationId: null }),

  // --- Document Viewer ---
  viewerDocument: null,
  openDocumentViewer: (doc) => set({ viewerDocument: doc }),
  closeDocumentViewer: () => set({ viewerDocument: null }),

  // --- Dialog / Toast ---
  dialog: null,
  toasts: [],
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

  // --- Optimistic DnD ---
  optimisticLocations: null,
  setOptimisticLocations: (locs) => set({ optimisticLocations: locs }),
  clearOptimisticLocations: () => set({ optimisticLocations: null }),

  // --- Drag state ---
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
  movingItemId: null,
  setMovingItemId: (id) => set({ movingItemId: id }),
  isDrawingRouteFor: null,
  setDrawingRouteFor: (transportId) => set({ isDrawingRouteFor: transportId }),
  reframeMapCoordinates: null,
  setReframeMapCoordinates: (coords) => set({ reframeMapCoordinates: coords }),

  // --- Theme ---
  theme: (localStorage.getItem('voyager-theme') as 'light' | 'dark') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  toggleTheme: () => set(state => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('voyager-theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { theme: newTheme };
  }),

  // --- Mobile ---
  mobileView: 'plan',
  setMobileView: (view) => set({ mobileView: view }),

  // --- Trip Settings ---
  isTripSettingsOpen: false,
  setIsTripSettingsOpen: (isOpen) => set({ isTripSettingsOpen: isOpen }),

  // --- Undo / Redo ---
  pastLocations: [],
  futureLocations: [],

  saveLocationHistory: () => {
    // Read current locations from React Query cache
    const qc = getQueryClient();
    const currentLocations = (qc.getQueryData<LocationItem[]>(['locations']) || []);
    const { pastLocations } = get();
    const newPast = [...pastLocations, JSON.parse(JSON.stringify(currentLocations))].slice(-20);
    set({ pastLocations: newPast, futureLocations: [] });
  },

  undo: async () => {
    const { pastLocations, futureLocations } = get();
    if (pastLocations.length === 0) return;

    const qc = getQueryClient();
    const currentLocations = (qc.getQueryData<LocationItem[]>(['locations']) || []);

    const previousState = pastLocations[pastLocations.length - 1];
    const newPast = pastLocations.slice(0, -1);

    set({
      pastLocations: newPast,
      futureLocations: [JSON.parse(JSON.stringify(currentLocations)), ...futureLocations]
    });

    const db = await initDB();
    const tx = db.transaction('locations', 'readwrite');
    await tx.store.clear();
    for (const loc of previousState) {
      await tx.store.put(loc);
    }
    await tx.done;

    qc.invalidateQueries({ queryKey: ['locations'] });
    get().addToast('Acción deshecha', 'info');
  },

  redo: async () => {
    const { pastLocations, futureLocations } = get();
    if (futureLocations.length === 0) return;

    const qc = getQueryClient();
    const currentLocations = (qc.getQueryData<LocationItem[]>(['locations']) || []);

    const nextState = futureLocations[0];
    const newFuture = futureLocations.slice(1);

    set({
      pastLocations: [...pastLocations, JSON.parse(JSON.stringify(currentLocations))],
      futureLocations: newFuture
    });

    const db = await initDB();
    const tx = db.transaction('locations', 'readwrite');
    await tx.store.clear();
    for (const loc of nextState) {
      await tx.store.put(loc);
    }
    await tx.done;

    qc.invalidateQueries({ queryKey: ['locations'] });
    get().addToast('Acción rehecha', 'info');
  },
}));

// ==========================================
// Exported helpers (used by hooks/utils)
// ==========================================
export { initDB };

export const computeDateForDay = (dayId: string, tripVariants: any[], globalVariantId: string): Date | null => {
  if (dayId === 'unassigned') return null;
  const variant = tripVariants.find((v: any) => v.id === globalVariantId) || tripVariants.find((v: any) => v.id === 'default');
  if (!variant?.startDate) return null;

  const dayIndexMatch = dayId.match(/^day-(\d+)$/);
  if (!dayIndexMatch) return null;

  const dayIndex = parseInt(dayIndexMatch[1], 10) - 1;
  if (isNaN(dayIndex) || dayIndex < 0) return null;

  const start = new Date(variant.startDate);
  const targetDate = new Date(start);
  targetDate.setDate(targetDate.getDate() + dayIndex);
  return targetDate;
};