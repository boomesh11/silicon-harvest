import {
  BargainOffer,
  DeliveryType,
  DonorBoard,
  HarvestableComponent,
  OrderMode,
} from '../types/harvest';

export type LogisticsPartnerKey =
  | 'RAPIDO'
  | 'DUNZO'
  | 'PORTER'
  | 'INDIA_POST'
  | 'DELHIVERY'
  | 'SELF_PICKUP';

export interface LogisticsOption {
  key: LogisticsPartnerKey;
  label: string;
  shortLabel: string;
  eta: string;
  feeInr: number;
  deliveryType: DeliveryType;
  isHyperlocal: boolean;
}

export const LOGISTICS_PARTNERS: Record<LogisticsPartnerKey, LogisticsOption> = {
  RAPIDO: {
    key: 'RAPIDO',
    label: '🛵 Rapido Bike Delivery (Same District)',
    shortLabel: 'Rapido Bike',
    eta: 'Fast local pickup. Coordinate with nearest Rapido rider or app.',
    feeInr: 0,
    deliveryType: 'HYPERLOCAL_RAPIDO',
    isHyperlocal: true,
  },
  PORTER: {
    key: 'PORTER',
    label: '🚚 Porter 2-Wheeler / Mini-Truck (Same District / Heavy Boards)',
    shortLabel: 'Porter Vehicle',
    eta: 'Best for heavy washing machine PCBs & SMPS units. Book via Porter app.',
    feeInr: 0,
    deliveryType: 'HYPERLOCAL_PORTER',
    isHyperlocal: true,
  },
  DUNZO: {
    key: 'DUNZO',
    label: '📦 Dunzo Hyperlocal Courier',
    shortLabel: 'Dunzo Courier',
    eta: 'Door-to-door local dispatch.',
    feeInr: 0,
    deliveryType: 'HYPERLOCAL_DUNZO',
    isHyperlocal: true,
  },
  INDIA_POST: {
    key: 'INDIA_POST',
    label: '📮 India Post / Delhivery Express (Other Districts / State)',
    shortLabel: 'India Post / Delhivery',
    eta: 'Secure parcel tracking for outstation deliveries.',
    feeInr: 0,
    deliveryType: 'OUTSTATION_PARCEL',
    isHyperlocal: false,
  },
  DELHIVERY: {
    key: 'DELHIVERY',
    label: '📮 Delhivery Express Air/Surface',
    shortLabel: 'Delhivery',
    eta: 'Inter-district parcel tracking for outstation deliveries.',
    feeInr: 0,
    deliveryType: 'OUTSTATION_DELHIVERY',
    isHyperlocal: false,
  },
  SELF_PICKUP: {
    key: 'SELF_PICKUP',
    label: '🤝 Self-Pickup / Direct Hand-off',
    shortLabel: 'Self-Pickup',
    eta: 'Pick up directly from seller’s hub or campus location.',
    feeInr: 0,
    deliveryType: 'CAMPUS_HUB_PICKUP',
    isHyperlocal: true,
  },
};

export function resolveDeliveryFeeFromType(
  deliveryType: DeliveryType,
  _isSameDistrict: boolean
): { feeInr: number; partnerLabel: string } {
  switch (deliveryType) {
    case 'CAMPUS_HUB_PICKUP':
    case 'DIRECT_HANDOFF':
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.SELF_PICKUP.label };
    case 'HYPERLOCAL_RAPIDO':
    case 'HYPERLOCAL_BIKE':
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.RAPIDO.label };
    case 'HYPERLOCAL_DUNZO':
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.DUNZO.label };
    case 'HYPERLOCAL_PORTER':
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.PORTER.label };
    case 'OUTSTATION_DELHIVERY':
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.DELHIVERY.label };
    case 'OUTSTATION_PARCEL':
    case 'OUTSTATION_SPEEDPOST':
    default:
      return { feeInr: 0, partnerLabel: LOGISTICS_PARTNERS.INDIA_POST.label };
  }
}

/**
 * Finds a single-use, buyer-scoped accepted bargain offer matching the exact target mode & item.
 */
