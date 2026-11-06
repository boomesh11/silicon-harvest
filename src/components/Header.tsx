import React, { useState } from 'react';
import {
  Leaf,
  Cpu,
  PlusCircle,
  Flame,
  Truck,
  RotateCcw,
  Wallet,
  User,
  Headphones,
  MapPin,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { ActiveTab } from '../types/harvest';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';

export const Header: React.FC = () => {
  const {
    components,
    orders,
    techWalletBalanceInr,
    activeTab,
    setActiveTab,
    currentUser,
    isSignedIn,
    updateUserProfile,
    signOut,
    resetDemoState,
  } = useHarvestStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    {
      id: 'SUPPORT_CONTACT',
      label: 'Support & Contact',
      shortLabel: 'Support',
      icon: <Headphones className="w-3.5 h-3.5" />,
    },
  ];

  const isLoggedIn = isSignedIn;

  return (
    <>
      <header className="fixed top-3 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-40 backdrop-blur-2xl bg-white/90 border border-slate-200/90 rounded-full px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
        {/* Minimalist Apple Brand Logo with Emerald Circuit Leaf */}
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

        {/* Right Controls: Consumer User Button + Tech Wallet (if tech) + Reset */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Tech Wallet Pill if active or balance exists */}
          {techWalletBalanceInr > 0 && (
            <div
              onClick={() => setActiveTab('TECH_WORKBENCH')}
              title="Technician Escrow Earnings"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-xs text-emerald-700 font-semibold cursor-pointer hover:border-emerald-400 transition-all"
            >
              <Wallet className="w-3 h-3 text-amber-600" />
              <span>₹{techWalletBalanceInr}</span>
            </div>
          )}

          {/* Consumer User Profile Dropdown or Dedicated Login Route Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  setShowProfileMenu((prev) => !prev);
                } else {
                  setActiveTab('LOGIN');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isLoggedIn
                  ? 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1D1D1F]'
                  : activeTab === 'LOGIN'
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              <User
                className={`w-3.5 h-3.5 ${
                  isLoggedIn ? 'text-emerald-600' : 'text-white'
                }`}
              />
              {isLoggedIn ? (
                <div className="flex items-center gap-1 max-w-[145px] truncate text-left">
                  <span className="truncate font-semibold">
                    {currentUser.fullName ||
                      currentUser.email.split('@')[0]}
                  </span>
                  {currentUser.district && (
                    <span className="hidden xl:inline text-[10px] text-slate-500 font-normal flex items-center">
                      <MapPin className="w-2.5 h-2.5 inline mr-0.5 text-emerald-600" />
                      {currentUser.district}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              ) : (
                <span>Sign In / Join</span>
              )}
            </button>

            {/* Sleek User Profile Dropdown Menu */}
            {isLoggedIn && showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2.5 w-72 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.14)] p-4 z-50 space-y-3.5">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#1D1D1F] truncate">
                        {currentUser.fullName || 'Verified Member'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {currentUser.email}
                      </div>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-medium">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {currentUser.role === 'SELLER_LAB'
                          ? 'Seller / Donor'
                          : currentUser.role === 'TECH_PARTNER'
                          ? 'Rework Tech'
                          : 'Buyer / Student'}
                      </span>
                    </div>
                  </div>

                  {/* Quick District Switcher inside Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      Active Logistics District
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={currentUser.state || 'Tamil Nadu'}
                        onChange={(e) => {
                          const newState = e.target.value;
                          const firstDist =
                            INDIAN_STATES_DISTRICTS.find(
                              (s) => s.state === newState
                            )?.districts[0] || 'Chennai';
                          updateUserProfile({
                            state: newState,
                            district: firstDist,
                          });
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#1D1D1F]"
                      >
                        {INDIAN_STATES_DISTRICTS.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                      <select
                        value={currentUser.district || 'Chennai'}
                        onChange={(e) =>
                          updateUserProfile({ district: e.target.value })
                        }
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-[#1D1D1F]"
                      >
                        {(
                          INDIAN_STATES_DISTRICTS.find(
                            (s) =>
                              s.state === (currentUser.state || 'Tamil Nadu')
                          )?.districts || ['Chennai']
                        ).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        signOut();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Clean State Reset Button */}
          <button
            onClick={resetDemoState}
            title="Clear local state cache"
            className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-[#1D1D1F] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
    </>
  );
};
