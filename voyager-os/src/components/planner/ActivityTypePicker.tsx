import { useState } from 'react';
import { CATEGORY_CONFIG, type CategoryConfig } from '../../constants';
import type { Category, CategoryGroup } from '../../types';

interface ActivityTypePickerProps {
  value: Category;
  onChange: (cat: Category) => void;
}

const GROUP_META: Record<CategoryGroup, { label: string; icon: string; color: string; description: string }> = {
  activity: { label: 'Actividad', icon: '🎯', color: '#2D5A27', description: 'Visitas, comer, playa, paseos...' },
  transport: { label: 'Transporte', icon: '🚀', color: '#3B82F6', description: 'Vuelos, buses, trenes, taxis...' },
  accommodation: { label: 'Alojamiento', icon: '🏨', color: '#D97706', description: 'Check-in, check-out hotel' },
  free: { label: 'Tiempo Libre', icon: '☕', color: '#9CA3AF', description: 'Huecos sin actividad' },
};

const GROUPS_TO_SHOW: CategoryGroup[] = ['activity', 'transport', 'accommodation'];

export const ActivityTypePicker = ({ value, onChange }: ActivityTypePickerProps) => {
  const currentConfig = CATEGORY_CONFIG.find(c => c.value === value);
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | null>(currentConfig?.group ?? null);

  const groupItems = (group: CategoryGroup): CategoryConfig[] =>
    CATEGORY_CONFIG.filter(c => c.group === group);

  return (
    <div className="space-y-4">
      {/* Group selector */}
      <div>
        <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">Tipo de Elemento</label>
        <div className="grid grid-cols-3 gap-2">
          {GROUPS_TO_SHOW.map(group => {
            const meta = GROUP_META[group];
            const isSelected = selectedGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${isSelected
                  ? 'shadow-sm scale-[1.02]'
                  : 'border-nature-border hover:border-nature-primary bg-nature-surface'
                  }`}
                style={isSelected ? { borderColor: meta.color, backgroundColor: `${meta.color}20`, color: 'var(--color-nature-text)' } : {}}
              >
                <span className="text-2xl">{meta.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtype selector */}
      {selectedGroup && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="text-[10px] tracking-widest font-bold text-gray-400 uppercase mb-2 block">
            {GROUP_META[selectedGroup].description}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {groupItems(selectedGroup).map(config => {
              const isActive = value === config.value;
              return (
                <button
                  key={config.value}
                  type="button"
                  onClick={() => onChange(config.value)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${isActive
                    ? 'shadow-sm scale-[1.03]'
                    : 'border-nature-border hover:border-nature-primary bg-nature-surface text-gray-500 hover:text-nature-text'
                    }`}
                  style={isActive ? { borderColor: config.color, backgroundColor: config.color, color: '#FFFFFF' } : {}}
                >
                  <span className="text-xl">{config.icon}</span>
                  <span className="text-[8px] font-bold uppercase tracking-wider leading-tight text-center">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
