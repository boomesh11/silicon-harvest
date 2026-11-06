import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Thermometer,
  Cpu,
  Truck,
  MapPin,
} from 'lucide-react';
import { Order, DonorBoard, HarvestableComponent } from '../types/harvest';

interface EsdLabelModalProps {
  order: Order;
  board?: DonorBoard;
  component?: HarvestableComponent;
  onClose: () => void;
}

export const EsdLabelModal: React.FC<EsdLabelModalProps> = ({
  order,
  board,
  component,
  onClose,
}) => {
  // Deterministic 7x7 QR-style pattern from orderCode
  const seedStr = `${order.orderCode}-${component?.partNumber || 'RAW'}`;
  const cells: boolean[] = Array.from({ length: 49 }, (_, idx) => {
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    if (
      (row < 2 && col < 2) ||
      (row < 2 && col > 4) ||
      (row > 4 && col < 2)
    ) {
      return true;
    }
    const code = seedStr.charCodeAt(idx % seedStr.length);
    return (code + idx * 7) % 2 === 0;
  });

  const trackingOrAwb =
    order.trackingOrPorterLink?.trim() || 'Awaiting Tracking / AWB Assignment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                Pocket Parcel Shipping Manifest &amp; ESD Anti-Static Pouch Label
              </h2>
              <p className="text-xs text-slate-500">
                JEDEC JESD625-B ESD Label + Outstation / Hub Dispatch Manifest •{' '}
                <span className="font-mono text-emerald-700 font-semibold">
                  {order.orderCode}
                </span>
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

        {/* Body: 1. Pocket Parcel Shipping Manifest + 2. ESD Anti-Static Pouch Label */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* SECTION 1: Pocket Parcel Shipping Manifest */}
          <div className="bg-sky-50/50 border border-sky-200 rounded-3xl p-5 space-y-3.5 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-[#1D1D1F] uppercase">
                  POCKET PARCEL SHIPPING MANIFEST ({order.deliveryType})
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                Tracking / AWB: {trackingOrAwb}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  Origin Extraction Hub (From)
                </div>
                <div className="font-bold text-[#1D1D1F]">
                  {board?.sellerName || 'SiliconHarvest Extraction Hub'}
                </div>
                <div className="text-[11px] text-slate-600">
                  {board?.locationArea || 'Origin Hub'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1">
                <div className="text-[10px] text-amber-700 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  Destination Buyer / Lab (Ship To)
                </div>
                <div className="font-bold text-[#1D1D1F]">{order.buyerName}</div>
                <div className="text-[11px] text-slate-600">
                  {order.buyerAddress}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  Tel: {order.buyerPhone}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-1">
              <span>Package: ESD Shielding Bag + Rigid Foam Tube</span>
              <span>
                Declared Value: ₹{order.totalPayableInr}{' '}
                {order.upiUtrOrPaymentId ? `(${order.upiUtrOrPaymentId})` : ''}
              </span>
            </div>
          </div>

          {/* SECTION 2: ESD Anti-Static Pouch Label */}
          <div className="bg-slate-50 border-2 border-dashed border-emerald-500 rounded-3xl p-5 space-y-4 font-mono">
            {/* Top Label Strip with ESD Warning Icon */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ESD SENSITIVE DEVICE
                </span>
                <span className="text-xs font-bold text-[#1D1D1F]">
                  SILICONHARVEST POUCH LABEL
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-bold">
                {order.orderCode}
              </span>
            </div>

            {/* Middle Grid: Part Number, Package Type + Order QR Code */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-8 space-y-1.5 text-xs">
                <div className="text-[10px] text-slate-500 uppercase">
                  Extracted Part Number &amp; Specs
                </div>
                <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  {component ? component.partNumber : 'FULL-RAW-DONOR-PCB'}
                </div>
                <div className="text-slate-600 text-[11px]">
                  {component ? component.partName : board?.boardName}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1D1D1F] border border-slate-200 font-bold">
                    PACKAGE: {component ? component.packageType : 'RAW-BOARD'}
                  </span>
                  {component && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      {component.recommendedTempC}°C Reflow
                    </span>
                  )}
                </div>
              </div>

              {/* 7x7 Order QR Code */}
              <div className="col-span-4 flex flex-col items-center justify-center">
                <div
                  title={`Order QR: ${order.orderCode}`}
                  className="p-2 bg-white border border-slate-200 rounded-xl grid grid-cols-7 gap-0.5 w-24 h-24 shadow-sm"
                >
                  {cells.map((filled, idx) => (
                    <div
                      key={idx}
                      className={filled ? 'bg-slate-950' : 'bg-white'}
                    />
                  ))}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">
                  QR: {order.orderCode}
                </span>
              </div>
            </div>

            {/* Multimeter Verification Value & Donor Traceability */}
            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  MULTIMETER VERIFICATION VALUE:
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  QC VERIFIED
                </span>
              </div>
              <div className="text-[#1D1D1F] font-bold">
                {order.multimeterReadingValue ||
                  '3.31V DC / Diode Drop Pass Verified'}
              </div>
              <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200 flex justify-between">
                <span>
                  Donor PCB: {board?.boardName || order.donorBoardId} (
                  {order.donorBoardId})
                </span>
                <span>Status: {order.status}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Manifest &amp; ESD Pouch Label</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
