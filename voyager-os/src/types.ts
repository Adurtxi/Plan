export type Priority = 'optional' | 'necessary';

// ── Activity (ocio/turismo) ──
export type ActivityCategory = 'sight' | 'food' | 'walk' | 'beach' | 'pool' | 'photos' | 'shop' | 'nightlife';
// ── Transport ──
export type TransportCategory = 'flight-departure' | 'flight-arrival' | 'bus-departure' | 'bus-arrival'
  | 'train-departure' | 'train-arrival' | 'taxi' | 'car-rental' | 'ferry' | 'transfer' | 'airport-wait';
// ── Accommodation ──
export type AccommodationCategory = 'hotel-checkin' | 'hotel-checkout';
// ── Special ──
export type SpecialCategory = 'free';

export type Category = ActivityCategory | TransportCategory | AccommodationCategory | SpecialCategory;
export type CategoryGroup = 'activity' | 'transport' | 'accommodation' | 'free';

// Legacy types kept for migration compatibility
export type LogisticsType = 'hotel-checkin' | 'hotel-checkout' | 'flight-departure' | 'flight-arrival'
  | 'bus-departure' | 'bus-arrival' | 'airport-wait' | 'transfer';

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
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export interface TransportSegment {
  id: string;
  fromLocationId: number;
  toLocationId: number;
  mode: 'walk' | 'car' | 'transit' | 'flight' | 'bike' | 'manual';
  durationOverride?: number;
  durationCalculated?: number;
  distance?: number;
  polyline?: [number, number][];
  customCost?: PriceInfo;
  notes?: string;
}

export interface LocationItem {
  id: number;
  title?: string;
  link: string;
  coords: { lat: number; lng: number } | null;
  priority: Priority;
  cat: Category;
  cost: string;
  newPrice?: PriceInfo;

  // Date and Time
  day: string;
  globalVariantId?: string;
  variantId?: string;
  datetime?: string;
  isPinnedTime?: boolean;
  derivedDatetime?: string;
  checkOutDatetime?: string;
  durationMinutes?: number;
  order?: number;

  // Grouping
  groupId?: string;

  // Reservation
  reservationStatus?: ReservationStatus;
  bookingRef?: string;

  // Legacy logistics fields (kept for migration)
  logisticsConfirmation?: string;
  logisticsDetail?: string;
  logisticsType?: LogisticsType;

  // Transport-specific
  company?: string;
  flightNumber?: string;
  terminal?: string;
  gate?: string;
  platform?: string;
  seat?: string;
  station?: string;
  pickupPoint?: string;
  dropoffPoint?: string;
  transportApp?: string;

  // Accommodation-specific
  hotelName?: string;
  roomNumber?: string;
  address?: string;
  lateCheckout?: boolean;

  // Food-specific
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'tapas';
  numPeople?: number;

  // Photography-specific
  bestTimeHint?: string;

  slot: string;
  notes: string;
  images: ImageFile[];
  attachments: ImageFile[];
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
}
