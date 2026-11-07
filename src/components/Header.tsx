import React, { useState } from 'react';
import {
  Leaf,
  Cpu,
  PlusCircle,
  Truck,
  RotateCcw,
  Wallet,
  User,
  Headphones,
  MapPin,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Menu,
  X,
  Layers,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { ActiveTab } from '../types/harvest';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';

export const Header: React.FC = () => {
  const {
    components,
    orders,
    bargainOffers,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const intactComponentsCount = components.filter(
    (c) => c.status === 'INTACT'
  ).length;
  const pendingBargainsCount = bargainOffers.filter(
    (b) => b.status === 'PENDING'
  ).length;

  const isLoggedIn = isSignedIn;

  const navTabs: {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: number;
    isAlert?: boolean;
    isFeatured?: boolean;
  }[] = [
    {
      id: 'MARKETPLACE',
      label: 'Marketplace',
      shortLabel: 'Store',
      icon: <Cpu className="w-4 h-4 shrink-0" />,
      badge: intactComponentsCount,
    },
    {
      id: 'SELLER_PORTAL',
      label: 'Sell a Product',
      shortLabel: 'Sell',
      icon: <PlusCircle className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'ORDERS_TRACKER',
      label: 'My Orders & Bargains',
      shortLabel: 'Orders',
      icon: <Truck className="w-4 h-4 shrink-0" />,
      badge: isLoggedIn ? orders.length + pendingBargainsCount : undefined,
      isAlert: isLoggedIn && pendingBargainsCount > 0,
    },
    {
      id: 'MEMBERSHIP',
      label: 'Pro Membership ⭐',
      shortLabel: 'Pro ⭐',
      icon: <Crown className="w-4 h-4 text-amber-500 shrink-0" />,
      isFeatured: true,
    },
    {
      id: 'SUPPORT_CONTACT',
      label: 'Support',
      shortLabel: 'Support',
      icon: <Headphones className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleTabSelection = (tabId: ActiveTab) => {
    setActiveTab(tabId);
  };

  const handleMobileNavClick = (tabId: ActiveTab) => {
    handleTabSelection(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP NAVBAR (>768px: Full-Width Sticky Header, Zero Clip) */}
      {/* ============================================================== */}
      <header className="hidden md:block sticky top-0 left-0 right-0 w-full z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 lg:gap-4 whitespace-nowrap">
          {/* Minimalist Brand Logo with Emerald Circuit Leaf */}
          <div
            onClick={() => setActiveTab('MARKETPLACE')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center group-hover:border-emerald-500 transition-all">
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F]">
              SiliconHarvest
            </span>
          </div>

          {/* Sleek Segmented Pill Tab Switchers — Zero Horizontal Clipping */}
          <nav className="bg-slate-100/90 p-1 rounded-full border border-slate-200/80 flex items-center gap-1 lg:gap-1.5 whitespace-nowrap">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelection(tab.id)}
                  className={`min-h-[38px] flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1D1D1F] text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-[#1D1D1F] hover:bg-white/60'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
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

          {/* Right Controls: Consumer User Button + Tech Wallet + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tech Wallet Pill if active or balance exists */}
            {techWalletBalanceInr > 0 && (
              <div
                onClick={() => setActiveTab('TECH_WORKBENCH')}
                title="Technician Escrow Earnings"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono text-xs text-emerald-700 font-semibold cursor-pointer hover:border-emerald-400 active:scale-95 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                <span>₹{techWalletBalanceInr}</span>
              </div>
            )}

            {/* User Profile Dropdown or Dedicated Login Route Trigger */}
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
                className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-all ${
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
                      {currentUser.fullName || currentUser.email.split('@')[0]}
                    </span>
                    {currentUser.district && (
                      <span className="hidden xl:inline text-[10px] text-slate-500 font-normal">
                        • {currentUser.district}
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                ) : (
                  <span>Sign In / Join</span>
                )}
              </button>

              {/* Desktop User Profile Dropdown Menu */}
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
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {currentUser.isProMember ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
                              <Crown className="w-3 h-3 text-amber-500" />
                              Pro Member ⭐
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setShowProfileMenu(false);
                                setActiveTab('MEMBERSHIP');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[10px] font-bold"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              Upgrade to Pro (₹99)
                            </button>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-medium">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {currentUser.role === 'OWNER_ADMIN'
                              ? 'Founder Vault'
                              : currentUser.role === 'SELLER_LAB'
                              ? 'Seller / Lab'
                              : 'Buyer / Student'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* District Switcher */}
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
                        className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reset Demo State Button */}
            <button
              onClick={resetDemoState}
              title="Clear local state cache"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-[#1D1D1F] flex items-center justify-center active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. MOBILE TOP NAVBAR (<768px: Compact Brand + Hamburger Icon) */}
      {/* ============================================================== */}
      <header className="flex md:hidden sticky top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 px-4 py-2.5 items-center justify-between shadow-sm">
        <div
          onClick={() => setActiveTab('MARKETPLACE')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#1D1D1F]">
            SiliconHarvest
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active District Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span className="max-w-[80px] truncate">{currentUser.district || 'Chennai'}</span>
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] border border-slate-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. MOBILE SLIDE-UP DRAWER (Full Navigation & Account Sheet)   */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-in fade-in duration-200">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-Up Drawer Container */}
          <div className="relative z-10 w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[88vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-300">
            {/* Subtle Drag Handle Pill */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-2" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#1D1D1F]">SiliconHarvest</h3>
                  <p className="text-[11px] text-slate-500">Hardware Salvage Network</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Account / Sign In Status Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1D1D1F] truncate">
                      {isLoggedIn
                        ? currentUser.fullName || currentUser.email.split('@')[0]
                        : 'Guest User'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {isLoggedIn ? currentUser.email : 'Not signed in'}
                    </div>
                  </div>
                </div>

                {isLoggedIn ? (
                  <div className="flex flex-col items-end gap-1">
                    {currentUser.isProMember ? (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5 text-amber-500" /> PRO ⭐
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMobileNavClick('MEMBERSHIP')}
                        className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200"
                      >
                        Upgrade to Pro
                      </button>
                    )}
                    <span className="font-mono text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {currentUser.role === 'OWNER_ADMIN' ? 'OWNER' : currentUser.role}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleMobileNavClick('LOGIN')}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs active:scale-95 transition-transform shadow-sm"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* District Selector inside Mobile Drawer */}
              <div className="pt-2 border-t border-slate-200/80 space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Hyperlocal District
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                    className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#1D1D1F]"
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
                    className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F]"
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
            </div>

            {/* Navigation Links (Minimum 44px Height & Active Scale Feedback) */}
            <div className="space-y-1.5">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMobileNavClick(tab.id)}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-semibold active:scale-95 transition-all ${
                      isActive
                        ? 'bg-[#1D1D1F] text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </div>

                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white font-semibold'
                            : tab.isAlert
                            ? 'bg-amber-100 text-amber-800 font-semibold'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* ESG Telemetry Nav Option */}
              <button
                onClick={() => handleMobileNavClick('ESG_ANALYTICS')}
                className={`w-full min-h-[48px] px-4 py-3 rounded-2xl flex items-center justify-between text-sm font-semibold active:scale-95 transition-all ${
                  activeTab === 'ESG_ANALYTICS'
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Layers
                    className={`w-4 h-4 ${
                      activeTab === 'ESG_ANALYTICS' ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>ESG Impact Telemetry</span>
                </div>
              </button>
            </div>

            {/* Technician Escrow Wallet (if applicable) */}
            {techWalletBalanceInr > 0 && (
              <div
                onClick={() => handleMobileNavClick('TECH_WORKBENCH')}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-semibold text-emerald-800 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Technician Escrow Wallet</span>
                </div>
                <span className="font-mono font-bold text-sm">₹{techWalletBalanceInr}</span>
              </div>
            )}

            {/* Bottom Actions: Sign Out (if logged in) & Demo Reset */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex-1 min-h-[44px] py-2 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  resetDemoState();
                }}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
