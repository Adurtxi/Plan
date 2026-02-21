import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Sidebar } from './components/layout/Sidebar';
import { PlannerTab } from './components/planner/PlannerTab';
import { ChecklistTab } from './components/checklist/ChecklistTab';
import { SmartSummaryTable } from './components/planner/SmartSummaryTable';
import { LightboxModal } from './components/modals/LightboxModal';
import { setupLeaflet } from './lib/leafletSetup';
import 'leaflet/dist/leaflet.css';

// Initialize Leaflet configuration (done globally once)
setupLeaflet();

export default function App() {
  const { activeTab, loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="h-screen flex overflow-hidden text-sm selection:bg-nature-mint selection:text-nature-primary bg-nature-bg">
      <Sidebar />
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex overflow-hidden"
      >
        {activeTab === 'planner' && <PlannerTab />}
        {activeTab === 'analytics' && <SmartSummaryTable />}
        {activeTab === 'checklist' && <ChecklistTab />}
      </motion.div>
      <LightboxModal />
    </div>
  );
}
