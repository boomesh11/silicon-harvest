import {
  getSupabaseClient,
  mapDbBoardToBoard,
  mapDbComponentToComponent,
  mapDbOrderToOrder,
  mapDbProfileToProfile,
  mapDbTicketToTicket,
} from '../lib/supabase';
import {
  DonorBoard,
  HarvestableComponent,
  Order,
  UserProfile,
  UserRole,
  BoardCategory,
  BoardTemplateComponent,
  OrderMode,
  DeliveryType,
  SupportTicket,
} from '../types/harvest';

// Clean default unauthenticated guest profile
export const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'USR-GUEST',
  email: '',
  fullName: '',
  role: 'BUYER_STUDENT',
  organization: '',
  phone: '',
  defaultAddress: '',
  state: 'Tamil Nadu',
  district: 'Chennai',
  pincode: '600001',
  walletBalanceInr: 0,
  isSupabaseAuthenticated: false,
};

export interface FullDatasetSnapshot {
  boards: DonorBoard[];
  components: HarvestableComponent[];
  orders: Order[];
  techWalletBalanceInr: number;
  techCompletedJobsCount: number;
}

/**
 * Fetch all live tables from Supabase PostgreSQL.
 */
export async function fetchSupabaseDataset(): Promise<FullDatasetSnapshot | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const [boardsRes, compsRes, ordersRes] = await Promise.all([
    client
      .from('donor_boards')
      .select('*')
      .order('created_at', { ascending: false }),
    client
      .from('harvestable_components')
      .select('*')
      .order('created_at', { ascending: true }),
    client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (boardsRes.error || compsRes.error || ordersRes.error) {
    throw new Error(
      boardsRes.error?.message ||
        compsRes.error?.message ||
        ordersRes.error?.message ||
        'Supabase table query failed'
    );
  }

  const boards = (boardsRes.data || []).map(mapDbBoardToBoard);
  const components = (compsRes.data || []).map(mapDbComponentToComponent);
  const orders = (ordersRes.data || []).map(mapDbOrderToOrder);

  const completedExtractions = orders.filter(
    (o) =>
      o.mode === 'EXTRACTED_TESTED_PART' &&
      (o.status === 'READY_FOR_DISPATCH' || o.status === 'COMPLETED')
  );
  const techCompletedJobsCount = completedExtractions.length;
  const techWalletBalanceInr = Number(
    completedExtractions
      .reduce((sum, o) => sum + o.extractionFeeInr * 0.7, 0)
      .toFixed(2)
  );

  return {
    boards,
    components,
    orders,
    techWalletBalanceInr,
    techCompletedJobsCount,
  };
}

/**
 * Call the PostgreSQL Atomic Checkout RPC `place_salvage_order`
 */
export async function supabasePlaceSalvageOrder(params: {
  orderCode: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerState?: string;
  buyerDistrict?: string;
  buyerPincode?: string;
  donorBoardId: string;
  componentId: string | null;
  mode: OrderMode;
  deliveryType: DeliveryType;
  logisticsPartner?: string;
  itemPriceInr: number;
  extractionFeeInr: number;
  deliveryFeeInr: number;
  platformCommissionInr?: number;
  totalPayableInr: number;
  upiUtrOrPaymentId?: string;
}): Promise<Order | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc('place_salvage_order', {
    p_order_code: params.orderCode,
    p_buyer_name: params.buyerName,
    p_buyer_phone: params.buyerPhone,
    p_buyer_address: params.buyerAddress,
    p_donor_board_id: params.donorBoardId,
    p_component_id: params.componentId,
    p_mode: params.mode,
    p_delivery_type: params.deliveryType,
    p_item_price_inr: params.itemPriceInr,
    p_extraction_fee_inr: params.extractionFeeInr,
    p_delivery_fee_inr: params.deliveryFeeInr,
    p_total_payable_inr: params.totalPayableInr,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  // Enrich order with district, logistics partner, platform commission and payment UTR
  const enrichPayload: Record<string, any> = {};
  if (params.buyerState) enrichPayload.buyer_state = params.buyerState;
  if (params.buyerDistrict) enrichPayload.buyer_district = params.buyerDistrict;
  if (params.buyerPincode) enrichPayload.buyer_pincode = params.buyerPincode;
  if (params.logisticsPartner) enrichPayload.logistics_partner = params.logisticsPartner;
  if (params.platformCommissionInr !== undefined) enrichPayload.platform_commission_inr = params.platformCommissionInr;
  if (params.upiUtrOrPaymentId) {
    enrichPayload.payment_utr = params.upiUtrOrPaymentId;
    enrichPayload.upi_utr_or_payment_id = params.upiUtrOrPaymentId;
  }

  if (Object.keys(enrichPayload).length > 0) {
    await client
      .from('orders')
      .update(enrichPayload)
      .eq('id', data.id);
    Object.assign(data, enrichPayload);
  }

  return mapDbOrderToOrder(data);
}

/**
 * Seller Auto-BoM Upload -> Insert parent row into `donor_boards` and bulk-insert child rows into `harvestable_components`
 */
export async function supabasePublishDonorBoard(input: {
  boardName: string;
  category: BoardCategory;
  subModel?: string;
  sellerName: string;
  sellerPhone?: string;
  sellerState?: string;
  sellerDistrict?: string;
  sellerPincode?: string;
  locationArea: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  imageUrl?: string;
  components: (BoardTemplateComponent & { isPrimaryFault: boolean })[];
}): Promise<{ board: DonorBoard; components: HarvestableComponent[] } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const intactCount = input.components.filter((c) => !c.isPrimaryFault).length;
  const district = input.sellerDistrict || 'Chennai';
  const state = input.sellerState || 'Tamil Nadu';

  const { data: boardRow, error: boardErr } = await client
    .from('donor_boards')
    .insert({
      board_name: input.boardName,
      category: input.category,
      sub_model: input.subModel || null,
      seller_name: input.sellerName,
      seller_phone: input.sellerPhone || null,
      seller_state: state,
      seller_district: district,
      seller_pincode: input.sellerPincode || '600001',
      primary_fault: input.primaryFault,
      raw_board_price_inr: input.rawBoardPriceInr,
      status: 'AVAILABLE',
      image_url: input.imageUrl || null,
      location_city: district,
      location_area: input.locationArea,
      distance_km: input.distanceKm,
      total_components_count: input.components.length,
      intact_components_count: intactCount,
    })
    .select('*')
    .single();

  if (boardErr || !boardRow) {
    throw new Error(boardErr?.message || 'Failed to insert donor board');
  }

  const childPayloads = input.components.map((c) => ({
    donor_board_id: boardRow.id,
    part_number: c.partNumber,
    part_name: c.partName,
    component_category: c.componentCategory,
    package_type: c.packageType,
    difficulty: c.difficulty,
    recommended_temp_c: c.recommendedTempC,
    part_price_inr: c.partPriceInr,
    extraction_fee_inr: c.extractionFeeInr,
    bypass_hack_tip: c.bypassHackTip || null,
    status: c.isPrimaryFault ? 'FAULTY_ON_ARRIVAL' : 'INTACT',
  }));

  const { data: compRows, error: compErr } = await client
    .from('harvestable_components')
    .insert(childPayloads)
    .select('*');

  if (compErr) {
    throw new Error(compErr.message);
  }

  return {
    board: mapDbBoardToBoard(boardRow),
    components: (compRows || []).map(mapDbComponentToComponent),
  };
}

/**
 * Technician Workbench -> Update `orders.status = 'READY_FOR_DISPATCH'`, save multimeter reading & tracking link
 */
export async function supabaseCompleteExtractionJob(
  orderId: string,
  multimeterReading: string,
  trackingOrPorterLink: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const updatePayload: Record<string, any> = {
    status: 'READY_FOR_DISPATCH',
    multimeter_reading_value: multimeterReading,
  };
  if (trackingOrPorterLink.trim() !== '') {
    updatePayload.tracking_or_porter_link = trackingOrPorterLink.trim();
  }

  const { error: orderErr } = await client
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId);

  if (orderErr) {
    throw new Error(orderErr.message);
  }
}