export function findScopedAcceptedBargain(params: {
  bargainOffers: BargainOffer[];
  buyerId: string;
  boardId: string;
  componentId: string | null;
  mode: OrderMode;
}): BargainOffer | null {
  const { bargainOffers, buyerId, boardId, componentId, mode } = params;
  if (!buyerId) return null;

  return (
    bargainOffers.find((offer) => {
      if (offer.status !== 'ACCEPTED') return false;
      if (offer.buyerId !== buyerId) return false;
      if (offer.boardId !== boardId) return false;

      if (mode === 'RAW_DONOR_BOARD') {
        return offer.targetType === 'BOARD' || !offer.componentId;
      } else {
        if (offer.targetType === 'COMPONENT') {
          return offer.componentId === componentId || offer.targetId === componentId;
        }
        // Fallback if offer was placed on a single-component board
        return !offer.componentId && offer.targetType !== 'BOARD';
      }
    }) ?? null
  );
}

export interface OrderBreakdownResult {
  itemPriceInr: number;
  bargainDiscountInr: number;
  discountedItemPriceInr: number;
  extractionFeeInr: number;
  platformCommissionInr: number;
  deliveryFeeInr: number;
  deliveryType: DeliveryType;
  logisticsPartnerLabel: string;
  totalPayableInr: number;
  matchedBargain: BargainOffer | null;
}

/**
 * Pure Single Source of Truth for all order & checkout financial calculations.
 */
export function calculateOrderBreakdown(params: {
  board: DonorBoard;
  component: HarvestableComponent | null;
  mode: OrderMode;
  logisticsPartner?: LogisticsPartnerKey;
  deliveryType?: DeliveryType;
  isSameDistrict: boolean;
  isProMember: boolean;
  buyerId: string;
  bargainOffers: BargainOffer[];
}): OrderBreakdownResult {
  const {
    board,
    component,
    mode,
    logisticsPartner,
    deliveryType: explicitDeliveryType,
    isSameDistrict,
    isProMember,
    buyerId,
    bargainOffers,
  } = params;

  const itemPriceInr =
    mode === 'RAW_DONOR_BOARD'
      ? board.rawBoardPriceInr
      : component
      ? component.partPriceInr
      : board.rawBoardPriceInr;

  // Ready-to-Use items are already desoldered/tested — only charge extraction when desoldering from a board
  const rawExtractionFee =
    mode === 'RAW_DONOR_BOARD'
      ? 0
      : board.hardwareMode === 'READY_TO_USE'
      ? 0
      : component
      ? component.extractionFeeInr
      : 0;

  const matchedBargain = findScopedAcceptedBargain({
    bargainOffers,
    buyerId,
    boardId: board.id,
    componentId: component?.id ?? null,
    mode,
  });

  // Never let a bargain discount exceed (itemPriceInr - 5) or go negative
  const rawDiscount = matchedBargain
    ? Math.max(0, itemPriceInr - matchedBargain.offeredPriceInr)
    : 0;
  const bargainDiscountInr = Math.min(Math.max(0, itemPriceInr - 5), rawDiscount);
  const discountedItemPriceInr = Math.max(0, itemPriceInr - bargainDiscountInr);

  // Commission is calculated on the discounted subtotal + extraction fee
  // Strictly ₹0 for Pro Members; 5% (min ₹5, max ₹15) for standard users
  const taxableBase = discountedItemPriceInr + rawExtractionFee;
  const platformCommissionInr = isProMember
    ? 0
    : Math.min(15, Math.max(5, Math.round(taxableBase * 0.05)));

  let deliveryFeeInr = 35;
  let resolvedDeliveryType: DeliveryType = 'HYPERLOCAL_RAPIDO';
  let logisticsPartnerLabel = LOGISTICS_PARTNERS.RAPIDO.label;

  if (logisticsPartner && LOGISTICS_PARTNERS[logisticsPartner]) {
    const opt = LOGISTICS_PARTNERS[logisticsPartner];
    deliveryFeeInr = opt.feeInr;
    resolvedDeliveryType = opt.deliveryType;
    logisticsPartnerLabel = opt.label;
  } else if (explicitDeliveryType) {
    const resolved = resolveDeliveryFeeFromType(explicitDeliveryType, isSameDistrict);
    deliveryFeeInr = resolved.feeInr;
    resolvedDeliveryType = explicitDeliveryType;
    logisticsPartnerLabel = resolved.partnerLabel;
  } else {
    const defaultOpt = isSameDistrict
      ? LOGISTICS_PARTNERS.RAPIDO
      : LOGISTICS_PARTNERS.INDIA_POST;
    deliveryFeeInr = defaultOpt.feeInr;
    resolvedDeliveryType = defaultOpt.deliveryType;
    logisticsPartnerLabel = defaultOpt.label;
  }

  const totalPayableInr = Math.max(
    0,
    discountedItemPriceInr + rawExtractionFee + platformCommissionInr + deliveryFeeInr
  );

  return {
    itemPriceInr,
    bargainDiscountInr,
    discountedItemPriceInr,
    extractionFeeInr: rawExtractionFee,
    platformCommissionInr,
    deliveryFeeInr,
    deliveryType: resolvedDeliveryType,
    logisticsPartnerLabel,
    totalPayableInr,
    matchedBargain,
  };
}

