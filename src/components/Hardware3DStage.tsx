import React from 'react';
import { Real3DHardwareStage, StudioCategoryKey } from './Real3DHardwareStage';
import { ShieldCheck, Zap, MapPin, ArrowRight } from 'lucide-react';

interface Hardware3DStageProps {
  activeBoardsCount: number;
  intactComponentsCount: number;
  onSelectPillar: (pillar: 'SELL' | 'PROCURE' | 'BARGAIN' | 'TRACK') => void;
  onSelectCategory?: (category: StudioCategoryKey) => void;
}

export const Hardware3DStage: React.FC<Hardware3DStageProps> = ({
  activeBoardsCount,
  intactComponentsCount,
  onSelectPillar,
  onSelectCategory,
}) => {
  return (
    <div className="relative w-full max-w-full rounded-[28px] overflow-hidden bg-white border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.07)] p-6 sm:p-9 lg:p-11">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-7 lg:gap-10 w-full max-w-full">
        {/* Left Column: Clean Architectural Typography & Action Cards */}
        <div className="lg:col-span-7 min-w-0 space-y-5 text-left">
          {/* Capability Highlights / Active Listing Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {activeBoardsCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeBoardsCount} Active Listings Available
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              45-Min Same-District Delivery
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Multimeter QC Verified
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs font-medium text-slate-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              All 38 TN &amp; Pan-India Districts
            </span>
          </div>

          {/* Editorial Display Heading */}
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-[#0F172A] leading-[1.15]">
              Valuable Components Get Lost the Moment They Stop Moving.{' '}
              <span className="text-emerald-600">
                SiliconHarvest Keeps Them Moving.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              India&apos;s connected semiconductor &amp; circular electronics exchange. Procure bench-tested ICs, inverter PCBs, and Li-Ion cells—or monetize salvage donor boards in 30 seconds with local courier dispatch.
            </p>
          </div>

          {/* 4 Tactile Apple/Stripe-Style Action Cards */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Sell Spares */}
            <button
              type="button"
              onClick={() => onSelectPillar('SELL')}
              className="group text-left rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-emerald-500/50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Sell Spares
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-sm font-bold text-[#0F172A] mt-1">
                List in 30 Seconds
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Guided category price ranges &amp; fair price sliders
              </div>
            </button>

            {/* Card 2: Procure Parts */}
            <button
              type="button"
              onClick={() => onSelectPillar('PROCURE')}
              className="group text-left rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-emerald-500/50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Procure Parts
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-sm font-bold text-[#0F172A] mt-1">
                Browse Components &amp; Boards
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Buy ready-to-use parts or full donor boards
              </div>
            </button>

            {/* Card 3: Direct Bargain */}
            <button
              type="button"
              onClick={() => onSelectPillar('BARGAIN')}
              className="group text-left rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-amber-500/50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Direct Bargain
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-sm font-bold text-[#0F172A] mt-1">
                Negotiate &amp; Chat Direct
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Make counter-offers &amp; chat directly on WhatsApp
              </div>
            </button>

            {/* Card 4: Instant Dispatch */}
            <button
              type="button"
              onClick={() => onSelectPillar('TRACK')}
              className="group text-left rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-sky-500/50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                  Instant Dispatch
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-sm font-bold text-[#0F172A] mt-1">
                Local &amp; Pan-India Courier
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Same-district Rapido &amp; Porter or India Post parcel
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time 3D Studio Hardware Showcase */}
        <div className="lg:col-span-5 min-w-0 w-full max-w-full overflow-hidden flex flex-col items-center">
          <Real3DHardwareStage onSelectCategory={onSelectCategory} />
        </div>
      </div>
    </div>
  );
};
