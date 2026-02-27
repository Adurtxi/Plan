export const CAT_ICONS: Record<string, string> = { sight: "📷", food: "🍽️", hotel: "🛏️", shop: "🛍️", flight: "✈️", transport: "🚕", free: "☕", logistics: "📋" };
export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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
