import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChecklistItem, LocationItem, TransportSegment, TripVariant } from '../types';

interface VoyagerDB extends DBSchema {
  locations: { key: number; value: LocationItem };
  checklist: { key: number; value: ChecklistItem; indexes: { 'by-id': number } };
  transports: { key: string; value: TransportSegment };
  tripVariants: { key: string; value: TripVariant };
}

let dbPromise: Promise<IDBPDatabase<VoyagerDB>>;

export const initDB = () => {
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
