import { Map, MapPin, CheckSquare, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store';

const tabs = [
  { id: 'planner' as const, icon: MapPin, label: 'Plan' },
  { id: 'planner' as const, icon: Map, label: 'Mapa', mobileView: 'map' as const },
  { id: 'checklist' as const, icon: CheckSquare, label: 'Check' },
  { id: 'analytics' as const, icon: BarChart3, label: 'Resumen' },
];

export const MobileBottomBar = ({ mobileView, setMobileView }: { mobileView: 'plan' | 'map'; setMobileView: (v: 'plan' | 'map') => void }) => {
  const { activeTab, setActiveTab } = useAppStore();

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.mobileView) {
      setActiveTab('planner');
      setMobileView('map');
    } else {
      setActiveTab(tab.id);
      if (tab.id === 'planner') setMobileView('plan');
    }
  };

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.mobileView === 'map') return activeTab === 'planner' && mobileView === 'map';
    if (tab.id === 'planner') return activeTab === 'planner' && mobileView === 'plan';
    return activeTab === tab.id;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[500] bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab, i) => {
          const active = isActive(tab);
          return (
            <button
              key={i}
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${active
                  ? 'text-nature-primary'
                  : 'text-gray-400 active:text-gray-600'
                }`}
            >
              <div className={`relative transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                <tab.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {active && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-nature-primary" />
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? 'text-nature-primary' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
