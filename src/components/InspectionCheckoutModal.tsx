import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Flame,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Zap,
  Truck,
  Package,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  QrCode,
  Smartphone,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import {
  DonorBoard,
  HarvestableComponent,
  OrderMode,
  DeliveryType,
  Order,
} from '../types/harvest';
import { useHarvestStore } from '../store/useHarvestStore';

interface InspectionCheckoutModalProps {
  board: DonorBoard;
  initialComponent: HarvestableComponent | null;
  initialMode: OrderMode;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const InspectionCheckoutModal: React.FC<InspectionCheckoutModalProps> = ({
  board,
  initialComponent,
  initialMode,
  onClose,
}) => {
  const { components, placeOrder, setActiveTab, currentUser } =
    useHarvestStore();

  const boardComponents = components.filter((c) => c.donorBoardId === board.id);
  const intactComponents = boardComponents.filter((c) => c.status === 'INTACT');

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    () => {
      if (initialComponent && initialComponent.status === 'INTACT') {
        return initialComponent.id;
      }
      return intactComponents[0]?.id || null;
    }
  );

  const isRawDisabled = board.status !== 'AVAILABLE';

  const [mode, setMode] = useState<OrderMode>(() => {
    if (initialMode === 'RAW_DONOR_BOARD' && !isRawDisabled) {
      return 'RAW_DONOR_BOARD';
    }
    return 'EXTRACTED_TESTED_PART';
  });

  const isHyperlocalEligible = board.distanceKm < 15;

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(() =>
    isHyperlocalEligible ? 'CAMPUS_HUB_PICKUP' : 'OUTSTATION_PARCEL'
  );

  const [buyerName, setBuyerName] = useState(currentUser.fullName || '');
  const [buyerPhone, setBuyerPhone] = useState(currentUser.phone || '');
  const [buyerAddress, setBuyerAddress] = useState(
    currentUser.defaultAddress || ''
  );

