import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DonorBoard,
  HarvestableComponent,
  Order,
  UserProfile,
  UserRole,
  BoardCategory,
  BoardStatus,
  ExtractionDifficulty,
  ComponentStatus,
  OrderMode,
  DeliveryType,
  OrderStatus,
  SupportTicket,
  C2CMessage,
} from '../types/harvest';

const RUNTIME_URL_KEY = 'silicon_harvest_supabase_url';
const RUNTIME_KEY_KEY = 'silicon_harvest_supabase_anon_key';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured in Vercel environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

let cachedClient: SupabaseClient | null = null;
let cachedConfigHash = '';

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  source: 'ENV' | 'LOCAL_STORAGE' | 'NONE';
} {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  try {
    const localUrl = (localStorage.getItem(RUNTIME_URL_KEY) || '').trim();
    const localKey = (localStorage.getItem(RUNTIME_KEY_KEY) || '').trim();

    if (localUrl && localKey && localUrl.startsWith('http')) {
      return { url: localUrl, anonKey: localKey, source: 'LOCAL_STORAGE' };
    }
  } catch {
    // ignore storage errors
  }

  if (
    envUrl &&
    envKey &&
    envUrl !== 'https://your-project-id.supabase.co' &&
    envUrl.startsWith('http')
  ) {
    return { url: envUrl, anonKey: envKey, source: 'ENV' };
  }

  return { url: '', anonKey: '', source: 'NONE' };
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem(RUNTIME_URL_KEY, url.trim());
  localStorage.setItem(RUNTIME_KEY_KEY, anonKey.trim());
  cachedClient = null;
  cachedConfigHash = '';
}

export function clearRuntimeSupabaseConfig() {
  localStorage.removeItem(RUNTIME_URL_KEY);
  localStorage.removeItem(RUNTIME_KEY_KEY);
  cachedClient = null;
  cachedConfigHash = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, source } = getSupabaseConfig();
  if (source === 'NONE' || !url || !anonKey) {
    return null;
  }

  const hash = `${url}::${anonKey}`;
  if (!cachedClient || cachedConfigHash !== hash) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    cachedConfigHash = hash;
  }
  return cachedClient;
}

