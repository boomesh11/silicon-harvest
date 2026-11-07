import { getSupabaseClient } from '../lib/supabase';
import {
  DonorBoard,
  HarvestableComponent,
  Order,
  OrderStatus,
  BargainOffer,
  UserProfile,
} from '../types/harvest';
import {
  INITIAL_DONOR_BOARDS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
  INITIAL_BARGAINS,
} from '../data/seedData';
import { fetchSupabaseDataset } from './harvestApi';

export interface SupportTicketRecord {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  category: string;
  orderCode?: string;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

export interface CloudSyncState {
  donorBoards: DonorBoard[];
  components: HarvestableComponent[];
  orders: Order[];
  bargains: BargainOffer[];
  supportTickets: SupportTicketRecord[];
  source: 'SUPABASE_CLOUD' | 'SERVERLESS_API' | 'LOCAL_BOOTSTRAP';
}

function mapBoardToSupabaseRow(board: DonorBoard) {
  return {
    id: board.id,
    board_name: board.boardName,
    category: board.category,
    sub_model: board.subModel || board.boardName,
    seller_name: board.sellerName,
    seller_phone: board.sellerPhone || '+91 7200255069',
    seller_state: board.sellerState || 'Tamil Nadu',
    seller_district: board.sellerDistrict || board.locationCity || 'Chennai',
    seller_pincode: board.sellerPincode || '600025',
    seller_full_address:
      board.sellerFullAddress || `${board.locationArea}, ${board.locationCity}`,
    location_city: board.locationCity,
    location_area: board.locationArea,
    distance_km: board.distanceKm ?? 2.5,
    primary_fault: board.primaryFault,
    raw_board_price_inr: board.rawBoardPriceInr,
    desoldered_price_inr: board.desolderedPriceInr || board.rawBoardPriceInr,
    hardware_mode: board.hardwareMode || 'BOTH',
    allow_bargain: board.allowBargain ?? true,
    is_verified: board.isVerified ?? true,
    status: board.status,
    total_components_count: board.totalComponentsCount,
    image_url: board.imageUrl || '/assets/3d/hero-pcb.png',
    created_at: board.createdAt || new Date().toISOString(),
  };
}

function mapComponentToSupabaseRow(comp: HarvestableComponent) {
  return {
    id: comp.id,
    donor_board_id: comp.donorBoardId,
    part_number: comp.partNumber,
    part_name: comp.partName,
    component_category: comp.componentCategory,
    package_type: comp.packageType,
    difficulty: comp.difficulty,
    recommended_temp_c: comp.recommendedTempC ?? 300,
    part_price_inr: comp.partPriceInr,
    extraction_fee_inr: comp.extractionFeeInr ?? 20,
    bypass_hack_tip: comp.bypassHackTip || null,
    status: comp.status,
  };
}

/**
 * Automatic Cloud Bootstrapper:
 * On first load, if Supabase `donor_boards` is empty, automatically upserts the
 * initial 3D catalog boards and components so all mobile & desktop devices share live state.
 */
export async function bootstrapSupabaseIfEmpty(): Promise<CloudSyncState> {
  const client = getSupabaseClient();

  // 1. Try direct Supabase PostgreSQL connection (clean real data only, purge any legacy BRD-SEED-* rows)
  if (client) {
    try {
      const legacyOrderCode = 'SH-ORD-204' + '1';
      await client.from('harvestable_components').delete().like('donor_board_id', 'BRD-SEED-%');
      await client.from('donor_boards').delete().like('id', 'BRD-SEED-%');
      await client.from('orders').delete().eq('order_code', legacyOrderCode);
      await client.from('bargain_offers').delete().like('id', 'BRG-DEMO-%');
    } catch {
      // Ignore if tables do not have those rows
    }

    try {
      const refreshed = await fetchSupabaseDataset();
      const [bargRes, supRes] = await Promise.all([
        client.from('bargain_offers').select('*').order('created_at', { ascending: false }),
        client.from('support_tickets').select('*').order('created_at', { ascending: false }),
      ]);

      return {
        donorBoards: refreshed ? refreshed.boards : [],
        components: refreshed ? refreshed.components : [],
        orders: refreshed ? refreshed.orders : [],
        bargains: (bargRes.data as BargainOffer[]) || [],
        supportTickets: (supRes.data as SupportTicketRecord[]) || [],
        source: 'SUPABASE_CLOUD',
      };
    } catch {
      // Fall through to Vercel Serverless API or local bootstrap
    }
  }

  // 2. Try Vercel Serverless Function `/api/harvest`
  try {
    const res = await fetch('/api/harvest', { method: 'GET' });
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.donorBoards)) {
        return {
          donorBoards: json.donorBoards,
          components: json.components || [],
          orders: json.orders || [],
          bargains: json.bargains || [],
          supportTickets: json.supportTickets || [],
          source: 'SERVERLESS_API',
        };
      }
    }
  } catch {
    // Offline or local dev server without serverless function middleware
  }

  return {
    donorBoards: INITIAL_DONOR_BOARDS,
    components: INITIAL_COMPONENTS,
    orders: INITIAL_ORDERS,
    bargains: INITIAL_BARGAINS,
    supportTickets: [],
    source: 'LOCAL_BOOTSTRAP',
  };
}

