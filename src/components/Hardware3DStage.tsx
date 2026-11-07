import React from 'react';
import { Hero3DCanvas } from './Hero3DCanvas';

interface Hardware3DStageProps {
  activeBoardsCount: number;
  intactComponentsCount: number;
  onSelectPillar: (pillar: 'SELL' | 'PROCURE' | 'BARGAIN' | 'TRACK') => void;
}

export const Hardware3DStage: React.FC<Hardware3DStageProps> = ({
  activeBoardsCount,
  intactComponentsCount,
  onSelectPillar,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#07090E] text-white border border-white/15 shadow-2xl">
      {/* Subtle Anodized Radial Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(0, 245, 160, 0.28) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 sm:p-8 lg:p-10">
        {/* Left Column: Engineering Mission & 4-Pillar Action Console */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <div className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[11px] font-mono uppercase tracking-widest text-[#00F5A0]">
            <span className="h-2 w-2 rounded-full bg-[#00F5A0] animate-ping" />
            <span>FR4-GRADE TRACEABLE SALVAGE NETWORK • ZERO E-WASTE</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-[1.12]">
            Valuable Components Get Lost the Moment They Stop Moving.{' '}
            <span className="text-[#00F5A0]">
              SiliconHarvest Keeps Them Moving.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            India&apos;s connected semiconductor &amp; appliance spares exchange. Procure multimeter-verified ICs, inverter PCBs, and Li-Ion cells—or monetize dead donor boards in 30 seconds with same-district bike dispatch.
          </p>

          {/* Live Telemetry Readout Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-1 font-mono text-xs tabular-nums">
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">LIVE DONOR BOARDS</span>
              <span className="text-white font-bold text-sm">{activeBoardsCount} UNITS</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">VERIFIED SILICON NODES</span>
              <span className="text-[#00F5A0] font-bold text-sm">{intactComponentsCount} INTACT</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-slate-400 block text-[10px]">DIODE DROP QC</span>
              <span className="text-[#FFB800] font-bold text-sm">0.512V PASS</span>
            </div>
          </div>

          {/* 4-Pillar Action Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => onSelectPillar('SELL')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                01 // SELL SPARES
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                List in 30s →
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fair range slider</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('PROCURE')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                02 // PROCURE PARTS
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                Inspect Nodes ↓
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tested ICs &amp; PCBs</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('BARGAIN')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#FFB800]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FFB800]">
                03 // BARGAIN &amp; PRO
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#FFB800] transition-colors">
                Unlock WhatsApp ⭐
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">₹0 platform fee</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectPillar('TRACK')}
              className="text-left rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#00F5A0]/60 p-3.5 transition-all active:scale-95 group"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#00F5A0]">
                04 // TRACK DISPATCH
              </div>
              <div className="text-xs font-bold text-white mt-1 group-hover:text-[#00F5A0] transition-colors">
                Live Courier →
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Rapido ₹35 / Post ₹45</div>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive 3D Hardware Stage (Hero3DCanvas) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <Hero3DCanvas />
        </div>
      </div>
    </div>
  );
};
