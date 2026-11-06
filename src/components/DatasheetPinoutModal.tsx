import React from 'react';
import {
  X,
  Cpu,
  Thermometer,
  Gauge,
  ShieldCheck,
  Sparkles,
  Wind,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { HarvestableComponent, DonorBoard } from '../types/harvest';
import { getDatasheetForComponent } from '../data/icDatasheets';

interface DatasheetPinoutModalProps {
  component: HarvestableComponent;
  board?: DonorBoard;
  onClose: () => void;
  onBuyExtracted?: () => void;
}

export const DatasheetPinoutModal: React.FC<DatasheetPinoutModalProps> = ({
  component,
  board,
  onClose,
  onBuyExtracted,
}) => {
  const spec = getDatasheetForComponent(
    component.partNumber,
    component.componentCategory,
    component.packageType,
    component.recommendedTempC,
    component.partPriceInr
  );

  const totalExtractedCost = component.partPriceInr + component.extractionFeeInr;
  const savingsPercent = Math.max(
    15,
    Math.round(
      ((spec.newRetailPriceInr - component.partPriceInr) /
        spec.newRetailPriceInr) *
        100
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-base font-bold text-emerald-700">
                  {component.partNumber}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {component.packageType}
                </span>
                <span className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {spec.manufacturer}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {component.partName} • Chip-Level Pinout, Reflow Profile &amp;
                Multimeter Probe Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1D1D1F] border border-slate-200 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Telemetry Strip: Electrical + Thermal Reflow Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-600" />
                Nozzle Peak
              </div>
              <div className="text-base font-bold text-amber-700 mt-0.5">
                {component.recommendedTempC > 0
                  ? `${component.recommendedTempC}°C`
                  : '25°C (Cold Pull)'}
              </div>
              <div className="text-[10px] text-slate-500">
                Dwell: ~{spec.dwellTimeSeconds}s
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <Wind className="w-3 h-3 text-sky-600" />
                Hot-Air Flow
              </div>
              <div className="text-base font-bold text-sky-700 mt-0.5">
                {spec.airflowPercent}% Air
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {spec.fluxType}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-600" />
                Operating Rail
              </div>
              <div className="text-xs font-bold text-emerald-700 mt-1">
                {spec.operatingVoltage}
              </div>
              <div className="text-[10px] text-slate-500">{spec.maxCurrent}</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[10px] text-emerald-700 font-semibold uppercase">
                Maker Savings
              </div>
              <div className="text-base font-bold text-[#1D1D1F] mt-0.5">
                ₹{component.partPriceInr}{' '}
                <span className="text-xs text-slate-400 line-through">
                  ₹{spec.newRetailPriceInr}
                </span>
              </div>
              <div className="text-[10px] text-emerald-700 font-medium">
                Save {savingsPercent}% vs New Retail
              </div>
            </div>
          </div>

          {/* Multimeter Verification Protocol Box */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Gauge className="w-4 h-4" />
                Bench Multimeter QC Probe Protocol ({spec.multimeterMode})
              </h3>
              <span className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Mandatory Pre-Dispatch Check
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-[10px] text-rose-700 font-semibold uppercase">
                  🔴 Red Probe (+) Placement
                </div>
                <div className="text-[#1D1D1F] font-bold mt-0.5">
                  {spec.redProbePin}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">
                  ⚫ Black Probe (COM/-) Placement
                </div>
                <div className="text-[#1D1D1F] font-bold mt-0.5">
                  {spec.blackProbePin}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong className="font-mono text-emerald-700">
                  ✓ PASS THRESHOLD:{' '}
                </strong>
                {spec.healthyReadingRange}
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                <strong className="font-mono text-rose-700">
                  ✗ REJECT / SHORT:{' '}
                </strong>
                {spec.faultyReadingIndicator}
              </div>
            </div>
          </div>

          {/* Interactive IC Pinout Map */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-5 space-y-3.5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Package Pinout &amp; Test Pad Assignments ({component.packageType})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {spec.pins.map((pin) => (
                <div
                  key={String(pin.pinNumber)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-mono ${
                    pin.probeHighlight === 'RED_PROBE'
                      ? 'bg-rose-50/80 border-rose-200'
                      : pin.probeHighlight === 'BLACK_PROBE'
                      ? 'bg-slate-100 border-slate-300'
                      : pin.probeHighlight === 'OUTPUT_CHECK'
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-emerald-700 border border-slate-200 font-bold">
                      Pin {pin.pinNumber}
                    </span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">
                        {pin.pinName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {pin.functionDesc}
                      </div>
                    </div>
                  </div>

                  {pin.probeHighlight && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        pin.probeHighlight === 'RED_PROBE'
                          ? 'bg-rose-100 text-rose-700'
                          : pin.probeHighlight === 'BLACK_PROBE'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {pin.probeHighlight === 'RED_PROBE'
                        ? '🔴 +PROBE'
                        : pin.probeHighlight === 'BLACK_PROBE'
                        ? '⚫ -PROBE'
                        : '⚡ TEST OUT'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kapton Shielding Note + Drop-In Equivalents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
              <div className="font-mono font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Thermal Shielding &amp; Rework Advisory
              </div>
              <p className="text-amber-900 text-[11px] leading-relaxed">
                {spec.kaptonShieldNote}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-mono font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Drop-In Pin-Compatible Equivalents
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {spec.dropInEquivalents.map((eq) => (
                  <span
                    key={eq}
                    className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-200"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              {board ? (
                <span>
                  On Donor Board:{' '}
                  <strong className="text-[#1D1D1F]">{board.boardName}</strong>
                </span>
              ) : (
                <span>100% Multimeter Tested Before Dispatch</span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {onBuyExtracted && component.status === 'INTACT' && (
                <button
                  onClick={() => {
                    onClose();
                    onBuyExtracted();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Order Extracted &amp; Tested (₹{totalExtractedCost})
                  </span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium transition-all"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
