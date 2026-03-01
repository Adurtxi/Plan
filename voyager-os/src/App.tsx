import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomBar } from './components/layout/MobileBottomBar';
import { PlannerTab } from './components/planner/PlannerTab';
import { ChecklistTab } from './components/checklist/ChecklistTab';
import { GalleryTab } from './components/gallery/GalleryTab';
import { SmartSummaryTable } from './components/planner/SmartSummaryTable';
import { LightboxModal } from './components/modals/LightboxModal';
import { GlobalDialog } from './components/modals/GlobalDialog';
import { ToastContainer } from './components/ui/ToastContainer';
import { useResponsive } from './hooks/useResponsive';
import { setupLeaflet } from './lib/leafletSetup';
import 'leaflet/dist/leaflet.css';

// Initialize Leaflet configuration (done globally once)
setupLeaflet();

export default function App() {
  const { activeTab, loadData, mobileView, setMobileView } = useAppStore();
  const { isMobile } = useResponsive();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const theme = useAppStore.getState().theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="h-screen flex overflow-hidden text-sm selection:bg-nature-mint selection:text-nature-primary bg-nature-bg">
      <Sidebar />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 flex overflow-hidden ${isMobile ? 'pb-16' : ''}`}
      >
        {activeTab === 'planner' && <PlannerTab />}
        {activeTab === 'analytics' && <SmartSummaryTable />}
        {activeTab === 'checklist' && <ChecklistTab />}
        {activeTab === 'gallery' && <GalleryTab />}
      </motion.div>
      {isMobile && <MobileBottomBar mobileView={mobileView} setMobileView={setMobileView} />}
      <LightboxModal />
      <GlobalDialog />
      <ToastContainer />
    </div>
  );
}