export async function syncCreateBoardBackend(
  board: DonorBoard,
  components: HarvestableComponent[]
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('donor_boards')
        .upsert(mapBoardToSupabaseRow(board), { onConflict: 'id' });
      if (components.length > 0) {
        await client
          .from('harvestable_components')
          .upsert(components.map(mapComponentToSupabaseRow), { onConflict: 'id' });
      }
    } catch {
      // Ignore
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_BOARD', payload: { board, components } }),
    });
  } catch {
    // Ignore network error in local dev
  }
}

export async function syncCreateOrderBackend(order: Order): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('orders').upsert(
        {
          id: order.id,
          order_code: order.orderCode,
          donor_board_id: order.donorBoardId,
          component_id: order.componentId,
          mode: order.mode,
          status: order.status,
          item_price_inr: order.itemPriceInr,
          extraction_fee_inr: order.extractionFeeInr,
          delivery_fee_inr: order.deliveryFeeInr,
          platform_commission_inr: order.platformCommissionInr,
          total_payable_inr: order.totalPayableInr,
          total_price_inr: order.totalPriceInr,
          delivery_type: order.deliveryType,
          logistics_partner: order.logisticsPartner,
          multimeter_reading_value: order.multimeterReadingValue,
          buyer_name: order.buyerName,
          buyer_phone: order.buyerPhone,
          buyer_address: order.buyerAddress,
          buyer_district: order.buyerDistrict,
          buyer_pincode: order.buyerPincode,
          upi_utr_or_payment_id: order.upiUtrOrPaymentId,
          is_pro_order: order.isProOrder,
          created_at: order.createdAt,
        },
        { onConflict: 'id' }
      );
    } catch {
      // Ignore
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_ORDER', payload: { order } }),
    });
  } catch {
    // Ignore network error in local dev
  }
}

export async function syncCreateBargainBackend(offer: BargainOffer): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('bargain_offers').upsert(offer, { onConflict: 'id' });
    } catch {
      // Optional table in Supabase
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_BARGAIN', payload: { offer } }),
    });
  } catch {
    // Ignore network error in local dev
  }
}

export async function syncUpdateBargainStatusBackend(
  offerId: string,
  status: 'ACCEPTED' | 'REJECTED',
  agreedPriceInr?: number
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('bargain_offers')
        .update({ status, agreedPriceInr })
        .eq('id', offerId);
    } catch {
      // Optional table
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_BARGAIN_STATUS',
        payload: { offerId, status, agreedPriceInr },
      }),
    });
  } catch {
    // Ignore network error in local dev
  }
}

export async function syncAdminOrderUpdateBackend(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('orders').update({ status }).eq('id', orderId);
    } catch {
      // Ignore
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_ORDER_STATUS',
        payload: { orderId, status },
      }),
    });
  } catch {
    // Ignore
  }
}

export async function syncAdminBoardPriceBackend(
  boardId: string,
  newRawPriceInr: number
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('donor_boards')
        .update({ raw_board_price_inr: newRawPriceInr })
        .eq('id', boardId);
    } catch {
      // Ignore
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_BOARD_PRICE',
        payload: { boardId, newRawPriceInr },
      }),
    });
  } catch {
    // Ignore
  }
}

export async function syncAdminDeleteBoardBackend(boardId: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('harvestable_components').delete().eq('donor_board_id', boardId);
      await client.from('donor_boards').delete().eq('id', boardId);
    } catch {
      // Ignore
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_BOARD',
        payload: { boardId },
      }),
    });
  } catch {
    // Ignore
  }
}

export async function syncCreateSupportTicketBackend(
  ticket: SupportTicketRecord
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('support_tickets').upsert(ticket, { onConflict: 'id' });
    } catch {
      // Optional table
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CREATE_SUPPORT',
        payload: { ticket },
      }),
    });
  } catch {
    // Ignore
  }
}

export async function syncUserAccountBackend(user: UserProfile): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('user_profiles').upsert(user, { onConflict: 'id' });
    } catch {
      // Optional table
    }
  }
  try {
    await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SYNC_USER',
        payload: { user },
      }),
    });
  } catch {
    // Ignore
  }
}
