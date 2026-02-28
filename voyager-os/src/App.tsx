import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomBar } from './components/layout/MobileBottomBar';
import { PlannerTab } from './components/planner/PlannerTab';
import { ChecklistTab } from './components/checklist/ChecklistTab';
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
  const { activeTab, loadData } = useAppStore();
  const { isMobile } = useResponsive();
  const [mobileView, setMobileView] = useState<'plan' | 'map'>('plan');

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="h-screen flex overflow-hidden text-sm selection:bg-nature-mint selection:text-nature-primary bg-nature-bg">
      <Sidebar />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex-1 flex overflow-hidden ${isMobile ? 'pb-16' : ''}`}
      >
        {activeTab === 'planner' && <PlannerTab mobileView={mobileView} />}
        {activeTab === 'analytics' && <SmartSummaryTable />}
        {activeTab === 'checklist' && <ChecklistTab />}
      </motion.div>
      {isMobile && <MobileBottomBar mobileView={mobileView} setMobileView={setMobileView} />}
      <LightboxModal />
      <GlobalDialog />
      <ToastContainer />
    </div>
  );
}

