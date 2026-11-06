import React from 'react';
import {
  HarvestStoreProvider,
  useHarvestStore,
} from './store/useHarvestStore';
import { Header } from './components/Header';
import { MarketplacePortal } from './components/MarketplacePortal';
import { SellerPortal } from './components/SellerPortal';
import { TechWorkbenchPortal } from './components/TechWorkbenchPortal';
import { OrdersTrackerPortal } from './components/OrdersTrackerPortal';
import { ImpactAnalyticsPortal } from './components/ImpactAnalyticsPortal';
import { SupportContactPortal } from './components/SupportContactPortal';
import { Leaf, ShieldCheck, Flame, Layers, HelpCircle, Truck } from 'lucide-react';

const MainShell: React.FC = () => {
  const { activeTab, setActiveTab } = useHarvestStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F] relative overflow-hidden">
      {/* Subtle Ambient Daylight Pastel Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[780px] h-[420px] bg-emerald-400/15 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] -left-40 w-[500px] h-[500px] bg-sky-300/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[420px] bg-amber-300/15 rounded-full blur-[150px]" />
      </div>

      <Header />

      <main className="relative flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {activeTab === 'MARKETPLACE' && <MarketplacePortal />}
        {activeTab === 'SELLER_PORTAL' && <SellerPortal />}
        {activeTab === 'TECH_WORKBENCH' && <TechWorkbenchPortal />}
        {activeTab === 'ORDERS_TRACKER' && <OrdersTrackerPortal />}
        {activeTab === 'ESG_ANALYTICS' && <ImpactAnalyticsPortal />}
        {activeTab === 'SUPPORT_CONTACT' && <SupportContactPortal />}
      </main>

      <footer className="relative border-t border-slate-200/80 bg-white/80 backdrop-blur-xl py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="text-[#1D1D1F] font-semibold tracking-tight">
              SiliconHarvest
            </span>
            <span>• Managed Semiconductor Recovery &amp; Supply</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Multimeter QC Guaranteed
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              District Hyperlocal &amp; India Post
            </span>
            <button
              onClick={() => setActiveTab('SUPPORT_CONTACT')}
              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-medium transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Support &amp; Helpdesk
            </button>
            <button
              onClick={() => setActiveTab('ESG_ANALYTICS')}
              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              ESG Telemetry
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <HarvestStoreProvider>
      <MainShell />
    </HarvestStoreProvider>
  );
}

export default App;
