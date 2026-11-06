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
} from '../types/harvest';

const RUNTIME_URL_KEY = 'silicon_harvest_supabase_url';
const RUNTIME_KEY_KEY = 'silicon_harvest_supabase_anon_key';

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
  const area = String(row.location_area || 'Guindy Campus');
  const city = String(row.location_city || 'Chennai');
  return {
    id: String(row.id),
    boardName: String(row.board_name),
    category: (row.category as BoardCategory) || 'ACADEMIC_MAKER',
    sellerName: String(row.seller_name || 'Campus / Hub Seller'),
    locationCity: city,
    locationArea: area.toLowerCase().includes(city.toLowerCase())
      ? area
      : `${area}, ${city}`,
    distanceKm: Number(row.distance_km ?? 2.5),
    primaryFault: String(row.primary_fault),
    rawBoardPriceInr: Number(row.raw_board_price_inr ?? 0),
    status: (row.status as BoardStatus) || 'AVAILABLE',
    totalComponentsCount: Number(row.total_components_count ?? 0),
    intactComponentsCount: Number(row.intact_components_count ?? 0),
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
    donorBoardId: String(row.donor_board_id),
    componentId: row.component_id ? String(row.component_id) : null,
    mode: (row.mode as OrderMode) || 'EXTRACTED_TESTED_PART',
    deliveryType: (row.delivery_type as DeliveryType) || 'CAMPUS_HUB_PICKUP',
    itemPriceInr: Number(row.item_price_inr ?? 0),
    extractionFeeInr: Number(row.extraction_fee_inr ?? 0),
    deliveryFeeInr: Number(row.delivery_fee_inr ?? 0),
    totalPayableInr: Number(row.total_payable_inr ?? 0),
    status: (row.status as OrderStatus) || 'PENDING_EXTRACTION',
    multimeterReadingValue: String(row.multimeter_reading_value || ''),
    trackingOrPorterLink: row.tracking_or_porter_link
      ? String(row.tracking_or_porter_link)
      : '',
    upiUtrOrPaymentId: row.upi_utr_or_payment_id
      ? String(row.upi_utr_or_payment_id)
      : '',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

export function mapDbProfileToProfile(row: Record<string, any>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
    role: (row.role as UserRole) || 'BUYER_STUDENT',
    organization: String(row.organization || ''),
    phone: String(row.phone || ''),
    defaultAddress: String(row.default_address || ''),
    walletBalanceInr: Number(row.wallet_balance_inr ?? 0),
    isSupabaseAuthenticated: Boolean(row.auth_user_id),
  };
}
