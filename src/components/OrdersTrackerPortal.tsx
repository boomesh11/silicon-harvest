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
  Crown,
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
    currentUser,
    markOrderCompleted,
    updateOrderTracking,
    setActiveTab,
    setPendingCheckoutTarget,
  } = useHarvestStore();

  const [activeTabMode, setActiveTabMode] = useState<'ORDERS' | 'BARGAINS'>(
    'ORDERS'
  );
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

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                RECYKAL-GRADE LOGISTICS &amp; BARGAIN ENGINE
              </span>
              <span className="font-mono text-xs text-slate-500">
                • {orders.length} Orders • {bargainOffers.length} Bargain Offers
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] font-display">
              My Orders, Logistics &amp; Bargain Counter-Offers
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Track live district parcel dispatches, verify multimeter bench QC
              certificates, and negotiate scoped counter-offers directly with
              sellers.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className="px-5 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs shrink-0 transition-all shadow-sm active:scale-95"
          >
            + Browse Marketplace
          </button>
        </div>

        {/* Segmented Mode Switcher: Orders vs Bargains */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTabMode('ORDERS')}
            className={`min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'ORDERS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Orders &amp; Dispatches ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('BARGAINS')}
            className={`min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTabMode === 'BARGAINS'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Bargains &amp; Counter-Offers ({bargainOffers.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW: BARGAINS & COUNTER-OFFERS */}
      {activeTabMode === 'BARGAINS' && (
        <div className="space-y-4">
          {bargainOffers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Crown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                No Bargain Offers Submitted Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pro members can propose counter-offers on any listed spare. When
                accepted, discounted prices apply automatically at checkout.
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
              {bargainOffers.map((offer) => {
                const isOwnOfferAsBuyer =
                  offer.buyerId === currentUser.id &&
                  currentUser.role !== 'OWNER_ADMIN' &&
                  currentUser.role !== 'SELLER_LAB';

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
                              : offer.status === 'REJECTED'
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
                          {isOwnOfferAsBuyer && (
                            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Awaiting Seller Approval
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => acceptBargainOffer(offer.id)}
                              title="Seller / Admin Action: Approve Counter-Offer"
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs active:scale-95 transition-all shadow-sm"
                            >
                              {isOwnOfferAsBuyer
                                ? 'Seller Approve (Demo)'
                                : 'Accept Offer'}
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectBargainOffer(offer.id)}
                              className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs active:scale-95 transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {offer.status === 'ACCEPTED' && (
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
                          <span>Checkout at ₹{offer.offeredPriceInr} →</span>
                        </button>
                      )}

                      {offer.status === 'REDEEMED' && (
                        <span className="font-mono text-xs font-bold px-3 py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                          ✓ Redeemed at Checkout
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

      {/* VIEW: ORDERS & DISPATCHES */}
      {activeTabMode === 'ORDERS' && (
        <>
          {/* Empty State when 0 Orders exist */}
          {orders.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[#0F172A] font-display">
                No Salvage Orders Placed Yet (0 Orders)
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Once you order an extracted &amp; multimeter-verified IC or a
                full raw donor PCB, your real-time escrow status, multimeter
                certificate, and dispatch tracking link will appear here.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {boards.length === 0 ? (
                  <button
                    onClick={() => setActiveTab('SELLER_PORTAL')}
                    className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
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
                    className="px-5 py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
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
                      order.multimeterReadingValue ||
                      'Pending Bench Verification'
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
                    : order.status === 'READY_FOR_DISPATCH' ||
                      order.status === 'PICKED_UP_BY_PARTNER'
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
                          <span className="font-mono text-sm font-bold text-[#0F172A] px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                            {order.orderCode}
                          </span>
                          <span
                            className={`font-mono text-xs px-3 py-0.5 rounded-full border font-semibold ${
                              order.status === 'PENDING_EXTRACTION'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : order.status === 'READY_FOR_DISPATCH' ||
                                  order.status === 'PICKED_UP_BY_PARTNER'
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
                              • District:{' '}
                              <strong className="text-slate-700">
                                {order.buyerDistrict}
                                {order.buyerState
                                  ? `, ${order.buyerState}`
                                  : ''}
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
                            <div className="font-mono font-bold text-[#0F172A]">
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
                            <div className="font-mono font-bold text-[#0F172A]">
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
                            <div className="font-mono font-bold text-[#0F172A]">
                              3. COMPLETED / DELIVERED
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
                          Dispatch Tracking URL / Shiprocket AWB / Campus
                          Locker:
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
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTracking(order)}
                          className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-mono text-xs font-semibold transition-all"
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
