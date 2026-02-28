import type { Category, CategoryGroup } from './types';

export type CategoryConfig = {
  value: Category;
  group: CategoryGroup;
  icon: string;
  label: string;
  color: string;
  needsCoords: boolean;
};

export const CATEGORY_CONFIG: CategoryConfig[] = [
  // ── Actividades ──
  { value: 'sight', group: 'activity', icon: '📷', label: 'Visita', color: '#2D5A27', needsCoords: true },
  { value: 'food', group: 'activity', icon: '🍽️', label: 'Comer', color: '#C4A484', needsCoords: true },
  { value: 'walk', group: 'activity', icon: '🚶', label: 'Paseo', color: '#6B8E23', needsCoords: true },
  { value: 'beach', group: 'activity', icon: '🏖️', label: 'Playa', color: '#E8A838', needsCoords: true },
  { value: 'pool', group: 'activity', icon: '🏊', label: 'Piscina', color: '#4A90D9', needsCoords: true },
  { value: 'photos', group: 'activity', icon: '📸', label: 'Fotos', color: '#9B59B6', needsCoords: true },
  { value: 'shop', group: 'activity', icon: '🛍️', label: 'Compras', color: '#E74C3C', needsCoords: true },
  { value: 'nightlife', group: 'activity', icon: '🌙', label: 'Nocturno', color: '#2C3E50', needsCoords: true },
  // ── Transporte ──
  { value: 'flight-departure', group: 'transport', icon: '🛫', label: 'Despegue', color: '#3B82F6', needsCoords: false },
  { value: 'flight-arrival', group: 'transport', icon: '🛬', label: 'Aterrizaje', color: '#3B82F6', needsCoords: false },
  { value: 'bus-departure', group: 'transport', icon: '🚌', label: 'Coger Bus', color: '#10B981', needsCoords: false },
  { value: 'bus-arrival', group: 'transport', icon: '🚌', label: 'Dejar Bus', color: '#10B981', needsCoords: false },
  { value: 'train-departure', group: 'transport', icon: '🚆', label: 'Coger Tren', color: '#6366F1', needsCoords: false },
  { value: 'train-arrival', group: 'transport', icon: '🚆', label: 'Dejar Tren', color: '#6366F1', needsCoords: false },
  { value: 'taxi', group: 'transport', icon: '🚕', label: 'Taxi', color: '#F59E0B', needsCoords: false },
  { value: 'car-rental', group: 'transport', icon: '🚗', label: 'Alquiler Coche', color: '#EF4444', needsCoords: false },
  { value: 'ferry', group: 'transport', icon: '⛴️', label: 'Ferry', color: '#0EA5E9', needsCoords: false },
  { value: 'transfer', group: 'transport', icon: '🔄', label: 'Transfer', color: '#8B5CF6', needsCoords: false },
  { value: 'airport-wait', group: 'transport', icon: '⏳', label: 'Espera Aeropuerto', color: '#94A3B8', needsCoords: false },
  // ── Alojamiento ──
  { value: 'hotel-checkin', group: 'accommodation', icon: '🏨', label: 'Check-in Hotel', color: '#D97706', needsCoords: true },
  { value: 'hotel-checkout', group: 'accommodation', icon: '🏨', label: 'Check-out Hotel', color: '#D97706', needsCoords: false },
  // ── Especial ──
  { value: 'free', group: 'free', icon: '☕', label: 'Tiempo Libre', color: '#9CA3AF', needsCoords: false },
];

// ── Helpers derivados ──
export const CAT_ICONS: Record<string, string> = Object.fromEntries(CATEGORY_CONFIG.map(c => [c.value, c.icon]));
export const CAT_LABELS: Record<string, string> = Object.fromEntries(CATEGORY_CONFIG.map(c => [c.value, c.label]));
export const CAT_COLORS: Record<string, string> = Object.fromEntries(CATEGORY_CONFIG.map(c => [c.value, c.color]));

export const getCatConfig = (cat: string): CategoryConfig | undefined => CATEGORY_CONFIG.find(c => c.value === cat);
export const getCatGroup = (cat: string): CategoryGroup => getCatConfig(cat)?.group ?? 'activity';
export const isTransportCat = (cat: string): boolean => getCatGroup(cat) === 'transport';
export const isAccommodationCat = (cat: string): boolean => getCatGroup(cat) === 'accommodation';
export const isActivityCat = (cat: string): boolean => getCatGroup(cat) === 'activity';

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Legacy — kept for backwards compatibility during migration
export const LOGISTICS_TYPES = [
  { value: 'hotel-checkin', icon: '🏨↓', label: 'Check-in Hotel' },
  { value: 'hotel-checkout', icon: '🏨↑', label: 'Check-out Hotel' },
  { value: 'flight-departure', icon: '🛫', label: 'Despegue' },
  { value: 'flight-arrival', icon: '🛬', label: 'Aterrizaje' },
  { value: 'bus-departure', icon: '🚌▶', label: 'Inicio Bus' },
  { value: 'bus-arrival', icon: '🚌⏹', label: 'Fin Bus' },
  { value: 'airport-wait', icon: '⏳✈️', label: 'Espera Aeropuerto' },
  { value: 'transfer', icon: '🔄', label: 'Transfer' },
] as const;
export const LOGISTICS_ICONS: Record<string, string> = Object.fromEntries(LOGISTICS_TYPES.map(t => [t.value, t.icon]));
export const LOGISTICS_LABELS: Record<string, string> = Object.fromEntries(LOGISTICS_TYPES.map(t => [t.value, t.label]));
