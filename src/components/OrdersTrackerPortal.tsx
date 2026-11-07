import React, { useState, useMemo } from 'react';
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
  Crown,
  ShoppingBag,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { Order } from '../types/harvest';
import { EsdLabelModal } from './EsdLabelModal';

export const OrdersTrackerPortal: React.FC = () => {
  const {
    orders,
    boards,
    components,
    bargainOffers,
    acceptBargainOffer,
    rejectBargainOffer,
    cancelBargainOffer,
    currentUser,
    markOrderCompleted,
    updateOrderTracking,
    dispatchOrderBySeller,
    setActiveTab,
    setPendingCheckoutTarget,
  } = useHarvestStore();

  const isOwnerAdmin = Boolean(
    currentUser.isOwnerAdmin || currentUser.role === 'OWNER_ADMIN'
  );

  const [activeTabMode, setActiveTabMode] = useState<
    'PURCHASES' | 'SALES' | 'BARGAINS'
  >('PURCHASES');
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [esdModalOrder, setEsdModalOrder] = useState<Order | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>(
    {}
  );
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);

  // Scoped relational views for currentUser (or full view if Owner Admin is unlocked)
  const myPurchases = useMemo(
    () =>
      orders.filter(
        (o) => isOwnerAdmin || !o.buyerId || o.buyerId === currentUser.id
      ),
    [orders, isOwnerAdmin, currentUser.id]
  );

  const mySales = useMemo(
    () =>
      orders.filter((o) => {
        if (isOwnerAdmin) return true;
        if (o.sellerId && o.sellerId === currentUser.id) return true;
        const parentBoard = boards.find((b) => b.id === o.donorBoardId);
        return Boolean(
          parentBoard?.sellerId && parentBoard.sellerId === currentUser.id
        );
      }),
    [orders, boards, isOwnerAdmin, currentUser.id]
  );

  const myBargainOffers = useMemo(
    () =>
      bargainOffers.filter((offer) => {
        if (isOwnerAdmin) return true;
        if (offer.buyerId === currentUser.id) return true;
        if (offer.sellerId && offer.sellerId === currentUser.id) return true;
        const parentBoard = boards.find((b) => b.id === offer.boardId);
        return Boolean(
          parentBoard?.sellerId && parentBoard.sellerId === currentUser.id
        );
      }),
    [bargainOffers, boards, isOwnerAdmin, currentUser.id]
  );

  const handleSaveTracking = (order: Order) => {
    const val =
      trackingInputs[order.id] !== undefined
        ? trackingInputs[order.id]
        : order.trackingOrPorterLink || '';
    updateOrderTracking(order.id, val);
    setSavedOrderId(order.id);
    setTimeout(() => setSavedOrderId(null), 2500);
  };

  const handleDispatchOrder = (order: Order) => {
    const val =
      trackingInputs[order.id] !== undefined
        ? trackingInputs[order.id]
        : order.trackingOrPorterLink ||
          `${order.logisticsPartner || 'RAPIDO'}-LIVE-${order.orderCode}`;
    dispatchOrderBySeller(order.id, val, 'IN_TRANSIT');
    setSavedOrderId(order.id);
    setTimeout(() => setSavedOrderId(null), 2500);
  };

  const handleDownloadInvoice = (order: Order) => {
    const board = boards.find((b) => b.id === order.donorBoardId);
    const comp = components.find((c) => c.id === order.componentId);
    const discountInr = order.bargainDiscountInr ?? 0;
    const commissionInr = order.platformCommissionInr ?? 0;
    const extractionInr = order.extractionFeeInr ?? 0;
    const deliveryInr = order.deliveryFeeInr ?? 0;

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
Logistics Tier   : ${order.logisticsPartner || order.deliveryType}
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
Item / IC Base Price   : Rs. ${order.itemPriceInr}.00
Bargain Discount       : -Rs. ${discountInr}.00
Hot-Air Extraction Fee : Rs. ${extractionInr}.00 (Escrow Protected)
Platform Fee           : Rs. ${commissionInr}.00 (${
      order.isProOrder ? 'Pro Member Zero Fee' : 'Standard 5%'
    })
Delivery & ESD Packing : Rs. ${deliveryInr}.00
--------------------------------------------------------------------
TOTAL AMOUNT PAID      : Rs. ${order.totalPayableInr}.00
====================================================================
Founder & Support Desk : Boomesh R K | rkboomesh@gmail.com | +91 7200255069
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
    const partner = order.logisticsPartner || 'Logistics Partner';
    const fee = order.deliveryFeeInr ?? 0;

    switch (order.deliveryType) {
      case 'CAMPUS_HUB_PICKUP':
        return {
          badge: `${order.logisticsPartner || 'CAMPUS HUB / SELF PICKUP'} (₹${fee})`,
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
      case 'HYPERLOCAL_RAPIDO':
      case 'HYPERLOCAL_BIKE':
        return {
          badge: `${order.logisticsPartner || 'RAPIDO BIKE HYPERLOCAL'} (₹${
            order.deliveryFeeInr ?? 35
          })`,
          channel: tracking || 'Awaiting Rapido Live Rider Link',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting multimeter verification before Rapido dispatch'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? 'Rapido Live Rider Active'
                : 'Ready for Rapido pickup'
              : 'Delivered via Rapido Bike',
        };
      case 'HYPERLOCAL_DUNZO':
        return {
          badge: `${order.logisticsPartner || 'DUNZO EXPRESS HYPERLOCAL'} (₹${
            order.deliveryFeeInr ?? 45
          })`,
          channel: tracking || 'Awaiting Dunzo Live Rider Link',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting bench test before Dunzo dispatch'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? 'Dunzo Live Rider Active'
                : 'Ready for Dunzo pickup'
              : 'Delivered via Dunzo Express',
        };
      case 'HYPERLOCAL_PORTER':
        return {
          badge: `${order.logisticsPartner || 'PORTER HYPERLOCAL EXPRESS'} (₹${
            order.deliveryFeeInr ?? 55
          })`,
          channel: tracking || 'Awaiting Porter Live Booking Link',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting multimeter verification before rider dispatch'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? 'Live Porter Rider Active'
                : 'Ready for Hyperlocal Rider Pickup'
              : 'Delivered via Porter Express',
        };
      case 'OUTSTATION_PARCEL':
      case 'OUTSTATION_SPEEDPOST':
        return {
          badge: `${order.logisticsPartner || 'INDIA POST SPEED POST'} (₹${
            order.deliveryFeeInr ?? 45
          })`,
          channel: tracking || 'Awaiting India Post Consignment / AWB Number',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting IC extraction before ESD tube sealing'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? `Dispatched — AWB: ${tracking}`
                : 'Sealed in ESD tube — awaiting AWB assignment'
              : 'Delivered to destination address',
        };
      case 'OUTSTATION_DELHIVERY':
        return {
          badge: `${order.logisticsPartner || 'DELHIVERY SURFACE EXPRESS'} (₹${
            order.deliveryFeeInr ?? 65
          })`,
          channel: tracking || 'Awaiting Delhivery Waybill / AWB Number',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting IC extraction before Delhivery pickup'
              : order.status === 'READY_FOR_DISPATCH'
              ? tracking
                ? `In Transit — Delhivery AWB: ${tracking}`
                : 'Ready for Delhivery Courier pickup'
              : 'Delivered by Delhivery',
        };
      default:
        return {
          badge: `${partner} (₹${fee})`,
          channel: tracking || 'Awaiting dispatch tracking',
          statusNote:
            order.status === 'PENDING_EXTRACTION'
              ? 'Awaiting bench extraction'
              : order.status === 'READY_FOR_DISPATCH'
              ? 'Ready for dispatch'
              : 'Order delivered',
        };
    }
  };

  const displayedOrders =
    activeTabMode === 'SALES' ? mySales : myPurchases;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                SILICONHARVEST LOGISTICS &amp; BARGAIN ENGINE
              </span>
              <span className="font-mono text-xs text-slate-500">
                • {myPurchases.length} Purchases • {mySales.length} Sales •{' '}
                {myBargainOffers.length} Bargains
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] font-display">
              My Orders, Seller Dispatches &amp; Bargain Negotiations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Scoped relational order tracking for your purchases, incoming
              seller orders, multimeter bench QC certificates, and counter-offer
              negotiations.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className="px-5 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs shrink-0 transition-all shadow-sm active:scale-95"
          >
            + Browse Marketplace
          </button>
        </div>

        {/* 3-Tab Scoped Switcher: My Purchases vs My Sales vs My Bargain Negotiations */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTabMode('PURCHASES')}
            className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'PURCHASES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Purchases (Buyer) ({myPurchases.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('SALES')}
            className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'SALES'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>My Sales &amp; Incoming Orders (Seller) ({mySales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('BARGAINS')}
            className={`min-h-[42px] px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'BARGAINS'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>My Bargain Negotiations ({myBargainOffers.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 3: MY BARGAIN NEGOTIATIONS */}
      {activeTabMode === 'BARGAINS' && (
        <div className="space-y-4">
          {myBargainOffers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Crown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                No Active Bargain Negotiations
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pro members can propose counter-offers on any listed spare.
                Outgoing buyer offers and incoming offers on your listings
                appear here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('MARKETPLACE')}
                className="mt-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Browse Spares to Bargain →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBargainOffers.map((offer) => {
                const parentBoard = boards.find((b) => b.id === offer.boardId);
                const isBuyerOfOffer = offer.buyerId === currentUser.id;
                const isSellerOfListing = Boolean(
                  isOwnerAdmin ||
                    (offer.sellerId && offer.sellerId === currentUser.id) ||
                    (parentBoard?.sellerId &&
                      parentBoard.sellerId === currentUser.id)
                );
                const canSellerApprove =
                  isOwnerAdmin || (isSellerOfListing && !isBuyerOfOffer);

                return (
                  <div
                    key={offer.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {offer.id}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isBuyerOfOffer
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isBuyerOfOffer
                            ? 'OUTGOING OFFER (BUYER)'
                            : 'INCOMING OFFER (SELLER)'}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {offer.targetType ||
                            (offer.componentId ? 'COMPONENT' : 'BOARD')}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 font-display">
                          {offer.boardName}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            offer.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'REDEEMED'
                              ? 'bg-sky-100 text-sky-800'
                              : offer.status === 'REJECTED' ||
                                offer.status === 'EXPIRED' ||
                                offer.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4">
                        <span>
                          Buyer: <strong>{offer.buyerName}</strong> (
                          {offer.buyerDistrict})
                        </span>
                        <span>
                          Seller: <strong>{offer.sellerName}</strong> (
                          {offer.sellerDistrict})
                        </span>
                        <span className="text-slate-400">
                          • {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {offer.note && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                          &ldquo;{offer.note}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                      <div className="text-left sm:text-right font-mono">
                        <div className="text-xs text-slate-400 line-through">
                          Listed: ₹{offer.originalPriceInr}
                        </div>
                        <div className="text-xl font-black text-emerald-600">
                          Offered: ₹{offer.offeredPriceInr}
                        </div>
                        <div className="text-[11px] text-amber-700 font-bold">
                          Save ₹{offer.originalPriceInr - offer.offeredPriceInr}{' '}
                          (
                          {Math.round(
                            ((offer.originalPriceInr - offer.offeredPriceInr) /
                              offer.originalPriceInr) *
                              100
                          )}
                          % off)
                        </div>
                      </div>

                      {offer.status === 'PENDING' && (
                        <div className="flex flex-col items-end gap-1.5">
                          {isBuyerOfOffer && !isOwnerAdmin ? (
                            <>
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                ⏳ Awaiting Seller Approval
                              </span>
                              <button
                                type="button"
                                onClick={() => cancelBargainOffer(offer.id)}
                                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel Offer</span>
                              </button>
                            </>
                          ) : canSellerApprove ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => acceptBargainOffer(offer.id)}
                                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs active:scale-95 transition-all shadow-sm"
                              >
                                Accept Offer
                              </button>
                              <button
                                type="button"
                                onClick={() => rejectBargainOffer(offer.id)}
                                className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs active:scale-95 transition-all"
                              >
                                Counter / Decline
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {offer.status === 'ACCEPTED' && isBuyerOfOffer && (
                        <button
                          type="button"
                          onClick={() => {
                            const isCompTarget =
                              offer.targetType === 'COMPONENT' ||
                              Boolean(offer.componentId);
                            setPendingCheckoutTarget({
                              boardId: offer.boardId,
                              componentId: offer.componentId ?? null,
                              mode: isCompTarget
                                ? 'EXTRACTED_TESTED_PART'
                                : 'RAW_DONOR_BOARD',
                            });
                            setActiveTab('MARKETPLACE');
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                        >
                          <span>
                            Checkout at Accepted Price (₹{offer.offeredPriceInr}) →
                          </span>
                        </button>
                      )}

                      {offer.status === 'ACCEPTED' && !isBuyerOfOffer && (
                        <span className="font-mono text-xs font-bold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ Offer Accepted • Awaiting Buyer Checkout
                        </span>
                      )}

                      {offer.status === 'REDEEMED' && (
                        <span className="font-mono text-xs font-bold px-3 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                          ✓ Redeemed at Checkout
                        </span>
                      )}

                      {offer.status === 'EXPIRED' && (
                        <span className="font-mono text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                          Expired (Item Sold)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1 & TAB 2: MY PURCHASES (BUYER) & MY SALES (SELLER) */}
      {(activeTabMode === 'PURCHASES' || activeTabMode === 'SALES') && (
        <>
          {displayedOrders.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[#0F172A] font-display">
                {activeTabMode === 'SALES'
                  ? 'No Incoming Seller Orders Yet (0 Sales)'
                  : 'No Salvage Purchases Placed Yet (0 Orders)'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {activeTabMode === 'SALES'
                  ? 'When buyers purchase your listed donor boards or extracted components, their shipping address, Rapido / Speed Post dispatch controls, and escrow payout status appear here.'
                  : 'Once you order an extracted & multimeter-verified IC or a full raw donor PCB, your real-time escrow status, multimeter certificate, and dispatch tracking link will appear here.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {activeTabMode === 'SALES' || boards.length === 0 ? (
                  <button
                    onClick={() => setActiveTab('SELLER_PORTAL')}
                    className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ List Electronic Spares or Donor PCB (30s) →</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('MARKETPLACE')}
                    className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Explore Available Donor Boards &amp; ICs →</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {displayedOrders.map((order) => {
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
                      order.multimeterReadingValue ||
                      'Verified for Dispatch'
                    }\n` +
                    `📍 Pickup Hub: ${pickupCoords}\n` +
                    `🏁 Buyer Drop: ${order.buyerAddress} (${order.buyerName})\n` +
                    (order.trackingOrPorterLink
                      ? `🔗 Tracking / AWB / Locker: ${order.trackingOrPorterLink}`
                      : '')
                )}`;

                // Flow A (Requires Hot-Air Extraction) vs Flow B (Direct Dispatch: RAW_DONOR_BOARD or READY_TO_USE)
                const requiresHotAirExtraction =
                  order.mode === 'EXTRACTED_TESTED_PART' &&
                  (order.hardwareMode || board?.hardwareMode) !==
                    'READY_TO_USE' &&
                  (order.extractionFeeInr ?? 0) > 0;

                // 4-Stage Stepper Index (1 to 4)
                const stageIndex: 1 | 2 | 3 | 4 =
                  order.status === 'COMPLETED'
                    ? 4
                    : order.status === 'IN_TRANSIT' ||
                      order.status === 'PICKED_UP_BY_PARTNER' ||
                      Boolean(order.trackingOrPorterLink)
                    ? 3
                    : order.status === 'READY_FOR_DISPATCH'
                    ? requiresHotAirExtraction
                      ? 3
                      : 2
                    : 2; // PENDING_EXTRACTION is actively in Stage 2 (Workbench) with Stage 1 locked

                const flowStages = requiresHotAirExtraction
                  ? [
                      {
                        num: 1,
                        title: '1. Order & Escrow Locked',
                        desc: `₹${order.extractionFeeInr ?? 25} QC escrow locked`,
                      },
                      {
                        num: 2,
                        title: '2. Hot-Air Extraction & Multimeter QC',
                        desc:
                          order.status === 'PENDING_EXTRACTION'
                            ? 'Queued at Tech Workbench'
                            : `QC Passed: ${
                                order.multimeterReadingValue || 'Verified'
                              }`,
                      },
                      {
                        num: 3,
                        title: '3. Ready for Courier Pickup',
                        desc:
                          order.trackingOrPorterLink ||
                          `Packed in ESD pouch for ${
                            order.logisticsPartner || 'Courier'
                          }`,
                      },
                      {
                        num: 4,
                        title: '4. In Transit / Delivered',
                        desc:
                          order.status === 'COMPLETED'
                            ? 'Delivered & verified by buyer'
                            : order.status === 'IN_TRANSIT'
                            ? `Dispatched (${order.trackingOrPorterLink || 'Live'})`
                            : 'Awaiting final delivery confirmation',
                      },
                    ]
                  : [
                      {
                        num: 1,
                        title: '1. Order Confirmed & Paid',
                        desc: `Ref: ${order.upiUtrOrPaymentId || 'Verified'}`,
                      },
                      {
                        num: 2,
                        title: '2. Packed & Ready for Dispatch',
                        desc:
                          (order.hardwareMode || board?.hardwareMode) ===
                          'READY_TO_USE'
                            ? 'Pre-desoldered part sealed in ESD pouch'
                            : 'Full raw donor PCB packed as-is',
                      },
                      {
                        num: 3,
                        title: '3. Out for Delivery (Rapido / Speed Post)',
                        desc:
                          order.trackingOrPorterLink ||
                          `Assigned to ${order.logisticsPartner || 'Courier'}`,
                      },
                      {
                        num: 4,
                        title: '4. Delivered & Verified',
                        desc:
                          order.status === 'COMPLETED'
                            ? 'Delivered & verified in circuit'
                            : 'Awaiting final handover',
                      },
                    ];

                const currentTrackingInput =
                  trackingInputs[order.id] !== undefined
                    ? trackingInputs[order.id]
                    : order.trackingOrPorterLink || '';

                const isSellerForThisOrder = Boolean(
                  isOwnerAdmin ||
                    activeTabMode === 'SALES' ||
                    (order.sellerId && order.sellerId === currentUser.id) ||
                    (board?.sellerId && board.sellerId === currentUser.id)
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
                  >
                    {/* Top Row: Order Code, Item Title, Total Price */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#0F172A] px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                            {order.orderCode}
                          </span>
                          <span
                            className={`font-mono text-xs px-3 py-0.5 rounded-full border font-semibold ${
                              order.status === 'PENDING_EXTRACTION'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : order.status === 'READY_FOR_DISPATCH' ||
                                  order.status === 'IN_TRANSIT' ||
                                  order.status === 'PICKED_UP_BY_PARTNER'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {requiresHotAirExtraction
                              ? 'FLOW A: HOT-AIR EXTRACTION & QC'
                              : 'FLOW B: DIRECT DISPATCH'}
                          </span>
                          {order.upiUtrOrPaymentId && (
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ref: {order.upiUtrOrPaymentId}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[#0F172A] pt-1 flex flex-wrap items-center gap-2 font-display">
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
                              <span>
                                {board?.boardName || order.donorBoardId}
                              </span>
                            </>
                          )}
                        </h3>

                        <p className="text-xs text-slate-500">
                          Donor Board:{' '}
                          <span className="text-[#0F172A] font-medium">
                            {board?.boardName} ({order.donorBoardId})
                          </span>{' '}
                          • Buyer:{' '}
                          <span className="text-[#0F172A] font-medium">
                            {order.buyerName} ({order.buyerPhone})
                          </span>
                          {order.buyerDistrict && (
                            <span>
                              {' '}
                              • Ship To:{' '}
                              <strong className="text-slate-700">
                                {order.buyerAddress}, {order.buyerDistrict}
                              </strong>
                            </span>
                          )}
                          {order.logisticsPartner && (
                            <span>
                              {' '}
                              • Logistics:{' '}
                              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[10px]">
                                {order.logisticsPartner}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Price Breakdown Pill */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-right font-mono">
                        <div className="text-[11px] text-slate-500">
                          ₹{order.itemPriceInr} part
                          {(order.bargainDiscountInr ?? 0) > 0
                            ? ` - ₹${order.bargainDiscountInr} deal`
                            : ''}{' '}
                          + ₹{order.extractionFeeInr ?? 0} escrow + ₹
                          {order.deliveryFeeInr ?? 0} ship (₹
                          {order.platformCommissionInr ?? 0} fee)
                        </div>
                        <div className="text-lg font-bold text-emerald-700 mt-0.5">
                          Total: ₹{order.totalPayableInr}
                        </div>
                      </div>
                    </div>

                    {/* 4-Stage Context-Aware Order Progress Stepper */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {flowStages.map((st) => {
                          const isDone =
                            order.status === 'COMPLETED' || st.num < stageIndex;
                          const isCurrent =
                            order.status !== 'COMPLETED' &&
                            st.num === stageIndex;
                          return (
                            <div
                              key={st.num}
                              className={`flex items-start gap-2.5 p-3 rounded-2xl border ${
                                isCurrent
                                  ? 'bg-amber-50 border-amber-300'
                                  : isDone
                                  ? 'bg-white border-emerald-200'
                                  : 'bg-slate-100/60 border-slate-200 opacity-60'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {isDone ? '✓' : st.num}
                              </div>
                              <div className="text-xs min-w-0">
                                <div className="font-mono font-bold text-[#0F172A] leading-tight">
                                  {st.title}
                                </div>
                                <p className="text-slate-600 text-[11px] mt-0.5 truncate">
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Real Tracking Link / AWB / Locker Input & Seller Dispatch Controls */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-sky-600" />
                          Dispatch Tracking ID / Rapido Rider Link / Speed Post AWB:
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
                          placeholder="Enter Rapido Live Rider Link, Speed Post AWB, or Campus Locker ID..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTracking(order)}
                          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-semibold transition-all"
                        >
                          {savedOrderId === order.id ? 'Saved ✓' : 'Save Link'}
                        </button>
                        {isSellerForThisOrder &&
                          order.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleDispatchOrder(order)}
                              className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all"
                            >
                              Dispatch via Rapido / Speed Post →
                            </button>
                          )}
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
                          <span className="text-slate-700">
                            {logistics.channel}
                          </span>
                        </div>
                        <div className="text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Origin:{' '}
                            <strong className="text-[#0F172A]">
                              {pickupCoords}
                            </strong>{' '}
                            → Drop:{' '}
                            <strong className="text-[#0F172A]">
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
                            className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all"
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

                        {(order.status === 'READY_FOR_DISPATCH' ||
                          order.status === 'IN_TRANSIT') && (
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
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-200 font-mono text-xs flex items-center gap-1.5 transition-all"
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
        </>
      )}

      {esdModalOrder && (
        <EsdLabelModal
          order={esdModalOrder}
          board={boards.find((b) => b.id === esdModalOrder.donorBoardId)}
          component={components.find((c) => c.id === esdModalOrder.componentId)}
          onClose={() => setEsdModalOrder(null)}
        />
      )}
    </div>
  );
};
