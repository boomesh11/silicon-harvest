import React, { useState } from 'react';
import {
  Leaf,
  Cpu,
  PlusCircle,
  Flame,
  Truck,
  RotateCcw,
  Radio,
  Wallet,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { ActiveTab, UserRole } from '../types/harvest';
import { DatabaseConfigModal } from './DatabaseConfigModal';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const {
    components,
    orders,
    techWalletBalanceInr,
    activeTab,
    setActiveTab,
    currentUser,
    switchDemoRole,
    connectionMode,
    resetDemoState,
  } = useHarvestStore();

  const [showDbModal, setShowDbModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const intactComponentsCount = components.filter(
    (c) => c.status === 'INTACT'
  ).length;
  const pendingExtractionsCount = orders.filter(
    (o) => o.status === 'PENDING_EXTRACTION'
  ).length;

  const navTabs: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
    isAlert?: boolean;
  }[] = [
    {
      id: 'MARKETPLACE',
      label: 'Marketplace',
      shortLabel: 'Store',
      icon: <Cpu className="w-3.5 h-3.5" />,
      badge: intactComponentsCount,
    },
    {
      id: 'SELLER_PORTAL',
      label: 'Sell Hardware',
      shortLabel: 'Sell',
      icon: <PlusCircle className="w-3.5 h-3.5" />,
    },
    {
      id: 'TECH_WORKBENCH',
      label: 'Workbench',
      shortLabel: 'Bench',
      icon: <Flame className="w-3.5 h-3.5" />,
      badge: pendingExtractionsCount,
      isAlert: pendingExtractionsCount > 0,
    },
    {
      id: 'ORDERS_TRACKER',
      label: 'Orders',
      shortLabel: 'Orders',
      icon: <Truck className="w-3.5 h-3.5" />,
      badge: orders.length,
    },
  ];

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-6xl z-40 backdrop-blur-2xl bg-white/85 border border-slate-200/80 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-all">
        {/* Minimalist Brand Logo with Emerald Circuit Leaf Icon */}
        <div
          onClick={() => setActiveTab('MARKETPLACE')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:border-emerald-500 transition-all">
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm sm:text-base font-semibold tracking-tight text-[#1D1D1F]">
            SiliconHarvest
          </span>
        </div>

        {/* Sleek Segmented Pill Tab Switchers */}
        <nav className="bg-slate-100/90 p-1 rounded-full border border-slate-200/80 flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1D1D1F] text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-500'}>
                  {tab.icon}
                </span>
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white font-semibold'
                        : tab.isAlert
                        ? 'bg-amber-100 text-amber-700 font-semibold'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Role Switcher Dropdown + Connection Badge + Wallet/Profile + Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sleek Role Switcher Dropdown */}
          <div className="relative hidden lg:flex items-center">
            <select
              aria-label="Switch Active Role"
              value={currentUser.role}
              onChange={(e) => switchDemoRole(e.target.value as UserRole)}
              className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-[#1D1D1F] text-xs font-medium pl-3 pr-7 py-1.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer transition-all"
            >
              <option value="BUYER_STUDENT" className="bg-white text-[#1D1D1F]">
                Role: Buyer (Student)
              </option>
              <option value="SELLER_LAB" className="bg-white text-[#1D1D1F]">
                Role: Seller (Lab/Shop)
              </option>
              <option value="TECH_PARTNER" className="bg-white text-[#1D1D1F]">
                Role: Technician (₹{techWalletBalanceInr})
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Connection Status Badge */}
          <button
            onClick={() => setShowDbModal(true)}
            title="Configure Supabase Connection & Atomic RPC"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs transition-all"
          >
            <Radio
              className={`w-3 h-3 ${
                connectionMode === 'SUPABASE_CLOUD'
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-700 hidden sm:inline">
              {connectionMode === 'SUPABASE_CLOUD' ? 'Cloud Live' : 'Supabase'}
            </span>
          </button>

          {/* Tech Wallet Pill (compact) */}
          <div
            onClick={() => setActiveTab('TECH_WORKBENCH')}
            title="Technician Escrow Wallet Balance"
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-xs text-emerald-700 font-semibold cursor-pointer hover:border-emerald-400 transition-all"
          >
            <Wallet className="w-3 h-3 text-amber-600" />
            <span>₹{techWalletBalanceInr}</span>
          </div>

          {/* Auth / Profile Setup Modal Trigger */}
          <button
            onClick={() => setShowAuthModal(true)}
            title="User Profile & Authentication"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 hover:text-[#1D1D1F] text-xs font-medium transition-all"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline max-w-[110px] truncate">
              {currentUser.fullName || 'Set Profile'}
            </span>
          </button>

          {/* Clear Local Cache Button */}
          <button
            onClick={resetDemoState}
            title="Clear local state cache"
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-600 hover:text-[#1D1D1F] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {showDbModal && (
        <DatabaseConfigModal onClose={() => setShowDbModal(false)} />
      )}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