// Snake_case DB row -> CamelCase TypeScript interfaces
export function mapDbBoardToBoard(row: Record<string, any>): DonorBoard {
  const area = String(row.location_area || 'Central District');
  const city = String(row.location_city || row.seller_district || 'Chennai');
  return {
    id: String(row.id),
    boardName: String(row.board_name),
    category: (row.category as BoardCategory) || 'IC_MICROCONTROLLERS',
    subModel: row.sub_model ? String(row.sub_model) : undefined,
    sellerName: String(row.seller_name || 'Verified Donor / Lab'),
    sellerPhone: row.seller_phone ? String(row.seller_phone) : undefined,
    sellerState: String(row.seller_state || 'Tamil Nadu'),
    sellerDistrict: String(row.seller_district || 'Chennai'),
    sellerPincode: String(row.seller_pincode || '600001'),
    locationCity: city,
    locationArea: area.toLowerCase().includes(city.toLowerCase())
      ? area
      : `${area}, ${city}`,
    distanceKm: Number(row.distance_km ?? 2.5),
    primaryFault: String(row.primary_fault),
    rawBoardPriceInr: Number(row.raw_board_price_inr ?? 0),
    status: (row.status as BoardStatus) || 'AVAILABLE',
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    totalComponentsCount: Number(row.total_components_count ?? 0),
    intactComponentsCount: Number(row.intact_components_count ?? 0),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapDbComponentToComponent(
  row: Record<string, any>
): HarvestableComponent {
  return {
    id: String(row.id),
    donorBoardId: String(row.donor_board_id),
    partNumber: String(row.part_number),
    partName: String(row.part_name),
    componentCategory: String(row.component_category),
    packageType: String(row.package_type),
    difficulty: (row.difficulty as ExtractionDifficulty) || 'LEVEL_2_BASIC_IRON',
    recommendedTempC: Number(row.recommended_temp_c ?? 300),
    partPriceInr: Number(row.part_price_inr ?? 0),
    extractionFeeInr: Number(row.extraction_fee_inr ?? 0),
    bypassHackTip: row.bypass_hack_tip ? String(row.bypass_hack_tip) : undefined,
    status: (row.status as ComponentStatus) || 'INTACT',
  };
}

export function mapDbOrderToOrder(row: Record<string, any>): Order {
  return {
    id: String(row.id),
    orderCode: String(row.order_code),
    buyerName: String(row.buyer_name),
    buyerPhone: String(row.buyer_phone),
    buyerAddress: String(row.buyer_address),
    buyerState: row.buyer_state ? String(row.buyer_state) : 'Tamil Nadu',
    buyerDistrict: row.buyer_district ? String(row.buyer_district) : 'Chennai',
    buyerPincode: row.buyer_pincode ? String(row.buyer_pincode) : '600001',
    donorBoardId: String(row.donor_board_id),
    componentId: row.component_id ? String(row.component_id) : null,
    mode: (row.mode as OrderMode) || 'EXTRACTED_TESTED_PART',
    deliveryType: (row.delivery_type as DeliveryType) || 'CAMPUS_HUB_PICKUP',
    logisticsPartner: row.logistics_partner ? String(row.logistics_partner) : 'RAPIDO',
    itemPriceInr: Number(row.item_price_inr ?? 0),
    extractionFeeInr: Number(row.extraction_fee_inr ?? 0),
    deliveryFeeInr: Number(row.delivery_fee_inr ?? 0),
    platformCommissionInr: Number(row.platform_commission_inr ?? 10),
    totalPayableInr: Number(row.total_payable_inr ?? 0),
    status: (row.status as OrderStatus) || 'PENDING_EXTRACTION',
    multimeterReadingValue: String(row.multimeter_reading_value || ''),
    trackingOrPorterLink: row.tracking_or_porter_link
      ? String(row.tracking_or_porter_link)
      : '',
    upiUtrOrPaymentId: row.payment_utr || row.upi_utr_or_payment_id || '',
    paymentUtr: row.payment_utr ? String(row.payment_utr) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapDbProfileToProfile(row: Record<string, any>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email || ''),
    fullName: String(row.full_name || 'Customer'),
    role: (row.role as UserRole) || 'BUYER_STUDENT',
    organization: String(row.organization || ''),
    phone: String(row.phone || ''),
    defaultAddress: String(row.default_address || ''),
    state: row.state ? String(row.state) : 'Tamil Nadu',
    district: row.district ? String(row.district) : 'Chennai',
    pincode: row.pincode ? String(row.pincode) : '600001',
    walletBalanceInr: Number(row.wallet_balance_inr ?? 0),
    isSupabaseAuthenticated: true,
  };
}

export function mapDbTicketToTicket(row: Record<string, any>): SupportTicket {
  return {
    id: String(row.id),
    ticketCode: String(row.ticket_code),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerEmail: row.customer_email ? String(row.customer_email) : undefined,
    orderCode: row.order_code ? String(row.order_code) : undefined,
    category: String(row.category),
    message: String(row.message),
    status: (row.status as any) || 'OPEN',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapDbC2CMessageToC2CMessage(
  row: Record<string, any>
): C2CMessage {
  return {
    id: String(row.id),
    boardId: row.board_id ? String(row.board_id) : undefined,
    boardName: row.board_name ? String(row.board_name) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    orderCode: row.order_code ? String(row.order_code) : undefined,
    senderId: String(row.sender_id),
    senderName: String(row.sender_name || 'Anonymous'),
    recipientId: String(row.recipient_id),
    recipientName: row.recipient_name ? String(row.recipient_name) : undefined,
    message: String(row.message || ''),
    offerPriceInr: row.offer_price_inr ? Number(row.offer_price_inr) : undefined,
    inquiryTag: row.inquiry_tag ? String(row.inquiry_tag) : undefined,
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}