/**
 * Update `orders.tracking_or_porter_link` directly
 */
export async function supabaseUpdateOrderTracking(
  orderId: string,
  trackingOrPorterLink: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client
    .from('orders')
    .update({ tracking_or_porter_link: trackingOrPorterLink.trim() })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Mark an order as COMPLETED
 */
export async function supabaseMarkOrderCompleted(orderId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  await client.from('orders').update({ status: 'COMPLETED' }).eq('id', orderId);
}

/**
 * Customer Support Tickets: Insert & List
 */
export async function supabaseCreateSupportTicket(params: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderCode?: string;
  category: string;
  message: string;
}): Promise<SupportTicket> {
  const client = getSupabaseClient();
  const ticketCode = `SUP-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  if (!client) {
    return {
      id: `LOCAL-SUP-${Date.now()}`,
      ticketCode,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      orderCode: params.orderCode,
      category: params.category,
      message: params.message,
      status: 'OPEN',
      createdAt: now,
    };
  }

  const { data, error } = await client
    .from('support_tickets')
    .insert({
      ticket_code: ticketCode,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail || null,
      order_code: params.orderCode || null,
      category: params.category,
      message: params.message,
      status: 'OPEN',
    })
    .select('*')
    .single();

  if (error || !data) {
    // Graceful fallback to local ticket representation
    return {
      id: `LOCAL-SUP-${Date.now()}`,
      ticketCode,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      orderCode: params.orderCode,
      category: params.category,
      message: params.message,
      status: 'OPEN',
      createdAt: now,
    };
  }

  return mapDbTicketToTicket(data);
}

export async function supabaseFetchSupportTickets(): Promise<SupportTicket[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbTicketToTicket);
}

// ============================================================================
// AUTHENTICATION LAYER
// Never hard-redirects to raw Supabase error pages. Every flow ends with a
// profile upserted into public.profiles + a persisted local session.
// ============================================================================

const ENV = (import.meta as any).env || {};

/** Google OAuth via Supabase is only used when explicitly enabled. */
export const GOOGLE_OAUTH_ENABLED = ENV.VITE_GOOGLE_OAUTH_ENABLED === 'true';

/** Phone placeholder email (profiles.email is UNIQUE NOT NULL). */
function phoneToPlaceholderEmail(digits10: string): string {
  return `91${digits10}@phone.siliconharvest.in`;
}

function normalizeIndianPhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

/**
 * Upsert a profile row in public.profiles (keyed on email) and return the
 * mapped profile. Falls back to the given profile if the DB is unreachable,
 * so the user is never blocked from signing in.
 */
export async function upsertProfileRecord(
  profile: Omit<UserProfile, 'id' | 'walletBalanceInr'> & {
    id?: string;
    authUserId?: string | null;
  }
): Promise<UserProfile> {
  const fallback: UserProfile = {
    id: profile.id || profile.authUserId || `USR-${Date.now().toString(36).toUpperCase()}`,
    email: profile.email,
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
    role: profile.role,
    organization: profile.organization || '',
    phone: profile.phone || '',
    defaultAddress: profile.defaultAddress || '',
    state: profile.state || 'Tamil Nadu',
    district: profile.district || 'Chennai',
    pincode: profile.pincode || '600001',
    walletBalanceInr: 0,
    isSupabaseAuthenticated: !!profile.isSupabaseAuthenticated,
    authMethod: profile.authMethod,
  };

  const client = getSupabaseClient();
  if (!client) return fallback;

  // Preserve existing location / phone details if the row already exists.
  const { data: existing } = await client
    .from('profiles')
    .select('*')
    .eq('email', profile.email)
    .maybeSingle();

  const row: Record<string, any> = {
    email: profile.email,
    full_name: profile.fullName || existing?.full_name || 'Customer',
    role: existing?.role || profile.role,
    organization: profile.organization || existing?.organization || '',
    phone: profile.phone || existing?.phone || '',
    default_address: profile.defaultAddress || existing?.default_address || '',
    state: existing?.state || profile.state || 'Tamil Nadu',
    district: existing?.district || profile.district || 'Chennai',
    pincode: existing?.pincode || profile.pincode || '600001',
    auth_method: profile.authMethod || 'EMAIL',
    last_login_at: new Date().toISOString(),
  };
  if (profile.authUserId) row.auth_user_id = profile.authUserId;

  const { data, error } = await client
    .from('profiles')
    .upsert(row, { onConflict: 'email' })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('[auth] profile upsert failed:', error.message);
    return existing
      ? { ...mapDbProfileToProfile(existing), authMethod: profile.authMethod, isSupabaseAuthenticated: !!profile.isSupabaseAuthenticated }
      : fallback;
  }

  return {
    ...mapDbProfileToProfile(data),
    authMethod: profile.authMethod,
    isSupabaseAuthenticated: !!profile.isSupabaseAuthenticated,
  };
}

/** Persist profile edits (state/district/address/phone) to public.profiles. */
export async function supabaseUpdateProfile(profile: UserProfile): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !profile.email) return;
  const { error } = await client
    .from('profiles')
    .update({
      full_name: profile.fullName,
      phone: profile.phone,
      role: profile.role,
      default_address: profile.defaultAddress,
      state: profile.state,
      district: profile.district,
      pincode: profile.pincode,
    })
    .eq('email', profile.email);
  if (error) console.warn('[auth] profile update failed:', error.message);
}

/**
 * Email & Password Sign-In.
 * If Supabase reports "Email not confirmed" (password was correct but the
 * confirmation link hasn't been clicked), the user is still signed in from
 * their public.profiles record instead of being blocked.
 */
export async function supabaseSignInWithEmail(
  email: string,
  password: string
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();
  if (!client) {
    return { profile: null, error: 'Sign-in service is temporarily unavailable. Please try again.' };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('not confirmed')) {
      const profile = await upsertProfileRecord({
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: 'BUYER_STUDENT',
        organization: '',
        phone: '',
        defaultAddress: '',
        authMethod: 'EMAIL_UNCONFIRMED',
        isSupabaseAuthenticated: false,
      });
      return { profile, error: null };
    }
    if (msg.includes('invalid login')) {
      return { profile: null, error: 'Incorrect email or password. New here? Switch to "Create Account".' };
    }
    return { profile: null, error: error.message };
  }

  const meta = data.user?.user_metadata || {};
  const profile = await upsertProfileRecord({
    email: cleanEmail,
    fullName: meta.full_name || cleanEmail.split('@')[0],
    role: (meta.role as UserRole) || 'BUYER_STUDENT',
    organization: meta.organization || '',
    phone: meta.phone || '',
    defaultAddress: meta.default_address || '',
    state: meta.state,
    district: meta.district,
    pincode: meta.pincode,
    authUserId: data.user?.id,
    authMethod: 'EMAIL',
    isSupabaseAuthenticated: true,
  });
  return { profile, error: null };
}

/**
 * Email & Password Sign-Up.
 * If "Confirm Email" is enabled (no session returned) or the email sender is
 * rate-limited, the profile is still upserted and the user is logged in
 * immediately — they are never stuck waiting for a confirmation link.
 */
export async function supabaseSignUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  organization: string;
  phone: string;
  defaultAddress: string;
  state?: string;
  district?: string;
  pincode?: string;
}): Promise<{ profile: UserProfile | null; error: string | null }> {
  const client = getSupabaseClient();
  const cleanEmail = params.email.trim().toLowerCase();
  if (params.password.length < 6) {
    return { profile: null, error: 'Password must be at least 6 characters.' };
  }

  let authUserId: string | null = null;
  let hasSession = false;

  if (client) {
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          full_name: params.fullName,
          role: params.role,
          organization: params.organization,
          phone: params.phone,
          default_address: params.defaultAddress,
          state: params.state || 'Tamil Nadu',
          district: params.district || 'Chennai',
          pincode: params.pincode || '600001',
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return { profile: null, error: 'This email is already registered. Please use "Sign In" instead.' };
      }
      if (msg.includes('password')) {
        return { profile: null, error: error.message };
      }
      // Rate limit / email sender issues: continue with profile-based login.
      console.warn('[auth] signUp soft-failed, continuing with profile session:', error.message);
    } else {
      authUserId = data.user?.id || null;
      hasSession = !!data.session;
    }
  }

  const profile = await upsertProfileRecord({
    email: cleanEmail,
    fullName: params.fullName.trim(),
    role: params.role,
    organization: params.organization,
    phone: params.phone,
    defaultAddress: params.defaultAddress,
    state: params.state,
    district: params.district,
    pincode: params.pincode,
    authUserId,
    authMethod: hasSession ? 'EMAIL' : 'EMAIL_UNCONFIRMED',
    isSupabaseAuthenticated: hasSession,
  });
  return { profile, error: null };
}

// ---------------------------------------------------------------------------
// Mobile OTP with on-screen fallback when no SMS gateway is configured
// ---------------------------------------------------------------------------

const pendingOnScreenOtps = new Map<string, { code: string; expiresAt: number }>();

function generateSixDigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + (buf[0] % 900000));
}

/**
 * Sends a phone OTP. Tries Supabase SMS first; if no SMS provider is
 * configured (or it errors), generates a 6-digit code returned as
 * `onScreenCode` for display in an in-app notification toast.
 */
export async function supabaseSendPhoneOtp(
  phone: string
): Promise<{ error: string | null; onScreenCode?: string }> {
  const digits = normalizeIndianPhone(phone);
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
    return { error: 'Please enter a valid 10-digit Indian mobile number (starting 6–9).' };
  }

  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.auth.signInWithOtp({ phone: `+91${digits}` });
    if (!error) {
      pendingOnScreenOtps.delete(digits);
      return { error: null };
    }
    console.warn('[auth] SMS provider unavailable, using on-screen code:', error.message);
  }

  const code = generateSixDigitCode();
  pendingOnScreenOtps.set(digits, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { error: null, onScreenCode: code };
}

export async function supabaseVerifyPhoneOtp(
  phone: string,
  token: string,
  fullName = '',
  district = 'Chennai',
  state = 'Tamil Nadu'
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const digits = normalizeIndianPhone(phone);
  const code = token.replace(/\D/g, '');
  const name = fullName.trim() || `Customer ${digits.slice(-4)}`;
  const pending = pendingOnScreenOtps.get(digits);

  // On-screen fallback path
  if (pending) {
    if (Date.now() > pending.expiresAt) {
      pendingOnScreenOtps.delete(digits);
      return { profile: null, error: 'Code expired. Please request a new verification code.' };
    }
    if (pending.code !== code) {
      return { profile: null, error: 'Incorrect verification code. Please try again.' };
    }
    pendingOnScreenOtps.delete(digits);
    const profile = await upsertProfileRecord({
      email: phoneToPlaceholderEmail(digits),
      fullName: name,
      role: 'BUYER_STUDENT',
      organization: '',
      phone: `+91 ${digits}`,
      defaultAddress: `${district}, ${state}`,
      state,
      district,
      authMethod: 'PHONE_ONSCREEN',
      isSupabaseAuthenticated: false,
    });
    return { profile, error: null };
  }

  // Real Supabase SMS path
  const client = getSupabaseClient();
  if (!client) return { profile: null, error: 'Please request a new verification code.' };
  const { data, error } = await client.auth.verifyOtp({
    phone: `+91${digits}`,
    token: code,
    type: 'sms',
  });
  if (error || !data.user) {
    return { profile: null, error: error?.message || 'OTP verification failed' };
  }
  const profile = await upsertProfileRecord({
    email: data.user.email || phoneToPlaceholderEmail(digits),
    fullName: name,
    role: 'BUYER_STUDENT',
    organization: '',
    phone: `+91 ${digits}`,
    defaultAddress: '',
    authUserId: data.user.id,
    authMethod: 'PHONE_SMS',
    isSupabaseAuthenticated: true,
  });
  return { profile, error: null };
}

// ---------------------------------------------------------------------------
// Google OAuth (Direct Native Redirect)
// ---------------------------------------------------------------------------

/**
 * Direct Native Supabase Google OAuth Redirect.
 * Navigates straight to Google's account chooser and redirects back to window.location.origin.
 */
export async function supabaseSignInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const client = getSupabaseClient();
    if (!client) return { error: 'Sign-in service is temporarily unavailable.' };
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Google OAuth sign-in failed' };
  }
}

/**
 * Restore a real Supabase OAuth session after redirect.
 */
export async function restoreSupabaseAuthSession(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user || !user.email) return null;
  const meta = user.user_metadata || {};
  const provider = (user.app_metadata?.provider as string) || 'email';
  const profile = await upsertProfileRecord({
    id: user.id,
    email: user.email.toLowerCase(),
    fullName: meta.full_name || meta.name || user.email.split('@')[0],
    avatarUrl: meta.avatar_url || meta.picture,
    role: 'BUYER_STUDENT',
    organization: '',
    phone: meta.phone || '',
    defaultAddress: '',
    authUserId: user.id,
    authMethod: provider === 'google' ? 'GOOGLE_OAUTH' : provider === 'phone' ? 'PHONE_SMS' : 'EMAIL',
    isSupabaseAuthenticated: true,
  });
  return {
    ...profile,
    id: user.id || profile.id,
    avatarUrl: meta.avatar_url || meta.picture || profile.avatarUrl,
  };
}
