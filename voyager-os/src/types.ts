export type Priority = 'optional' | 'necessary';
export type Category = 'sight' | 'food' | 'hotel' | 'shop' | 'flight' | 'transport' | 'free';
export type ReservationStatus = 'idea' | 'pending' | 'booked';

export interface ImageFile {
  data: string;
  name: string;
}

export interface PriceInfo {
  amount: number;
  currency: string;
}

export interface TripVariant {
  id: string; // e.g. "default", "plan-B"
  name: string; // e.g. "Plan Principal"
  startDate: string | null; // e.g. "2024-05-01"
  endDate: string | null; // e.g. "2024-05-07"
}

export interface TransportSegment {
  id: string; // e.g., 'loc1-to-loc2'
  fromLocationId: number;
  toLocationId: number;
  mode: 'walk' | 'car' | 'transit' | 'flight';
  durationOverride?: number; // In minutes, overrides OSRM if set
  durationCalculated?: number; // In minutes, from API
  distance?: number; // In meters, from API
  polyline?: [number, number][]; // Array of [lat, lng] for drawing the route
  customCost?: PriceInfo;
  notes?: string;
}

export interface LocationItem {
  id: number;
  title?: string; // Optional user-defined title
  link: string;
  coords: { lat: number; lng: number } | null;
  priority: Priority;
  cat: Category;
  cost: string; // Legacy string cost, keeping for backwards compatibility initially
  newPrice?: PriceInfo; // New precise numeric pricing

  // Date and Time
  day: string; // Legacy 'day-1', 'unassigned' etc
  variantId?: string; // e.g. 'default', 'option-A'
  datetime?: string; // ISO string for exact time or check-in
  isPinnedTime?: boolean; // If true, the system will not auto-recalculate this item's start time
  derivedDatetime?: string; // Calculated field for UI display (not saved to DB)
  checkOutDatetime?: string; // For hotels/flights
  durationMinutes?: number; // Explicit duration in minutes
  order?: number; // For manual drag and drop sorting within a day

  // Grouping
  groupId?: string; // For micro-boxing adjacent locations

  // Reservation
  reservationStatus?: ReservationStatus;
  bookingRef?: string;

  slot: string;
  notes: string;
  images: ImageFile[];
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}
