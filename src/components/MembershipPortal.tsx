import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Crown,
  PhoneCall,
  MessageCircle,
  TrendingDown,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';

export const MembershipPortal: React.FC = () => {
  const { currentUser, upgradeToProMembership, toggleUserProStatus, setActiveTab } = useHarvestStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [upgradeSuccess, setUpgradeSuccess] = useState<string | null>(null);

  const isPro = currentUser.isProMember;

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    upgradeToProMembership(plan);
    setUpgradeSuccess(`🎉 Welcome to Pro Membership! All seller contacts, WhatsApp direct links, and the ₹0 fee bargain engine are now active.`);
    setTimeout(() => setUpgradeSuccess(null), 5000);
  };

  return (
    <div className="w-full text-slate-900 pb-20 sm:pb-28">
      {/* Hero Impact Banner - SiliconHarvest Style */}
      <section className="relative overflow-hidden bg-[#0F172A] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 text-white">
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Crown className="h-4 w-4 text-amber-400" />
            👑 SILICONHARVEST PRO NETWORK
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
            Unlock Direct WhatsApp Chat, Seller Phone Numbers & ₹0 Platform Fees.
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-300">
            Connect directly with verified electronics recyclers, scrap salvage yards, and hardware labs across India.
            Cut intermediaries, make instant counter-offers, and trade at rock-bottom salvaging rates.
          </p>

          {isPro ? (
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-emerald-200">
              <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-sm sm:text-base">
                  You are an Active SiliconHarvest Pro Member ⭐
                </p>
                <p className="text-xs text-emerald-300">
                  Valid until: {currentUser.proMembershipExpiry ? new Date(currentUser.proMembershipExpiry).toLocaleDateString() : 'Active Lifetime'} • ₹0 platform fees applied automatically
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleUserProStatus()}
                className="ml-auto min-h-[44px] rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
              >
                Toggle Pro Status (Test Persona)
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-emerald-400" /> Verified Circular-Economy Network
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Zap className="h-5 w-5 text-amber-400" /> Instant Activation — Zero Waiting
              </div>
            </div>
          )}

          {upgradeSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-500/20 p-4 text-sm font-medium text-emerald-200 animate-fadeIn">
              {upgradeSuccess}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {/* Core Privileges Grid */}
        <section>
          <div className="text-center sm:text-left mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Why High-Volume Buyers & Labs Upgrade to Pro
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Engineered specifically for electronics repair centers, hardware makers, and e-waste salvagers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">Direct WhatsApp Chat</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Skip marketplace messaging. Launch direct WhatsApp conversations with verified sellers with 1-tap pre-filled component queries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">Bargain & Counter-Offer</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Submit custom offers below listed price. When a seller accepts, your discounted price is automatically applied at checkout.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">₹0 Platform Fee Forever</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Standard users pay 5% platform convenience fees (up to ₹15). Pro members enjoy 100% free checkout on every order forever.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">Full Phone & Location</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                View unmasked 10-digit mobile numbers, exact workshop addresses, and shop landmarks for direct physical pickup.
              </p>
            </div>
          </div>
        </section>

        {/* Plan Cards */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">Choose Your Membership Plan</h2>
            <p className="text-sm text-slate-500 mt-1">Instant activation. Cancel anytime with zero lock-in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`cursor-pointer rounded-3xl border-2 p-6 transition-all relative ${
                selectedPlan === 'monthly'
                  ? 'border-emerald-600 bg-white shadow-xl ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Flexible</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Monthly Pro</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900">₹99</span>
                  <span className="text-xs text-slate-500 block">/ month</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Unlimited Unlocked WhatsApp Contacts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Make Offers & Bargain on Any Part
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  ₹0 Platform Fees on all Checkouts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Live Hyperlocal & Outstation Tracking
                </li>
              </ul>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('monthly');
                }}
                className={`mt-6 w-full min-h-[44px] rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isPro && selectedPlan === 'monthly'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
                }`}
              >
                {isPro ? 'Renew / Extend Monthly (₹99)' : 'Activate Monthly (₹99)'}
              </button>
            </div>

            {/* Yearly Plan - Featured */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              className={`cursor-pointer rounded-3xl border-2 p-6 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-emerald-600 bg-white shadow-xl ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
                Save 58% • Best Value
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Annual Pass</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-0.5">Annual Pro Member</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-slate-900">₹499</span>
                  <span className="text-xs text-slate-500 block">/ year (₹41/mo)</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <strong>Everything in Monthly Pro</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Priority Listing Visibility for Your Own Spares
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Instant Direct Dispatch Support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  Exclusive Verified Recycler Gold Badge
                </li>
              </ul>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('yearly');
                }}
                className={`mt-6 w-full min-h-[44px] rounded-xl font-bold text-sm transition-all active:scale-95 ${
                  isPro && selectedPlan === 'yearly'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                }`}
              >
                {isPro ? 'Renew / Extend Annual (₹499)' : 'Activate Annual Pro (₹499)'}
              </button>
            </div>
          </div>
        </section>

        {/* Live Side-by-Side Comparison: Standard vs Pro */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            Live Marketplace Preview: Standard User vs Pro Member
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard User View */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Standard Account View
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                <p className="font-semibold text-slate-900 text-sm">Arduino Uno R3 (ATmega328P)</p>
                <p className="text-xs text-slate-500">Seller: SiliconHarvest Verified Hub • Guindy</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Phone: +91 7200X XXXXX</span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Upgrade to Chat
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Platform Fee: 5% (₹10 - ₹15 on checkout)
                </div>
              </div>
            </div>

            {/* Pro Member View */}
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                Pro Member View (Unlocked)
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-2">
                <p className="font-semibold text-slate-900 text-sm">Arduino Uno R3 (ATmega328P)</p>
                <p className="text-xs text-slate-500">Seller: SiliconHarvest Verified Hub • Guindy</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-800">+91 72002 55069</span>
                  <a
                    href="https://wa.me/917200255069?text=Hi%20SiliconHarvest,%20interested%20in%20Arduino%20Uno%20R3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg"
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </a>
                </div>
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Platform Fee: ₹0 Free + Bargain Engine Active
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('MARKETPLACE')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Browse Marketplace Spares <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

