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
import { AuthView } from './components/AuthView';
import { MembershipPortal } from './components/MembershipPortal';
import { OwnerAdminPortal } from './components/OwnerAdminPortal';
import { FounderVaultModal } from './components/FounderVaultModal';
import { Leaf, ShieldCheck, Layers, HelpCircle, Truck } from 'lucide-react';

const MainShell: React.FC = () => {
  const { activeTab, setActiveTab } = useHarvestStore();

  // Strict Layout Isolation for Login Screen:
  // Do NOT render <Header /> or <Footer /> in the background DOM when on LOGIN
  if (activeTab === 'LOGIN') {
    return (
      <>
        <AuthView onSuccess={() => setActiveTab('MARKETPLACE')} />
        <FounderVaultModal />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F] relative overflow-x-hidden w-full max-w-[100vw] m-0 p-0">
      {/* Subtle Ambient Daylight Pastel Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[780px] h-[420px] bg-emerald-400/15 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] -left-40 w-[500px] h-[500px] bg-sky-300/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[420px] bg-amber-300/15 rounded-full blur-[150px]" />
      </div>

      <Header />

      <main className="relative flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-24 md:pb-16 overflow-x-hidden">
        {activeTab === 'MARKETPLACE' && <MarketplacePortal />}
        {activeTab === 'SELLER_PORTAL' && <SellerPortal />}
        {activeTab === 'TECH_WORKBENCH' && <TechWorkbenchPortal />}
        {activeTab === 'ORDERS_TRACKER' && <OrdersTrackerPortal />}
        {activeTab === 'MEMBERSHIP' && <MembershipPortal />}
        {activeTab === 'OWNER_ADMIN' && <OwnerAdminPortal />}
        {activeTab === 'ESG_ANALYTICS' && <ImpactAnalyticsPortal />}
        {activeTab === 'SUPPORT_CONTACT' && <SupportContactPortal />}
      </main>

      {/* Corner Founder Vault Shield Icon (Boomesh@21 / rkboomesh@2006) */}
      <FounderVaultModal />

      <footer className="relative border-t border-slate-200/80 bg-white/80 backdrop-blur-xl py-6 sm:py-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[#1D1D1F] font-semibold tracking-tight">
              SiliconHarvest
            </span>
            <span className="text-[11px] sm:text-xs">
              • Founder: Boomesh R K (rkboomesh@gmail.com • +91 7200255069)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Multimeter QC Guaranteed
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              District Hyperlocal &amp; India Post
            </span>
            <button
              onClick={() => setActiveTab('SUPPORT_CONTACT')}
              className="min-h-[38px] flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-medium transition-colors active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Support &amp; Helpdesk
            </button>
            <button
              onClick={() => setActiveTab('ESG_ANALYTICS')}
              className="min-h-[38px] flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-medium transition-colors active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
