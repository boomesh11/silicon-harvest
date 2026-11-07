import React, { useState } from 'react';
import {
  Flame,
  Thermometer,
  Wallet,
  CheckCircle2,
  Cpu,
  Gauge,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  Link2,
  MessageSquare,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { Order } from '../types/harvest';
import { EsdLabelModal } from './EsdLabelModal';

export const TechWorkbenchPortal: React.FC = () => {
  const {
    orders,
    boards,
    components,
    techWalletBalanceInr,
    techCompletedJobsCount,
    completeExtractionJob,
    updateOrderTracking,
    setActiveTab,
  } = useHarvestStore();

  const [readingsMap, setReadingsMap] = useState<Record<string, string>>({});
  const [trackingMap, setTrackingMap] = useState<Record<string, string>>({});
  const [savedTrackingFeedback, setSavedTrackingFeedback] = useState<
    Record<string, boolean>
  >({});
  const [esdModalOrder, setEsdModalOrder] = useState<Order | null>(null);

  const pendingJobs = orders.filter(
    (o) =>
      o.status === 'PENDING_EXTRACTION' &&
      o.mode === 'EXTRACTED_TESTED_PART' &&
      (o.extractionFeeInr ?? 0) > 0
  );
  const completedExtractions = orders.filter(
    (o) =>
      o.mode === 'EXTRACTED_TESTED_PART' &&
      (o.extractionFeeInr ?? 0) > 0 &&
      o.status !== 'PENDING_EXTRACTION'
  );

  const handleReadingChange = (orderId: string, val: string) => {
    setReadingsMap((prev) => ({ ...prev, [orderId]: val }));
  };

  const handleTrackingChange = (orderId: string, val: string) => {
    setTrackingMap((prev) => ({ ...prev, [orderId]: val }));
  };

  const handleVerifyAndDispatch = (orderId: string, defaultReading: string) => {
    const val = readingsMap[orderId]?.trim() || defaultReading;
    const tracking = trackingMap[orderId]?.trim() || '';
    completeExtractionJob(orderId, val, tracking);
  };

  const handleSaveTrackingOnCompleted = (orderId: string, currentVal: string) => {
    const nextTracking =
      trackingMap[orderId] !== undefined ? trackingMap[orderId] : currentVal;
    updateOrderTracking(orderId, nextTracking);
    setSavedTrackingFeedback((prev) => ({ ...prev, [orderId]: true }));
    setTimeout(() => {
      setSavedTrackingFeedback((prev) => ({ ...prev, [orderId]: false }));
    }, 2500);
  };

  return (
    <div className="space-y-8">
      {/* Top Telemetry & Technician Earnings Wallet Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between space-y-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              HOT-AIR REWORK &amp; QC WORKBENCH
            </span>
            <span className="font-mono text-xs text-slate-500">
              • Certified Campus / Hub Micro-Soldering Station
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Extraction Hub Workbench (Technician Portal)
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Process{' '}
            <span className="font-mono text-amber-700 font-semibold">
              PENDING_EXTRACTION
            </span>{' '}
            orders below: dial your hot-air rework station to the target package
            nozzle temperature, verify diode drop / output rail on a digital
            multimeter, attach the real dispatch tracking link or locker code,
            and release{' '}
            <strong className="text-[#1D1D1F]">
              70% of the escrowed extraction fee
            </strong>{' '}
            to your wallet.
          </p>
        </div>

        {/* Technician Earnings Wallet Card (Computed Dynamically from Completed Orders) */}
        <div className="lg:col-span-4 bg-white/95 backdrop-blur-2xl border border-emerald-200 rounded-3xl p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-600" />
              Technician Earnings Wallet
            </span>
            <span className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              70% Fee Share
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-4xl font-semibold tracking-tight text-[#1D1D1F]">
              ₹{techWalletBalanceInr}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across{' '}
              <span className="font-mono text-emerald-700 font-semibold">
                {techCompletedJobsCount} verified IC extractions
              </span>{' '}
              (Calculated dynamically from completed orders)
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Active Queue: {pendingJobs.length} Jobs</span>
            <span className="text-emerald-700 font-medium">
              Live Escrow Sync
            </span>
          </div>
        </div>
      </div>

      {/* Pending Extraction Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600" />
            Active Hot-Air Extraction Queue ({pendingJobs.length}{' '}
            PENDING_EXTRACTION)
          </h2>
          {pendingJobs.length === 0 && (
            <button
              onClick={() => setActiveTab('MARKETPLACE')}
              className="text-xs font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Browse Marketplace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {pendingJobs.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-14 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
              No Pending Extraction Jobs in Queue (0 Jobs)
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              When a buyer orders an{' '}
              <strong className="text-[#1D1D1F]">
                Extracted &amp; Tested Component
              </strong>{' '}
              from any listed donor PCB, it will appear here in real time for
              hot-air rework and multimeter verification.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {boards.length === 0 ? (
                <button
                  onClick={() => setActiveTab('SELLER_PORTAL')}
                  className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    No donor boards listed yet — List the first dead PCB in 30
                    seconds →
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('MARKETPLACE')}
                  className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Browse Marketplace Components →</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pendingJobs.map((job) => {
              const board = boards.find((b) => b.id === job.donorBoardId);
              const comp = components.find((c) => c.id === job.componentId);
              const techPayout = Number(
                (job.extractionFeeInr * 0.7).toFixed(2)
              );
              const recommendedTemp = comp?.recommendedTempC || 320;
              const defaultPresetReading =
                comp?.componentCategory === 'Voltage Regulator'
                  ? '3.31V DC Output Rail & Dropout Verified'
                  : '0.52V Diode Drop / Zero VCC-GND Short Verified';

              const currentReading =
                readingsMap[job.id] !== undefined
                  ? readingsMap[job.id]
                  : defaultPresetReading;

              const currentTracking =
                trackingMap[job.id] !== undefined
                  ? trackingMap[job.id]
                  : job.trackingOrPorterLink || '';

              return (
                <div
                  key={job.id}
                  className="bg-white/95 backdrop-blur-2xl border border-amber-200 rounded-3xl p-5 sm:p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-3 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          PENDING_EXTRACTION
                        </span>
                        <span className="font-mono text-xs text-[#1D1D1F] font-semibold">
                          {job.orderCode}
                        </span>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Donor ID: {job.donorBoardId}
                        </span>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          {job.deliveryType}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F] flex flex-wrap items-center gap-2 pt-1">
                        <span className="font-mono text-emerald-700">
                          {comp?.partNumber || 'SMD-IC'}
                        </span>
                        <span className="text-slate-500 text-base font-normal">
                          — {comp?.partName || 'Target Harvest Component'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Source Donor PCB:{' '}
                        <strong className="text-[#1D1D1F]">
                          {board?.boardName || job.donorBoardId}
                        </strong>{' '}
                        (Fault to avoid:{' '}
                        <span className="text-rose-600 font-medium">
                          {board?.primaryFault}
                        </span>
                        ) • Buyer:{' '}
                        <strong className="text-[#1D1D1F]">
                          {job.buyerName} ({job.buyerPhone})
                        </strong>
                      </p>
                    </div>

                    {/* Thermal & Payout Telemetry Pills */}
                    <div className="flex flex-wrap items-center gap-3 font-mono">
                      <div className="px-4 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-right">
                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-amber-600" />
                          Nozzle Target
                        </div>
                        <div className="text-sm font-bold text-amber-800 mt-0.5">
                          {recommendedTemp}°C • {comp?.packageType || 'SMD'}
                        </div>
                      </div>

                      <div className="px-4 py-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-right">
                        <div className="text-[10px] text-slate-500 uppercase">
                          Escrow Credit (70%)
                        </div>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">
                          +₹{techPayout}{' '}
                          <span className="text-[10px] text-slate-500">
                            (of ₹{job.extractionFeeInr})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multimeter Verification Input + Tracking Link Input + Complete Action */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Multimeter Reading */}
                      <div className="space-y-2">
                        <label className="block text-xs font-mono text-slate-600 font-medium flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                          1. Multimeter Verification Reading (Required):
                        </label>
                        <input
                          type="text"
                          value={currentReading}
                          onChange={(e) =>
                            handleReadingChange(job.id, e.target.value)
                          }
                          placeholder="e.g. 3.31V DC verified / 0.48V Diode Drop Pass"
                          className="w-full min-h-[44px] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-base sm:text-xs text-emerald-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">
                            Bench Presets:
                          </span>
                          {[
                            '3.31V DC LDO Output Verified',
                            '0.51V Diode Drop / No Pin Short',
                            'ESR 0.18Ω / Capacitance 98% Nominal',
                          ].map((preset) => (
                            <button
                              type="button"
                              key={preset}
                              onClick={() => handleReadingChange(job.id, preset)}
                              className="text-[10px] font-mono px-2.5 py-1 min-h-[30px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 transition-all"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Real Dispatch Tracking / Porter URL / AWB / Locker Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-mono text-slate-600 font-medium flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-sky-600" />
                          2. Porter Tracking URL / Shiprocket AWB / Locker Info:
                        </label>
                        <input
                          type="text"
                          value={currentTracking}
                          onChange={(e) =>
                            handleTrackingChange(job.id, e.target.value)
                          }
                          placeholder={
                            job.deliveryType === 'HYPERLOCAL_PORTER'
                              ? 'Paste live Porter / Rapido tracking URL (https://porter.in/...)'
                              : job.deliveryType === 'OUTSTATION_PARCEL'
                              ? 'Enter India Post / Shiprocket AWB Tracking Number'
                              : 'Enter Campus Locker Number & Pickup Instructions'
                          }
                          className="w-full min-h-[44px] px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                        <p className="text-[10px] font-mono text-slate-500">
                          Saved directly to{' '}
                          <code className="text-[#1D1D1F]">
                            orders.tracking_or_porter_link
                          </code>{' '}
                          for the buyer&apos;s order tracker.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          handleVerifyAndDispatch(job.id, defaultPresetReading)
                        }
                        className="w-full sm:w-auto min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>
                          Complete Extraction, Save Tracking &amp; Credit 70%
                          Fee (+₹{techPayout})
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Extractions & Real Dispatch Tracking Manager */}
      {completedExtractions.length > 0 && (
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Verified Extractions — Dispatch Links, WhatsApp Coordinates &amp;
            ESD Pouch Labels ({completedExtractions.length})
          </h3>
          <div className="space-y-4">
            {completedExtractions.map((ord) => {
              const board = boards.find((b) => b.id === ord.donorBoardId);
              const comp = components.find((c) => c.id === ord.componentId);
              const techShare = Number(
                (ord.extractionFeeInr * 0.7).toFixed(2)
              );
              const pickupHub = board?.locationArea || 'Seller / Extraction Hub';
              const trackingVal =
                trackingMap[ord.id] !== undefined
                  ? trackingMap[ord.id]
                  : ord.trackingOrPorterLink || '';

              const cleanBuyerPhone = ord.buyerPhone.replace(/\D/g, '');
              const whatsappPhone =
                cleanBuyerPhone.length === 10
                  ? `91${cleanBuyerPhone}`
                  : cleanBuyerPhone;

              const whatsappMsg = encodeURIComponent(
                `⚡ SiliconHarvest Dispatch [${ord.orderCode}]\n` +
                  `Part: ${comp?.partNumber || 'IC'} (${
                    comp?.packageType || 'SMD'
                  })\n` +
                  `Multimeter QC: ${ord.multimeterReadingValue}\n` +
                  `📍 Pickup Hub: ${pickupHub}\n` +
                  `🏁 Drop Address: ${ord.buyerAddress} (${ord.buyerName})\n` +
                  (ord.trackingOrPorterLink
                    ? `🔗 Tracking / AWB / Locker: ${ord.trackingOrPorterLink}`
                    : '')
              );

              return (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3.5 text-xs font-mono"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {ord.status}
                      </span>
                      <span className="text-[#1D1D1F] font-bold">
                        {ord.orderCode}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        {comp?.partNumber || 'IC'} ({ord.donorBoardId})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                        {ord.deliveryType}
                      </span>
                    </div>

                    <span className="text-amber-700 font-bold">
                      Escrow Released: +₹{techShare}
                    </span>
                  </div>

                  <div className="text-slate-600 text-[11px]">
                    Multimeter QC:{' '}
                    <span className="text-emerald-700 font-semibold">
                      &ldquo;{ord.multimeterReadingValue}&rdquo;
                    </span>{' '}
                    • Pickup: <span className="text-[#1D1D1F]">{pickupHub}</span>{' '}
                    → Drop:{' '}
                    <span className="text-[#1D1D1F]">{ord.buyerAddress}</span>
                  </div>

                  {/* Update Tracking / Porter Link / AWB / Locker Instructions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={trackingVal}
                      onChange={(e) =>
                        handleTrackingChange(ord.id, e.target.value)
                      }
                      placeholder="Paste Porter Booking Link, Shiprocket AWB, or Campus Locker Instructions..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveTrackingOnCompleted(
                          ord.id,
                          ord.trackingOrPorterLink || ''
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-slate-800 text-white text-[11px] font-semibold transition-all"
                    >
                      {savedTrackingFeedback[ord.id]
                        ? 'Saved to Order ✓'
                        : 'Save Tracking / Locker'}
                    </button>
                  </div>

                  {/* Dispatch Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {ord.trackingOrPorterLink &&
                      ord.trackingOrPorterLink.startsWith('http') && (
                        <a
                          href={ord.trackingOrPorterLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Live Tracking Link</span>
                        </a>
                      )}

                    <a
                      href={
                        whatsappPhone
                          ? `https://wa.me/${whatsappPhone}?text=${whatsappMsg}`
                          : `https://wa.me/?text=${whatsappMsg}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        Send WhatsApp Dispatch to Buyer ({ord.buyerPhone})
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setEsdModalOrder(ord)}
                      className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Print Manifest &amp; ESD QR Label</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {esdModalOrder && (
        <EsdLabelModal
          order={esdModalOrder}
          board={boards.find((b) => b.id === esdModalOrder.donorBoardId)}
          component={
            components.find((c) => c.id === esdModalOrder.componentId) ||
            undefined
          }
          onClose={() => setEsdModalOrder(null)}
        />
      )}
    </div>
  );
};