/**
 * Pure Bulk Cart calculator respecting Pro Membership (₹0 commission) and Unified District Shipping.
 */
export function calculateBulkCartBreakdown(params: {
  components: HarvestableComponent[];
  boardMap: Map<string, DonorBoard>;
  buyerDistrict: string;
  isProMember: boolean;
}) {
  const { components, boardMap, buyerDistrict, isProMember } = params;
  const distinctBoardsCount = new Set(components.map((c) => c.donorBoardId)).size;
  const totalPartsInr = components.reduce((s, c) => s + c.partPriceInr, 0);
  const totalExtractionInr = components.reduce((s, c) => {
    const parent = boardMap.get(c.donorBoardId);
    const fee = parent?.hardwareMode === 'READY_TO_USE' ? 0 : c.extractionFeeInr;
    return s + fee;
  }, 0);

  const allSameDistrict = components.every((c) => {
    const b = boardMap.get(c.donorBoardId);
    return (
      (b?.sellerDistrict || 'Chennai').toLowerCase().trim() ===
      buyerDistrict.toLowerCase().trim()
    );
  });

  const unifiedCommissionInr = isProMember
    ? 0
    : Math.min(15, Math.max(5, Math.round((totalPartsInr + totalExtractionInr) * 0.05)));

  const bundledShippingInr = allSameDistrict
    ? LOGISTICS_PARTNERS.RAPIDO.feeInr
    : LOGISTICS_PARTNERS.INDIA_POST.feeInr;

  const bundledLogisticsLabel = allSameDistrict
    ? `${LOGISTICS_PARTNERS.RAPIDO.label} (₹${LOGISTICS_PARTNERS.RAPIDO.feeInr} Bundled)`
    : `${LOGISTICS_PARTNERS.INDIA_POST.label} (₹${LOGISTICS_PARTNERS.INDIA_POST.feeInr} Outstation)`;

  const grandTotalInr =
    totalPartsInr + totalExtractionInr + unifiedCommissionInr + bundledShippingInr;

  return {
    distinctBoardsCount,
    totalPartsInr,
    totalExtractionInr,
    unifiedCommissionInr,
    allSameDistrict,
    bundledShippingInr,
    bundledLogisticsLabel,
    grandTotalInr,
  };
}

/**
 * Computes realistic distance telemetry between buyer and seller districts.
 */
export function computeEffectiveDistanceKm(
  board: DonorBoard,
  buyerDistrict?: string
): number {
  const sellerDist = (board.sellerDistrict || board.locationCity || 'Chennai')
    .toLowerCase()
    .trim();
  const buyerDist = (buyerDistrict || 'Chennai').toLowerCase().trim();

  if (sellerDist === buyerDist) {
    // Hyperlocal same-district distance (< 15 km)
    return board.distanceKm < 15 ? board.distanceKm : 4.2;
  }

  // Inter-district outstation distance (>= 45 km)
  if (board.distanceKm >= 15) return board.distanceKm;

  const hash = (sellerDist + buyerDist)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return 120 + (hash % 360);
}