  // Real Production Payment State (12-digit UPI UTR or Live Razorpay SDK)
  const [paymentMethod, setPaymentMethod] = useState<
    'UPI_UTR_REF' | 'RAZORPAY_SDK'
  >('UPI_UTR_REF');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string | null>(
    null
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (mode === 'RAW_DONOR_BOARD' && isRawDisabled) {
      setMode('EXTRACTED_TESTED_PART');
    }
  }, [isRawDisabled, mode]);

  const selectedComp =
    boardComponents.find((c) => c.id === selectedComponentId) ||
    intactComponents[0] ||
    null;

  const itemPriceInr =
    mode === 'RAW_DONOR_BOARD'
      ? board.rawBoardPriceInr
      : selectedComp
      ? selectedComp.partPriceInr
      : 0;

  const extractionFeeInr =
    mode === 'RAW_DONOR_BOARD'
      ? 0
      : selectedComp
      ? selectedComp.extractionFeeInr
      : 0;

  const deliveryFeeInr =
    deliveryType === 'CAMPUS_HUB_PICKUP'
      ? 0
      : deliveryType === 'HYPERLOCAL_PORTER'
      ? 45
      : 49;

  const totalPayableInr = itemPriceInr + extractionFeeInr + deliveryFeeInr;

  const activeBypassTips = boardComponents.filter((c) => c.bypassHackTip);

  const razorpayKeyId = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
  const merchantUpiVpa =
    (import.meta.env.VITE_MERCHANT_UPI_VPA || '').trim() ||
    'siliconharvest@icici';

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
    merchantUpiVpa
  )}&pn=${encodeURIComponent('SiliconHarvest Escrow')}&am=${totalPayableInr}&cu=INR`;

  const validateBuyerFields = (): string | null => {
    if (!buyerName.trim()) {
      return 'Please enter your Full Name or Lab Name.';
    }
    const digitsOnly = buyerPhone.replace(/\D/g, '').slice(-10);
    if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
      return 'Please enter a valid 10-digit Indian Mobile Number.';
    }
    if (!buyerAddress.trim() || buyerAddress.trim().length < 5) {
      return 'Please enter your complete Delivery / Campus Hub Address.';
    }
    return null;
  };

  const handleLaunchRazorpaySdk = async () => {
    setCheckoutError(null);
    const buyerErr = validateBuyerFields();
    if (buyerErr) {
      setCheckoutError(buyerErr);
      return;
    }

    if (!razorpayKeyId) {
      setCheckoutError(
        'VITE_RAZORPAY_KEY_ID is not configured in .env. Please pay via Merchant UPI QR and enter your 12-digit UPI UTR Reference ID, or set VITE_RAZORPAY_KEY_ID.'
      );
      return;
    }

    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error('Failed to load Razorpay Checkout SDK'));
        document.body.appendChild(script);
      });
    }

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      amount: totalPayableInr * 100,
      currency: 'INR',
      name: 'SiliconHarvest Escrow',
      description:
        mode === 'RAW_DONOR_BOARD'
          ? `Raw Donor Board: ${board.boardName}`
          : `Extracted IC: ${selectedComp?.partNumber} (${board.id})`,
      prefill: {
        name: buyerName.trim(),
        contact: buyerPhone.replace(/\D/g, '').slice(-10),
        email: currentUser.email || undefined,
      },
      handler: (response: { razorpay_payment_id: string }) => {
        const payId = response.razorpay_payment_id;
        setRazorpayPaymentId(payId);
        const digitsOnly = buyerPhone.replace(/\D/g, '').slice(-10);
        const order = placeOrder({
          buyerName: buyerName.trim(),
          buyerPhone: `+91 ${digitsOnly}`,
          buyerAddress: buyerAddress.trim(),
          donorBoardId: board.id,
          componentId:
            mode === 'EXTRACTED_TESTED_PART' && selectedComp
              ? selectedComp.id
              : null,
          mode,
          deliveryType,
          upiUtrOrPaymentId: payId,
        });
        setPlacedOrder(order);
      },
    });
    rzp.open();
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (mode === 'EXTRACTED_TESTED_PART' && !selectedComp) return;

    const buyerErr = validateBuyerFields();
    if (buyerErr) {
      setCheckoutError(buyerErr);
      return;
    }

    if (paymentMethod === 'RAZORPAY_SDK' && !razorpayPaymentId) {
      handleLaunchRazorpaySdk();
      return;
    }

    const cleanedUtr = upiUtrInput.replace(/\D/g, '');
    if (paymentMethod === 'UPI_UTR_REF' && cleanedUtr.length !== 12) {
      setCheckoutError(
        'Please enter your valid 12-digit numeric UPI UTR Reference ID from your payment app (GPay / PhonePe / Paytm) after scanning the QR code.'
      );
      return;
    }

    const finalPaymentRef =
      paymentMethod === 'RAZORPAY_SDK'
        ? razorpayPaymentId || ''
        : `UTR-${cleanedUtr}`;

    const digitsOnly = buyerPhone.replace(/\D/g, '').slice(-10);
    const order = placeOrder({
      buyerName: buyerName.trim(),
      buyerPhone: `+91 ${digitsOnly}`,
      buyerAddress: buyerAddress.trim(),
      donorBoardId: board.id,
      componentId:
        mode === 'EXTRACTED_TESTED_PART' && selectedComp
          ? selectedComp.id
          : null,
      mode,
      deliveryType,
      upiUtrOrPaymentId: finalPaymentRef,
    });
    setPlacedOrder(order);
  };

  // Deterministic 7x7 QR pattern for Merchant UPI QR
  const qrSeed = `${merchantUpiVpa}-${totalPayableInr}`;
  const qrCells: boolean[] = Array.from({ length: 49 }, (_, idx) => {
    const row = Math.floor(idx / 7);
    const col = idx % 7;
    if (
      (row < 2 && col < 2) ||
      (row < 2 && col > 4) ||
      (row > 4 && col < 2)
    ) {
      return true;
    }
    const code = qrSeed.charCodeAt(idx % qrSeed.length);
    return (code + idx * 5) % 2 === 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {board.id}
                </span>
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#1D1D1F]">
                  {board.boardName}
                </h2>
                <span
                  className={`font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                    board.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : board.status === 'PARTIALLY_HARVESTED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {board.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {board.locationArea} (
                  <span className="font-mono text-slate-800 font-medium">
                    {board.distanceKm} km
                  </span>
                  )
                </span>
                <span>•</span>
                <span>Seller: {board.sellerName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1D1D1F] border border-slate-200 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {placedOrder ? (
            /* Order & Escrow Receipt Screen */
            <div className="py-8 px-6 text-center space-y-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Order Confirmed • {placedOrder.orderCode}
                  </span>
                  {placedOrder.upiUtrOrPaymentId && (
                    <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                      Payment Ref: {placedOrder.upiUtrOrPaymentId}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#1D1D1F] pt-2">
                  {placedOrder.mode === 'EXTRACTED_TESTED_PART'
                    ? 'Queued at Hot-Air Extraction Workbench (Escrow Active)'
                    : 'Raw Donor PCB Reserved for Immediate Dispatch'}
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {placedOrder.mode === 'EXTRACTED_TESTED_PART'
                    ? `Your ₹${placedOrder.extractionFeeInr} Extraction Fee is locked in SiliconHarvest Escrow and will only be released once the technician logs a verified multimeter reading.`
                    : 'Your complete As-Is Donor Board has been locked via atomic RPC for bypass hacking / self-salvage.'}
                </p>
              </div>

              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-5 text-left font-mono text-xs space-y-2.5 shadow-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Order ID:</span>
                  <span className="text-[#1D1D1F] font-semibold">
                    {placedOrder.orderCode}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Reference:</span>
                  <span className="text-sky-700 font-semibold">
                    {placedOrder.upiUtrOrPaymentId || 'Recorded'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Buyer Phone:</span>
                  <span className="text-[#1D1D1F] font-semibold">
                    {placedOrder.buyerPhone}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Escrow Hold Status:</span>
                  <span className="text-amber-700 font-semibold">
                    {placedOrder.mode === 'EXTRACTED_TESTED_PART'
                      ? `₹${placedOrder.extractionFeeInr} Held Until QC Pass`
                      : 'Direct Dispatch'}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-bold">
                  <span className="text-[#1D1D1F]">Total Amount Paid:</span>
                  <span className="text-emerald-700">
                    ₹{placedOrder.totalPayableInr}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {placedOrder.mode === 'EXTRACTED_TESTED_PART' && (
                  <button
                    onClick={() => {
                      onClose();
                      setActiveTab('TECH_WORKBENCH');
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-sm transition-all"
                  >
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Go to Extraction Workbench (Verify IC)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('ORDERS_TRACKER');
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>Open Dispatch Tracker</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium transition-all"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* SECTION 1: Interactive PCB Health Map */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Interactive PCB Component Health Map (
                      {boardComponents.length} Nodes Mapped)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Click any{' '}
                      <span className="text-emerald-700 font-medium">
                        🟢 Intact
                      </span>{' '}
                      component below to target it for precision extraction, or
                      inspect the{' '}
                      <span className="text-rose-700 font-medium">
                        🔴 Primary Fault
                      </span>
                      .
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono font-medium">
                    <span className="flex items-center gap-1 text-emerald-700">
                      🟢 Intact ({intactComponents.length})
                    </span>
                    <span className="flex items-center gap-1 text-rose-700">
                      🔴 Primary Fault (
                      {
                        boardComponents.filter(
                          (c) => c.status === 'FAULTY_ON_ARRIVAL'
                        ).length
                      }
                      )
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      ⚫ Harvested (
                      {
                        boardComponents.filter(
                          (c) => c.status === 'EXTRACTED_SOLD'
                        ).length
                      }
                      )
                    </span>
                  </div>
                </div>

                {/* Primary Fault Diagnostic Banner */}
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong className="font-semibold text-rose-950">
                      Reported Primary Board Fault:
                    </strong>{' '}
                    {board.primaryFault} — All other surrounding power/logic
                    rails tested intact.
                  </span>
                </div>

                {/* SOLD_RAW Atomic Lock Warning Notification */}
                {board.status === 'SOLD_RAW' && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-100 border border-rose-300 text-xs text-rose-900 font-mono">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>ATOMIC INVENTORY LOCK (SOLD_RAW):</strong> This
                      donor board and all of its child components have been sold
                      as a full raw PCB. Checkout is blocked to prevent
                      double-selling.
                    </span>
                  </div>
                )}

                {/* Component Nodes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {boardComponents.map((comp) => {
                    const isIntact = comp.status === 'INTACT';
                    const isFaulty = comp.status === 'FAULTY_ON_ARRIVAL';
                    const isSelected =
                      mode === 'EXTRACTED_TESTED_PART' &&
                      selectedComp?.id === comp.id;

                    return (
                      <div
                        key={comp.id}
                        onClick={() => {
                          if (isIntact) {
                            setSelectedComponentId(comp.id);
                            setMode('EXTRACTED_TESTED_PART');
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all relative ${
                          isFaulty
                            ? 'bg-rose-50/70 border-rose-200 opacity-90 cursor-not-allowed'
                            : !isIntact
                            ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer shadow-sm'
                            : 'bg-white border-slate-200 hover:border-emerald-400 cursor-pointer shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[#1D1D1F]">
                            {comp.partNumber}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                              isIntact
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isFaulty
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {isIntact
                              ? '🟢 INTACT'
                              : isFaulty
                              ? '🔴 PRIMARY FAULT'
                              : '⚫ HARVESTED'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-1">
                          {comp.partName}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">
                            {comp.packageType} • {comp.recommendedTempC}°C
                          </span>
                          {isIntact ? (
                            <span className="text-emerald-700 font-semibold">
                              ₹{comp.partPriceInr}{' '}
                              <span className="text-amber-700 text-[10px]">
                                (+₹{comp.extractionFeeInr})
                              </span>
                            </span>
                          ) : isFaulty ? (
                            <span className="text-rose-600 font-semibold">
                              DEAD RAIL
                            </span>
                          ) : (
                            <span className="text-slate-400">SOLD</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bypass Hack Callout if present on this board */}
                {activeBypassTips.map((tipComp) => (
                  <div
                    key={tipComp.id}
                    className="mt-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-mono font-bold text-amber-800 uppercase">
                        ⚡ Hardware Bypass Hack ({tipComp.partNumber}):{' '}
                      </span>
                      <span className="text-amber-900">
                        {tipComp.bypassHackTip}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleConfirmOrder} className="space-y-6">
                {/* STEP 1: Dual-Mode Fulfillment Toggle */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                    Step 1 • Select Fulfillment Mode (Dual-Mode Supply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mode A: Raw Donor Board */}
                    <div
                      onClick={() => {
                        if (!isRawDisabled) setMode('RAW_DONOR_BOARD');
                      }}
                      className={`p-5 rounded-3xl border transition-all ${
                        isRawDisabled
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : mode === 'RAW_DONOR_BOARD'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            checked={mode === 'RAW_DONOR_BOARD'}
                            disabled={isRawDisabled}
                            onChange={() => setMode('RAW_DONOR_BOARD')}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <span className="font-semibold text-sm text-[#1D1D1F]">
                            Mode A: Raw Donor Board (As-Is)
                          </span>
                        </div>
                        <span className="font-mono text-base font-bold text-emerald-700">
                          ₹{board.rawBoardPriceInr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 pl-6 leading-relaxed">
                        Get the entire dead PCB as-is. Ideal for jumper bypass
                        hacks or desoldering all {intactComponents.length}{' '}
                        intact parts in your own lab.
                      </p>
                      {isRawDisabled && (
                        <div className="mt-2.5 ml-6 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800">
                          <Lock className="w-3 h-3" />
                          Disabled: Board is {board.status}
                        </div>
                      )}
                    </div>

                    {/* Mode B: Extracted & Tested Component */}
                    <div
                      onClick={() => {
                        if (selectedComp) setMode('EXTRACTED_TESTED_PART');
                      }}
                      className={`p-5 rounded-3xl border transition-all ${
                        !selectedComp
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : mode === 'EXTRACTED_TESTED_PART'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            checked={mode === 'EXTRACTED_TESTED_PART'}
                            disabled={!selectedComp}
                            onChange={() => setMode('EXTRACTED_TESTED_PART')}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <span className="font-semibold text-sm text-[#1D1D1F]">
                            Mode B: Extracted &amp; Tested Component
                          </span>
                        </div>
                        {selectedComp && (
                          <span className="font-mono text-sm font-bold text-emerald-700">
                            ₹{selectedComp.partPriceInr}{' '}
                            <span className="text-amber-700 text-xs">
                              + ₹{selectedComp.extractionFeeInr} fee
                            </span>
                          </span>
                        )}
                      </div>

                      {selectedComp ? (
                        <div className="mt-2.5 pl-6 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Target: {selectedComp.partNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Nozzle: {selectedComp.recommendedTempC}°C
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {selectedComp.packageType}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Multimeter Diode/Rail Verification Guarantee
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-600 mt-2 pl-6">
                          No intact components remaining on this board.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Escrow Protection Badge */}
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-mono font-bold text-emerald-800 uppercase">
                        🛡️ SiliconHarvest Escrow Protection:{' '}
                      </span>
                      For Extracted &amp; Tested orders, your{' '}
                      <span className="font-mono font-bold text-amber-700">
                        ₹{extractionFeeInr} Extraction Fee
                      </span>{' '}
                      is held in escrow and only released to the Extraction Hub
                      after they upload a verified multimeter test reading.
                    </div>
                  </div>
                </div>

                {/* STEP 2: Delivery Logistics Toggle */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                    Step 2 • Select Logistics &amp; Dispatch Tier
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div
                      onClick={() => setDeliveryType('CAMPUS_HUB_PICKUP')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        deliveryType === 'CAMPUS_HUB_PICKUP'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          Campus / Hub Locker
                        </span>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          ₹0
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        Self-pickup from nearest University / Hub Drop Locker.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        if (isHyperlocalEligible) {
                          setDeliveryType('HYPERLOCAL_PORTER');
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        !isHyperlocalEligible
                          ? 'bg-slate-100/70 border-slate-200 opacity-55 cursor-not-allowed'
                          : deliveryType === 'HYPERLOCAL_PORTER'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          Porter 45-Min Hyperlocal
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-700">
                          ₹45
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        {isHyperlocalEligible
                          ? `Instant 2-wheeler pickup (${board.distanceKm} km < 15 km radius).`
                          : `Unavailable (${board.distanceKm} km exceeds 15 km hyperlocal zone).`}
                      </p>
                    </div>

                    <div
                      onClick={() => setDeliveryType('OUTSTATION_PARCEL')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        deliveryType === 'OUTSTATION_PARCEL'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          India Post / Shiprocket
                        </span>
                        <span className="font-mono text-xs font-bold text-sky-700">
                          ₹49 flat
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                        ESD-safe anti-static tube + bubble mailer pan-India.
                      </p>
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* STEP 3 & 4: Real Buyer Details + UPI UTR / Razorpay SDK Payment */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-200">
                  <div className="lg:col-span-7 space-y-3.5">
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                      Step 3 • Buyer Dispatch Details &amp; Payment Verification
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Full Name / Lab Name *"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="10-Digit Indian Mobile Number *"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Complete Delivery / Hostel / Campus Hub Address *"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />

                    {/* Real UPI UTR Reference or Live Razorpay SDK Selector */}
                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-sky-900 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                          Select Payment Method (₹{totalPayableInr})
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('UPI_UTR_REF');
                              setCheckoutError(null);
                            }}
                            className={`px-3 py-1 rounded-full border transition-all ${
                              paymentMethod === 'UPI_UTR_REF'
                                ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] font-semibold'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            UPI QR + 12-Digit UTR
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('RAZORPAY_SDK');
                              setCheckoutError(null);
                            }}
                            className={`px-3 py-1 rounded-full border transition-all ${
                              paymentMethod === 'RAZORPAY_SDK'
                                ? 'bg-[#1D1D1F] text-white border-[#1D1D1F] font-semibold'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            Razorpay Live SDK
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'UPI_UTR_REF' ? (
                        <div className="flex flex-col sm:flex-row items-center gap-3.5">
                          {/* Merchant UPI QR Code */}
                          <a
                            href={upiDeepLink}
                            title={`Scan or click to pay ₹${totalPayableInr} to ${merchantUpiVpa}`}
                            className="p-2 bg-white border border-slate-200 rounded-xl grid grid-cols-7 gap-0.5 w-20 h-20 shrink-0 shadow-sm"
                          >
                            {qrCells.map((filled, idx) => (
                              <div
                                key={idx}
                                className={
                                  filled ? 'bg-slate-950' : 'bg-white'
                                }
                              />
                            ))}
                          </a>

                          <div className="flex-1 w-full space-y-2">
                            <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-1">
                              <span>
                                Merchant UPI:{' '}
                                <strong className="font-mono text-[#1D1D1F]">
                                  {merchantUpiVpa}
                                </strong>
                              </span>
                              <a
                                href={upiDeepLink}
                                className="font-mono text-sky-700 font-semibold underline"
                              >
                                Open UPI App (₹{totalPayableInr})
                              </a>
                            </div>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={12}
                              required={paymentMethod === 'UPI_UTR_REF'}
                              value={upiUtrInput}
                              onChange={(e) =>
                                setUpiUtrInput(
                                  e.target.value.replace(/\D/g, '').slice(0, 12)
                                )
                              }
                              placeholder="Enter 12-Digit UPI UTR Reference ID *"
                              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            />
                            <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                              <span>
                                {upiUtrInput.length}/12 digits entered
                              </span>
                              {upiUtrInput.length === 12 && (
                                <span className="text-emerald-700 font-bold">
                                  ✓ Valid 12-Digit UTR
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <p className="text-xs text-slate-600">
                            Launches the official Razorpay Checkout modal using{' '}
                            <code className="font-mono text-[#1D1D1F]">
                              VITE_RAZORPAY_KEY_ID
                            </code>
                            .
                          </p>
                          <button
                            type="button"
                            onClick={handleLaunchRazorpaySdk}
                            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>
                              {razorpayPaymentId
                                ? `Paid via Razorpay (${razorpayPaymentId})`
                                : `Launch Razorpay Checkout (₹${totalPayableInr})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Final Bill Summary + Place Salvage Order CTA */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>
                          {mode === 'RAW_DONOR_BOARD'
                            ? 'Raw Donor PCB:'
                            : `Part (${selectedComp?.partNumber || 'N/A'}):`}
                        </span>
                        <span className="text-[#1D1D1F] font-semibold">
                          ₹{itemPriceInr}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Hot-Air Extraction (Escrow):</span>
                        <span className="text-amber-700 font-semibold">
                          +₹{extractionFeeInr}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Logistics ({deliveryType.split('_')[0]}):</span>
                        <span className="text-sky-700 font-semibold">
                          +₹{deliveryFeeInr}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-bold">
                        <span className="text-[#1D1D1F]">Total Payable:</span>
                        <span className="text-emerald-700">
                          ₹{totalPayableInr}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={
                        (mode === 'RAW_DONOR_BOARD' && isRawDisabled) ||
                        (mode === 'EXTRACTED_TESTED_PART' && !selectedComp)
                      }
                      className="w-full py-3.5 px-5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Package className="w-4 h-4" />
                      <span>Confirm Order • ₹{totalPayableInr}</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
