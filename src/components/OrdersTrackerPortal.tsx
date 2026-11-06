import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  MapPin,
  Flame,
  Navigation,
  QrCode,
  MessageSquare,
  Truck,
  PlusCircle,
  Cpu,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { Order } from '../types/harvest';
import { EsdLabelModal } from './EsdLabelModal';

export const OrdersTrackerPortal: React.FC = () => {
  const {
    orders,
    boards,
    components,
    markOrderCompleted,
    updateOrderTracking,
    setActiveTab,
  } = useHarvestStore();

  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [esdModalOrder, setEsdModalOrder] = useState<Order | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>(
    {}
  );
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);

  const handleSaveTracking = (order: Order) => {
    const val =
      trackingInputs[order.id] !== undefined
        ? trackingInputs[order.id]
        : order.trackingOrPorterLink || '';
    updateOrderTracking(order.id, val);
    setSavedOrderId(order.id);
    setTimeout(() => setSavedOrderId(null), 2500);
  };

  const handleDownloadInvoice = (order: Order) => {
    const board = boards.find((b) => b.id === order.donorBoardId);
    const comp = components.find((c) => c.id === order.componentId);

    const invoiceText = `====================================================================
SILICONHARVEST — INDUSTRIAL PCB COMPONENT EXTRACTION & SUPPLY LAB
====================================================================
INVOICE, ESCROW RECEIPT & MULTIMETER QC CERTIFICATE
Order Code       : ${order.orderCode}
Internal ID      : ${order.id}
Timestamp        : ${new Date(order.createdAt).toLocaleString()}
Order Status     : ${order.status}
Payment Ref      : ${order.upiUtrOrPaymentId || 'Recorded'}
--------------------------------------------------------------------
BUYER / LAB DETAILS
Buyer Name       : ${order.buyerName}
Phone            : ${order.buyerPhone}
Dispatch Address : ${order.buyerAddress}
Logistics Tier   : ${order.deliveryType}
Tracking / Link  : ${
      order.trackingOrPorterLink || 'Awaiting dispatch assignment'
    }
--------------------------------------------------------------------
HARDWARE & EXTRACTION TELEMETRY
Fulfillment Mode : ${order.mode}
Donor PCB Origin : ${board?.boardName || order.donorBoardId} (${order.donorBoardId})
Reported Fault   : ${board?.primaryFault || 'N/A'}
Target Component : ${
      comp
        ? `${comp.partNumber} — ${comp.partName} [${comp.packageType}]`
        : 'Full Raw Donor Board (As-Is)'
    }
Nozzle Temp      : ${comp ? `${comp.recommendedTempC}°C` : 'N/A (Raw PCB)'}
Multimeter QC    : ${
      order.multimeterReadingValue || 'Pending Hot-Air Bench Verification'
    }
--------------------------------------------------------------------
BILLING SUMMARY (INR)
Item / IC Price        : Rs. ${order.itemPriceInr}.00
Hot-Air Extraction Fee : Rs. ${order.extractionFeeInr}.00 (Escrow Protected)
Delivery & ESD Packing : Rs. ${order.deliveryFeeInr}.00
--------------------------------------------------------------------
TOTAL AMOUNT PAID      : Rs. ${order.totalPayableInr}.00
====================================================================
Certified by SiliconHarvest ESD & Chip-Level Salvage Network
`;

    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.orderCode}_SiliconHarvest_Invoice_QC.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedId(order.id);
    setTimeout(() => setDownloadedId(null), 3000);
  };

  const getLogisticsMetadata = (order: Order) => {
    const tracking = order.trackingOrPorterLink?.trim();
    switch (order.deliveryType) {
      case 'CAMPUS_HUB_PICKUP':
        return {
          badge: 'CAMPUS / HUB LOCKER PICKUP (₹0)',
          channel:
            tracking || 'Awaiting Campus Locker Number & Pickup Instructions',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Queued for hot-air extraction before locker placement'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? `Ready for Pickup: ${tracking}`
                : 'Ready for Campus Hub Pickup'
              : 'Picked up by buyer',
        };
      case 'HYPERLOCAL_PORTER':
        return {
          badge: 'PORTER 45-MIN HYPERLOCAL EXPRESS (₹45)',
          channel: tracking || 'Awaiting Porter / Rapido Live Booking Link',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting multimeter verification before rider dispatch'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? 'Live Rider Tracking Active'
                : 'Ready for Hyperlocal Rider Pickup'
              : 'Delivered via Hyperlocal Express',
        };
      case 'OUTSTATION_PARCEL':
        return {
          badge: 'INDIA POST / SHIPROCKET ESD PARCEL (₹49)',
          channel: tracking || 'Awaiting India Post / Shiprocket AWB Number',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting IC extraction before ESD tube sealing'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? `Dispatched — AWB: ${tracking}`
                : 'Sealed in ESD tube — awaiting AWB assignment'
              : 'Delivered to destination address',
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              LIVE LOGISTICS, DISPATCH TRACKING &amp; ESD QR LABELS
            </span>
            <span className="font-mono text-xs text-slate-500">
              • {orders.length} Total Orders
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            My Orders, Multimeter Certificates &amp; Dispatch Tracker
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Track live hot-air bench extraction progress, inspect verified
            multimeter readings, access real Porter / Shiprocket AWB / Campus
            Locker details, or print ESD Pouch QR Labels.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('MARKETPLACE')}
          className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs shrink-0 transition-all"
        >
          + Browse Marketplace
        </button>
      </div>

      {/* Empty State when 0 Orders exist */}
      {orders.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
            No Salvage Orders Placed Yet (0 Orders)
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Once you order an extracted &amp; multimeter-verified IC or a full
            raw donor PCB, your real-time escrow status, multimeter certificate,
            and dispatch tracking link will appear here.
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
                <span>Explore Available Donor Boards &amp; ICs →</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-5">
          {orders.map((order) => {
            const board = boards.find((b) => b.id === order.donorBoardId);
            const comp = components.find((c) => c.id === order.componentId);
            const logistics = getLogisticsMetadata(order);
            const pickupCoords = board?.locationArea || 'Seller Hub';

            const cleanBuyerPhone = order.buyerPhone.replace(/\D/g, '');
            const whatsappPhone =
              cleanBuyerPhone.length === 10
                ? `91${cleanBuyerPhone}`
                : cleanBuyerPhone;

            const whatsappDispatchUrl = `${
              whatsappPhone
                ? `https://wa.me/${whatsappPhone}`
                : 'https://wa.me/'
            }?text=${encodeURIComponent(
              `⚡ SiliconHarvest Dispatch [${order.orderCode}]\n` +
                `Item: ${
                  comp
                    ? `${comp.partNumber} (${comp.packageType})`
                    : board?.boardName || 'Raw Donor Board'
                }\n` +
                `Multimeter QC: ${
                  order.multimeterReadingValue || 'Pending Bench Verification'
                }\n` +
                `📍 Pickup Hub: ${pickupCoords}\n` +
                `🏁 Buyer Drop: ${order.buyerAddress} (${order.buyerName})\n` +
                (order.trackingOrPorterLink
                  ? `🔗 Tracking / AWB / Locker: ${order.trackingOrPorterLink}`
                  : '')
            )}`;

            const stepIndex =
              order.status === 'PENDING_EXTRACTION'
                ? 1
                : order.status === 'READY_FOR_DISPATCH'
                ? 2
                : 3;

            const currentTrackingInput =
              trackingInputs[order.id] !== undefined
                ? trackingInputs[order.id]
                : order.trackingOrPorterLink || '';

            return (
              <div
                key={order.id}
                className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
              >
                {/* Top Row: Order Code, Item Title, Total Price */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#1D1D1F] px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                        {order.orderCode}
                      </span>
                      <span
                        className={`font-mono text-xs px-3 py-0.5 rounded-full border font-semibold ${
                          order.status === 'PENDING_EXTRACTION'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : order.status === 'READY_FOR_DISPATCH'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {order.mode === 'RAW_DONOR_BOARD'
                          ? 'MODE A: FULL RAW DONOR PCB'
                          : 'MODE B: EXTRACTED & TESTED IC (ESCROW)'}
                      </span>
                      {order.upiUtrOrPaymentId && (
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ref: {order.upiUtrOrPaymentId}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[#1D1D1F] pt-1 flex flex-wrap items-center gap-2">
                      {order.mode === 'EXTRACTED_TESTED_PART' && comp ? (
                        <>
                          <span className="font-mono text-emerald-700">
                            {comp.partNumber}
                          </span>
                          <span>— {comp.partName}</span>
                          <span className="font-mono text-xs text-slate-500">
                            ({comp.packageType} • {comp.recommendedTempC}°C)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-700">
                            Full Raw Donor Board:
                          </span>
                          <span>{board?.boardName || order.donorBoardId}</span>
                        </>
                      )}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Donor Board:{' '}
                      <span className="text-[#1D1D1F] font-medium">
                        {board?.boardName} ({order.donorBoardId})
                      </span>{' '}
                      • Buyer:{' '}
                      <span className="text-[#1D1D1F] font-medium">
                        {order.buyerName} ({order.buyerPhone})
                      </span>
                    </p>
                  </div>

                  {/* Price Breakdown Pill */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-right font-mono">
                    <div className="text-[11px] text-slate-500">
                      ₹{order.itemPriceInr} part + ₹{order.extractionFeeInr}{' '}
                      escrow + ₹{order.deliveryFeeInr} ship
                    </div>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">
                      Total: ₹{order.totalPayableInr}
                    </div>
                  </div>
                </div>

                {/* 3-Stage Live Order Status Stepper */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                        stepIndex === 1
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-white border-emerald-200'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          stepIndex === 1
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        1
                      </div>
                      <div className="text-xs">
                        <div className="font-mono font-bold text-[#1D1D1F]">
                          1. PENDING_EXTRACTION
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {order.mode === 'RAW_DONOR_BOARD'
                            ? 'Bypassed (As-Is Raw Donor Board)'
                            : stepIndex === 1
                            ? 'Queued at Hot-Air Station (Escrow Active)'
                            : 'Extracted & passed multimeter bench check'}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                        stepIndex === 2
                          ? 'bg-sky-50 border-sky-300'
                          : stepIndex > 2
                          ? 'bg-white border-emerald-200'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          stepIndex >= 2
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        2
                      </div>
                      <div className="text-xs">
                        <div className="font-mono font-bold text-[#1D1D1F]">
                          2. READY_FOR_DISPATCH
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {order.multimeterReadingValue
                            ? `QC: ${order.multimeterReadingValue}`
                            : 'Awaiting multimeter reading from workbench'}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                        stepIndex === 3
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          stepIndex === 3
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        3
                      </div>
                      <div className="text-xs">
                        <div className="font-mono font-bold text-[#1D1D1F]">
                          3. COMPLETED
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {stepIndex === 3
                            ? 'Handed over to buyer & verified in circuit'
                            : 'Pending final handover / pickup'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Tracking Link / AWB / Locker Input & Display */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-sky-600" />
                      Dispatch Tracking URL / Shiprocket AWB / Campus Locker:
                    </span>
                    {order.trackingOrPorterLink &&
                      order.trackingOrPorterLink.startsWith('http') && (
                        <a
                          href={order.trackingOrPorterLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 font-bold underline flex items-center gap-1"
                        >
                          <span>Open Live Tracking Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={currentTrackingInput}
                      onChange={(e) =>
                        setTrackingInputs((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                      placeholder="Paste Porter Booking URL, India Post / Shiprocket AWB, or Campus Locker Instructions..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveTracking(order)}
                      className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-mono text-xs font-semibold transition-all"
                    >
                      {savedOrderId === order.id
                        ? 'Saved ✓'
                        : 'Save Tracking Info'}
                    </button>
                  </div>
                </div>

                {/* Bottom Bar: Logistics Telemetry + Actions */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2 font-mono">
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                        <Navigation className="w-3.5 h-3.5" />
                        {logistics.badge}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700">{logistics.channel}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Origin:{' '}
                        <strong className="text-[#1D1D1F]">
                          {pickupCoords}
                        </strong>{' '}
                        → Drop:{' '}
                        <strong className="text-[#1D1D1F]">
                          {order.buyerAddress}
                        </strong>{' '}
                        —{' '}
                        <span className="text-emerald-700 font-mono font-medium">
                          {logistics.statusNote}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {order.status === 'PENDING_EXTRACTION' && (
                      <button
                        onClick={() => setActiveTab('TECH_WORKBENCH')}
                        className="px-3.5 py-2 rounded-xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Verify on Tech Workbench</span>
                      </button>
                    )}

                    <a
                      href={whatsappDispatchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Dispatch</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setEsdModalOrder(order)}
                      className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Print Manifest &amp; ESD Label</span>
                    </button>

                    {order.status === 'READY_FOR_DISPATCH' && (
                      <button
                        onClick={() => markOrderCompleted(order.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadInvoice(order)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] border border-slate-200 font-mono text-xs flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {downloadedId === order.id
                          ? 'Invoice ✓'
                          : 'Download Invoice'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
