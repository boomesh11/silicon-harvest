import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Zap,
  Truck,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import {
  DonorBoard,
  HarvestableComponent,
  OrderMode,
  Order,
} from '../types/harvest';
import { useHarvestStore } from '../store/useHarvestStore';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';
import {
  LOGISTICS_PARTNERS,
  LogisticsPartnerKey,
  calculateOrderBreakdown,
  findScopedAcceptedBargain,
} from '../config/pricingEngine';

interface InspectionCheckoutModalProps {
  board: DonorBoard;
  initialComponent: HarvestableComponent | null;
  initialMode: OrderMode;
  onClose: () => void;
}

export const InspectionCheckoutModal: React.FC<InspectionCheckoutModalProps> = ({
  board,
  initialComponent,
  initialMode,
  onClose,
}) => {
  const { components, placeOrder, setActiveTab, currentUser, bargainOffers } =
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

  const isOwnListing = Boolean(
    board.sellerId && board.sellerId === currentUser.id
  );
  const isReadyToUseModule = board.hardwareMode === 'READY_TO_USE';
  const isRawDisabled =
    board.status !== 'AVAILABLE' || board.hardwareMode === 'READY_TO_USE';
  const isExtractedDisabled =
    board.hardwareMode === 'SOLDERED_RAW' || intactComponents.length === 0;

  const [mode, setMode] = useState<OrderMode>(() => {
    if (board.hardwareMode === 'READY_TO_USE') {
      return 'EXTRACTED_TESTED_PART';
    }
    if (board.hardwareMode === 'SOLDERED_RAW' && !isRawDisabled) {
      return 'RAW_DONOR_BOARD';
    }
    if (initialMode === 'RAW_DONOR_BOARD' && !isRawDisabled) {
      return 'RAW_DONOR_BOARD';
    }
    if (!isExtractedDisabled) {
      return 'EXTRACTED_TESTED_PART';
    }
    return 'RAW_DONOR_BOARD';
  });

  // Buyer Profile & Location
  const [buyerName, setBuyerName] = useState(currentUser.fullName || '');
  const [buyerPhone, setBuyerPhone] = useState(
    currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : ''
  );
  const [buyerAddress, setBuyerAddress] = useState(
    currentUser.defaultAddress || ''
  );
  const [buyerState, setBuyerState] = useState(
    currentUser.state || 'Tamil Nadu'
  );
  const [buyerDistrict, setBuyerDistrict] = useState(
    currentUser.district || 'Chennai'
  );
  const [buyerPincode, setBuyerPincode] = useState(
    currentUser.pincode || '600001'
  );

  const sellerDistrict = board.sellerDistrict || board.locationCity || 'Chennai';
  const isSameDistrict =
    buyerDistrict.toLowerCase().trim() === sellerDistrict.toLowerCase().trim();

  // Selected Logistics Partner
  const [logisticsPartner, setLogisticsPartner] = useState<LogisticsPartnerKey>(
    () => (isSameDistrict ? 'RAPIDO' : 'INDIA_POST')
  );

  // Update logistics selection when buyer district changes
  useEffect(() => {
    if (isSameDistrict) {
      if (logisticsPartner === 'INDIA_POST' || logisticsPartner === 'DELHIVERY') {
        setLogisticsPartner('RAPIDO');
      }
    } else {
      if (
        logisticsPartner === 'RAPIDO' ||
        logisticsPartner === 'DUNZO' ||
        logisticsPartner === 'PORTER'
      ) {
        setLogisticsPartner('INDIA_POST');
      }
    }
  }, [isSameDistrict, logisticsPartner]);

  const [paymentMethod, setPaymentMethod] = useState<'UPI_INSTANT' | 'COD_ON_PICKUP'>('UPI_INSTANT');
  const [upiUtrInput, setUpiUtrInput] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (mode === 'RAW_DONOR_BOARD' && isRawDisabled && !isExtractedDisabled) {
      setMode('EXTRACTED_TESTED_PART');
    } else if (
      mode === 'EXTRACTED_TESTED_PART' &&
      isExtractedDisabled &&
      !isRawDisabled
    ) {
      setMode('RAW_DONOR_BOARD');
    }
  }, [isRawDisabled, isExtractedDisabled, mode]);

  const selectedComp =
    boardComponents.find((c) => c.id === selectedComponentId) ||
    intactComponents[0] ||
    null;

  // Single Source of Truth Pricing & Scoped Bargain Calculation
  const isPro = Boolean(currentUser.isProMember);
  const partnerInfo = LOGISTICS_PARTNERS[logisticsPartner];

  const breakdown = calculateOrderBreakdown({
    board,
    component: selectedComp,
    mode,
    logisticsPartner,
    isSameDistrict,
    isProMember: isPro,
    buyerId: currentUser.id,
    bargainOffers,
  });

  const itemPriceInr = breakdown.itemPriceInr;
  const bargainDiscountInr = breakdown.bargainDiscountInr;
  const extractionFeeInr = breakdown.extractionFeeInr;
  const platformCommissionInr = breakdown.platformCommissionInr;
  const deliveryFeeInr = breakdown.deliveryFeeInr;
  const deliveryType = breakdown.deliveryType;
  const totalPayableInr = breakdown.totalPayableInr;

  const activeBypassTips = boardComponents.filter((c) => c.bypassHackTip);

  const merchantUpiVpa = '7200255069@upi';
  const secondaryUpiVpa = 'rkboomesh@okaxis';

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(
    merchantUpiVpa
  )}&pn=${encodeURIComponent('Boomesh R K - SiliconHarvest')}&am=${totalPayableInr}&cu=INR&tn=${encodeURIComponent(
    'Hardware Salvage Checkout'
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  const availableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === buyerState)?.districts || [];

  const handleStateChange = (newState: string) => {
    setBuyerState(newState);
    const newDistricts =
      INDIAN_STATES_DISTRICTS.find((s) => s.state === newState)?.districts || [];
    if (newDistricts.length > 0) {
      setBuyerDistrict(newDistricts[0]);
    }
  };

  const validateBuyerFields = (): string | null => {
    if (!buyerName.trim()) {
      return 'Please enter your Full Name.';
    }
    const digitsOnly = buyerPhone.replace(/\D/g, '').slice(-10);
    if (digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
      return 'Please enter a valid 10-digit Indian Mobile Number.';
    }
    if (!buyerAddress.trim() || buyerAddress.trim().length < 5) {
      return 'Please enter your complete Street / College / Shop delivery address.';
    }
    return null;
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (isOwnListing) {
      setCheckoutError('Self-Purchase Guard: You cannot purchase your own listing.');
      return;
    }

    if (mode === 'EXTRACTED_TESTED_PART' && !selectedComp) {
      setCheckoutError('Please select a working component from the board health map.');
      return;
    }

    const buyerErr = validateBuyerFields();
    if (buyerErr) {
      setCheckoutError(buyerErr);
      return;
    }

    const cleanedUtr = upiUtrInput.replace(/\D/g, '');
    if (paymentMethod === 'UPI_INSTANT' && cleanedUtr.length !== 12) {
      setCheckoutError(
        'Please enter the valid 12-digit numeric UPI UTR Reference ID from GPay / PhonePe / Paytm, or select Cash / UPI on Pickup (COD).'
      );
      return;
    }

    const resolvedPaymentRef =
      paymentMethod === 'COD_ON_PICKUP'
        ? 'COD-PAY-ON-PICKUP'
        : `UTR-${cleanedUtr}`;

    const digitsOnly = buyerPhone.replace(/\D/g, '').slice(-10);
    const order = placeOrder({
      buyerName: buyerName.trim(),
      buyerPhone: `+91 ${digitsOnly}`,
      buyerAddress: buyerAddress.trim(),
      buyerState,
      buyerDistrict,
      buyerPincode,
      donorBoardId: board.id,
      componentId:
        mode === 'EXTRACTED_TESTED_PART' && selectedComp
          ? selectedComp.id
          : null,
      mode,
      deliveryType,
      logisticsPartner: partnerInfo.label,
      platformCommissionInr,
      deliveryFeeInr,
      upiUtrOrPaymentId: resolvedPaymentRef,
      isProOrder: isPro,
      bargainDiscountInr,
      redeemedBargainId: breakdown.matchedBargain?.id,
      totalPriceInr: totalPayableInr,
    });

    setPlacedOrder(order);
  };

  const [copiedVpa, setCopiedVpa] = useState(false);
  const handleCopyVpa = () => {
    navigator.clipboard?.writeText(merchantUpiVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative w-full max-w-4xl bg-white backdrop-blur-3xl border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Mobile Drag Handle Bar */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0">
              {board.imageUrl ? (
                <img
                  src={board.imageUrl}
                  alt={board.boardName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Cpu className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {board.id}
                </span>
                <h2 className="text-base sm:text-xl font-semibold tracking-tight text-[#0F172A] truncate font-display">
                  {board.boardName}
                </h2>
                <span
                  className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full border ${
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-700 truncate">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  Hub: {sellerDistrict}, {board.sellerState || 'Tamil Nadu'}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline truncate">Seller: {board.sellerName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Checkout"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0F172A] border border-slate-200 flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto overflow-x-hidden overscroll-contain space-y-5">
          {placedOrder ? (
            /* Order Receipt */
            <div className="py-8 px-6 text-center space-y-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Order Confirmed • {placedOrder.orderCode}
                  </span>
                  <span className="font-mono text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                    Logistics: {placedOrder.logisticsPartner || 'Rapido Bike Parcel'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#0F172A] pt-2 font-display">
                  {placedOrder.mode === 'EXTRACTED_TESTED_PART'
                    ? 'Queued at Workbench (Escrow Active)'
                    : 'Raw Assembly Reserved for Dispatch'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {placedOrder.mode === 'EXTRACTED_TESTED_PART'
                    ? (placedOrder.extractionFeeInr ?? 0) > 0
                      ? `Your ₹${placedOrder.extractionFeeInr ?? 0} QC fee is safely held in escrow and released only after the technician tests multimeter continuity & diode drop.`
                      : 'Your ready-to-use tested module has been verified and locked for dispatch.'
                    : 'Your raw assembly has been atomically locked for self-salvage or hardware bypass.'}
                </p>
              </div>

              <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-left font-mono text-xs space-y-2 shadow-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Order Reference:</span>
                  <span className="text-[#0F172A] font-semibold">{placedOrder.orderCode}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Buyer District:</span>
                  <span className="text-slate-800 font-semibold">{placedOrder.buyerDistrict}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Item Base Price:</span>
                  <span className="text-slate-900 font-semibold">₹{placedOrder.itemPriceInr}</span>
                </div>
                {(placedOrder.bargainDiscountInr ?? 0) > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Bargain Discount Applied:</span>
                    <span className="font-semibold">-₹{placedOrder.bargainDiscountInr ?? 0}</span>
                  </div>
                )}
                {placedOrder.mode === 'EXTRACTED_TESTED_PART' && (
                  <div className="flex justify-between text-slate-500">
                    <span>Extraction & Multimeter QC Fee:</span>
                    <span className="text-amber-700 font-semibold">
                      ₹{placedOrder.extractionFeeInr ?? 0}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>
                    Platform Fee ({placedOrder.isProOrder ? 'Pro ⭐ ₹0 Free' : '5%'}):
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    ₹{placedOrder.platformCommissionInr ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Partner:</span>
                  <span className="text-[#0F172A] font-semibold">
                    {placedOrder.logisticsPartner} (₹{placedOrder.deliveryFeeInr ?? 0})
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-[#0F172A]">Total Amount Payable:</span>
                  <span className="text-emerald-700">₹{placedOrder.totalPayableInr}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Founder Support: Boomesh R K</span>
                  <span className="text-emerald-700 font-semibold">+91 7200255069 • rkboomesh@gmail.com</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('ORDERS_TRACKER');
                  }}
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs active:scale-95 transition-all shadow-sm"
                >
                  <Truck className="w-4 h-4" />
                  <span>Open Orders & Dispatch Tracker</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold active:scale-95 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Photo & PCB Health Map */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      PCB Sub-Components & Health Map ({boardComponents.length} Mapped)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {board.hardwareMode === 'SOLDERED_RAW' ? (
                        <span>
                          This listing is offered as a{' '}
                          <strong className="text-slate-900">Soldered Raw Donor Assembly</strong>{' '}
                          for self-salvage.
                        </span>
                      ) : (
                        <span>
                          Click any <span className="text-emerald-700 font-medium">🟢 Working</span>{' '}
                          component below to target it, or inspect the{' '}
                          <span className="text-rose-700 font-medium">🔴 Fault</span>.
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono font-medium">
                    <span className="text-emerald-700">
                      🟢 Available ({intactComponents.length})
                    </span>
                    <span className="text-rose-700">
                      🔴 Fault (
                      {boardComponents.filter((c) => c.status === 'FAULTY_ON_ARRIVAL').length})
                    </span>
                  </div>
                </div>

                {/* Primary Fault Banner */}
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Reported Primary Fault:</strong> {board.primaryFault} — All other
                    sub-components tested intact.
                  </span>
                </div>

                {/* Sub-Components Grid */}
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
                          if (isIntact && !isExtractedDisabled) {
                            setSelectedComponentId(comp.id);
                            setMode('EXTRACTED_TESTED_PART');
                          }
                        }}
                        className={`min-h-[64px] p-3.5 rounded-2xl border transition-all relative ${
                          isFaulty
                            ? 'bg-rose-50/70 border-rose-200 opacity-90 cursor-not-allowed'
                            : !isIntact
                            ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : isExtractedDisabled
                            ? 'bg-white border-slate-200 opacity-90'
                            : isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer shadow-sm active:scale-98'
                            : 'bg-white border-slate-200 hover:border-emerald-400 cursor-pointer shadow-sm active:scale-98'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#0F172A]">
                            {comp.partNumber}
                          </span>
                          <span
                            className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                              isIntact
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {isIntact ? '🟢 WORKING' : '🔴 FAULT'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                          {comp.partName}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500">{comp.packageType}</span>
                          {isIntact ? (
                            <span className="text-emerald-700 font-bold">
                              ₹{comp.partPriceInr}
                              {!isReadyToUseModule && (
                                <span className="text-amber-700 text-[10px] font-normal">
                                  {' '}
                                  (+₹{comp.extractionFeeInr} QC)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">DEAD</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bypass Hack Tip if available */}
                {activeBypassTips.map((tipComp) => (
                  <div
                    key={tipComp.id}
                    className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono uppercase font-bold text-amber-800">
                        ⚡ Hardware Bypass Hack ({tipComp.partNumber}):{' '}
                      </strong>
                      <span>{tipComp.bypassHackTip}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHECKOUT FORM */}
              <form onSubmit={handleConfirmOrder} className="space-y-6">
                {checkoutError && (
                  <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Step 1: Soldered vs Desoldered Choice */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                    Step 1 • Choose Mode: Soldered (Raw Board) vs. Desoldered (Tested Component)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Option A: Soldered Raw Board */}
                    <div
                      onClick={() => {
                        if (!isRawDisabled) setMode('RAW_DONOR_BOARD');
                      }}
                      className={`min-h-[52px] p-4 rounded-2xl border transition-all active:scale-98 ${
                        isRawDisabled
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : mode === 'RAW_DONOR_BOARD'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={mode === 'RAW_DONOR_BOARD'}
                            disabled={isRawDisabled}
                            onChange={() => setMode('RAW_DONOR_BOARD')}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <span className="font-semibold text-xs text-[#0F172A]">
                            Option A: Soldered (Full Raw Assembly)
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-emerald-700">
                          ₹{board.rawBoardPriceInr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 pl-6">
                        Get the complete circuit board as-is. Desoldering fee = ₹0.
                      </p>
                    </div>

                    {/* Option B: Desoldered Tested Part */}
                    <div
                      onClick={() => {
                        if (!isExtractedDisabled && selectedComp) {
                          setMode('EXTRACTED_TESTED_PART');
                        }
                      }}
                      className={`min-h-[52px] p-4 rounded-2xl border transition-all active:scale-98 ${
                        isExtractedDisabled || !selectedComp
                          ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                          : mode === 'EXTRACTED_TESTED_PART'
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={mode === 'EXTRACTED_TESTED_PART'}
                            disabled={isExtractedDisabled || !selectedComp}
                            onChange={() => setMode('EXTRACTED_TESTED_PART')}
                            className="accent-emerald-600 w-4 h-4"
                          />
                          <span className="font-semibold text-xs text-[#0F172A]">
                            {isReadyToUseModule
                              ? 'Option B: Ready-to-Use Tested Module'
                              : 'Option B: Desoldered (Tested Component Only)'}
                          </span>
                        </div>
                        {selectedComp && !isExtractedDisabled ? (
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {isReadyToUseModule
                              ? `₹${selectedComp.partPriceInr} (₹0 QC)`
                              : `₹${selectedComp.partPriceInr} + ₹${selectedComp.extractionFeeInr} QC`}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] font-semibold text-slate-500">
                            Raw Board Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 pl-6">
                        {board.hardwareMode === 'SOLDERED_RAW'
                          ? 'Seller listed this board strictly as an un-desoldered raw assembly.'
                          : isReadyToUseModule
                          ? 'Pre-extracted ready-to-use module with ₹0 extra extraction fee.'
                          : 'Receive ONLY the target working component, desoldered and verified with multimeter test.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Buyer District & Address */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                    Step 2 • Buyer Delivery District & Address
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Buyer Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Karthik Raj"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        10-Digit Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9840012345"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Delivery Pincode
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={buyerPincode}
                        onChange={(e) => setBuyerPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="600025"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        State
                      </label>
                      <select
                        value={buyerState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#0F172A] focus:outline-none"
                      >
                        {INDIAN_STATES_DISTRICTS.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        District (Automatic Logistics Match)
                      </label>
                      <select
                        value={buyerDistrict}
                        onChange={(e) => setBuyerDistrict(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#0F172A] font-semibold focus:outline-none"
                      >
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Complete Street / Campus Address
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Room 102, Kaveri Hostel, IIT Madras Campus"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#0F172A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Step 3: Flexible Logistics Coordination */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                      Step 3 • Logistics Preference &amp; Coordination
                    </label>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      Seller: {sellerDistrict} ➔ Buyer: {buyerDistrict}{' '}
                      ({isSameDistrict ? '🟢 Same District' : '🟠 Outstation Parcel'})
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    SiliconHarvest operates as a flexible coordination network with direct dispatch. Select how you and the seller will coordinate pickup:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Rapido Bike */}
                    <div
                      onClick={() => setLogisticsPartner('RAPIDO')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-left transition-all active:scale-[0.99] ${
                        logisticsPartner === 'RAPIDO'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                            <span>🛵</span>
                            <span>Rapido Bike Delivery (Same District)</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Fast local pickup. Coordinate with nearest Rapido rider or use app.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          Direct Dispatch
                        </span>
                      </div>
                    </div>

                    {/* Porter 2-Wheeler / Mini-Truck */}
                    <div
                      onClick={() => setLogisticsPartner('PORTER')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-left transition-all active:scale-[0.99] ${
                        logisticsPartner === 'PORTER'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                            <span>🚚</span>
                            <span>Porter 2-Wheeler / Mini-Truck</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Best for heavy washing machine PCBs and SMPS units. Book via Porter app.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          Direct Dispatch
                        </span>
                      </div>
                    </div>

                    {/* Dunzo Hyperlocal Courier */}
                    <div
                      onClick={() => setLogisticsPartner('DUNZO')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-left transition-all active:scale-[0.99] ${
                        logisticsPartner === 'DUNZO'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                            <span>📦</span>
                            <span>Dunzo Hyperlocal Courier</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Door-to-door local dispatch.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          Direct Dispatch
                        </span>
                      </div>
                    </div>

                    {/* India Post / Delhivery Express */}
                    <div
                      onClick={() => setLogisticsPartner('INDIA_POST')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-left transition-all active:scale-[0.99] ${
                        logisticsPartner === 'INDIA_POST' || logisticsPartner === 'DELHIVERY'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                            <span>📮</span>
                            <span>India Post / Delhivery Express</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Secure parcel tracking for outstation deliveries.
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                          Parcel Post
                        </span>
                      </div>
                    </div>

                    {/* Self-Pickup / Direct Hand-off */}
                    <div
                      onClick={() => setLogisticsPartner('SELF_PICKUP')}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-left transition-all active:scale-[0.99] sm:col-span-2 ${
                        logisticsPartner === 'SELF_PICKUP'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                            <span>🤝</span>
                            <span>Self-Pickup / Direct Hand-off (₹0)</span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            Pick up directly from seller&apos;s hub or campus location ({sellerDistrict}).
                          </p>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                          ₹0 Free
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: UPI Payment & Itemized Bill */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">
                      Itemized Breakdown
                    </span>
                    <span className="text-xs text-slate-500">
                      Single-Source Escrow Pricing
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {mode === 'RAW_DONOR_BOARD'
                          ? 'Soldered Board Price'
                          : `Extracted Component (${selectedComp?.partNumber})`}
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{itemPriceInr}
                      </span>
                    </div>

                    {bargainDiscountInr > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <span>
                          🤝 Accepted Scoped Bargain Discount (Single-Use)
                        </span>
                        <span className="font-mono">-₹{bargainDiscountInr}</span>
                      </div>
                    )}

                    {mode === 'EXTRACTED_TESTED_PART' && (
                      <div className="flex justify-between text-slate-600">
                        <span>
                          {isReadyToUseModule
                            ? 'Ready-to-Use Module QC Fee'
                            : 'Hot-Air Desoldering & Multimeter QC Fee'}
                        </span>
                        <span className="font-mono font-semibold text-amber-700">
                          ₹{extractionFeeInr}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        <span>Platform Convenience Fee</span>
                        {isPro && (
                          <span className="font-bold text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Pro ⭐ ₹0 Free
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-semibold text-emerald-700">
                        ₹{platformCommissionInr}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Coordination Mode: Selected by Buyer (Direct Dispatch)</span>
                      </span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {logisticsPartner === 'SELF_PICKUP' ? 'Self-Pickup (₹0)' : 'Direct Booking (₹0 Platform Markup)'}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold">
                      <span className="text-[#0F172A]">
                        Total Payable (Inc. GST & Commission):
                      </span>
                      <span className="text-emerald-700 font-mono text-base font-extrabold">
                        ₹{totalPayableInr}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Toggle: UPI Instant vs COD on Pickup */}
                  <div className="pt-2 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI_INSTANT')}
                        className={`min-h-[46px] p-3 rounded-xl border text-left transition-all ${
                          paymentMethod === 'UPI_INSTANT'
                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#0F172A]">
                          ⚡ Instant UPI Escrow Pay
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {merchantUpiVpa} / {secondaryUpiVpa}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD_ON_PICKUP')}
                        className={`min-h-[46px] p-3 rounded-xl border text-left transition-all ${
                          paymentMethod === 'COD_ON_PICKUP'
                            ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#0F172A]">
                          🛵 Cash / UPI on Pickup (COD)
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Pay rider or counter after multimeter check
                        </div>
                      </button>
                    </div>

                    {paymentMethod === 'UPI_INSTANT' ? (
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 text-center">
                          <img
                            src={qrCodeUrl}
                            alt="UPI Payment QR Code"
                            className="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain"
                          />
                          <span className="text-[10px] font-mono text-slate-500 block mt-1 font-semibold">
                            UPI Pay ₹{totalPayableInr}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs w-full">
                          <span className="font-semibold text-slate-800 block">
                            Pay with 1-Click UPI Intent or Scan QR:
                          </span>

                          {/* 1-Click Launch Buttons for GPay, PhonePe, Paytm */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <a
                              href={upiDeepLink}
                              className="min-h-[38px] px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center text-center active:scale-95 transition-all shadow-xs"
                            >
                              Google Pay
                            </a>
                            <a
                              href={upiDeepLink}
                              className="min-h-[38px] px-2 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] flex items-center justify-center text-center active:scale-95 transition-all shadow-xs"
                            >
                              PhonePe
                            </a>
                            <a
                              href={upiDeepLink}
                              className="min-h-[38px] px-2 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center text-center active:scale-95 transition-all shadow-xs"
                            >
                              Paytm
                            </a>
                          </div>

                          <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="truncate">
                              VPA: {merchantUpiVpa} ({secondaryUpiVpa})
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyVpa}
                              className="shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold active:scale-95 transition-all"
                            >
                              {copiedVpa ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-medium text-slate-700">
                                12-Digit UPI UTR Reference *
                              </label>
                              <button
                                type="button"
                                onClick={() => setUpiUtrInput('428192849182')}
                                className="text-[10px] font-bold text-emerald-700 hover:underline"
                              >
                                Auto-Fill Test UTR
                              </button>
                            </div>
                            <input
                              type="text"
                              required={paymentMethod === 'UPI_INSTANT'}
                              maxLength={12}
                              value={upiUtrInput}
                              onChange={(e) => setUpiUtrInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 428192849182"
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold">
                          ✓ Cash / UPI on Pickup (COD) Selected — ₹{totalPayableInr} Payable on Delivery
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Your component or raw donor board will be reserved immediately. Pay ₹{totalPayableInr} via Cash or UPI ({merchantUpiVpa}) upon parcel handoff.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 pb-2 sm:pb-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 active:scale-95 transition-all text-center"
                  >
                    Cancel
                  </button>
                  {isOwnListing ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setActiveTab('SELLER_PORTAL');
                      }}
                      className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Your Listing • Manage in Seller Hub</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Confirm &amp; Place Order (₹{totalPayableInr})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
