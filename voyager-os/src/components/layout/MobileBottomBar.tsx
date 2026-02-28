import { useState, useEffect } from 'react';
import { Map, MapPin, CheckSquare, BarChart3, Moon, Sun, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from '../../store';
import { hapticFeedback } from '../../utils/haptics';

const tabs = [
  { id: 'planner' as const, icon: MapPin, label: 'Plan' },
  { id: 'planner' as const, icon: Map, label: 'Mapa', mobileView: 'map' as const },
  { id: 'gallery' as const, icon: ImageIcon, label: 'Fotos' },
  { id: 'checklist' as const, icon: CheckSquare, label: 'Check' },
  { id: 'analytics' as const, icon: BarChart3, label: 'Datos' },
];

export const MobileBottomBar = ({ mobileView, setMobileView }: { mobileView: 'plan' | 'map'; setMobileView: (v: 'plan' | 'map') => void }) => {
  const { activeTab, setActiveTab } = useAppStore();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScrollEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'down') setIsVisible(false);
      else if (customEvent.detail === 'up') setIsVisible(true);
    };
    window.addEventListener('scrollDirection', handleScrollEvent);
    return () => window.removeEventListener('scrollDirection', handleScrollEvent);
  }, []);

  const handleTabClick = (tab: typeof tabs[number]) => {
    hapticFeedback.selection();
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
    <nav className={`fixed bottom-0 left-0 right-0 z-[500] bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
      <div className="flex justify-around items-center h-16 relative">
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
        <button
          onClick={useAppStore.getState().toggleTheme}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-nature-primary rounded-xl transition-all"
        >
          {useAppStore.getState().theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};
