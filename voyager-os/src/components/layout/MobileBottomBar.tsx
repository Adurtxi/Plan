import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Map, MapPin, CheckSquare, Moon, Sun, Image as ImageIcon, Ticket } from 'lucide-react';
import { useAppStore } from '../../store';
import { hapticFeedback } from '../../utils/haptics';

const tabs = [
  { id: 'planner' as const, icon: MapPin, label: 'Plan', path: '/' },
  { id: 'planner' as const, icon: Map, label: 'Mapa', mobileView: 'map' as const, path: '/' },
  { id: 'gallery' as const, icon: ImageIcon, label: 'Fotos', path: '/gallery' },
  { id: 'logistics' as const, icon: Ticket, label: 'Cartera', path: '/logistics' },
  { id: 'checklist' as const, icon: CheckSquare, label: 'Check', path: '/checklist' },
];

export const MobileBottomBar = ({ mobileView, setMobileView }: { mobileView: 'plan' | 'map'; setMobileView: (v: 'plan' | 'map') => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
    navigate(tab.path);
    if (tab.mobileView === 'map') {
      setMobileView('map');
    } else if (tab.id === 'planner') {
      setMobileView('plan');
    }
  };

  const isActive = (tab: typeof tabs[number]) => {
    if (location.pathname !== tab.path) return false;
    if (tab.path === '/') {
      if (tab.mobileView === 'map') return mobileView === 'map';
      return mobileView === 'plan';
    }
    return true;
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[500] bg-bg-surface/95 backdrop-blur-lg border-t border-border-strong shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-[150%]'}`}>
      <div className="flex justify-around items-center h-16 relative">
        {tabs.map((tab, i) => {
          const active = isActive(tab);
          return (
            <button
              key={i}
              onClick={() => handleTabClick(tab)}
              className={`cursor-pointer flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 active:scale-90 min-w-[64px] ${active
                ? 'text-nature-primary'
                : 'text-text-muted active:text-text-primary'
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
          className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-nature-primary rounded-xl transition-all active:scale-90"
        >
          {useAppStore.getState().theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};
