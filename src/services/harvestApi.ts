import {
  getSupabaseClient,
  mapDbBoardToBoard,
  mapDbComponentToComponent,
  mapDbOrderToOrder,
  mapDbProfileToProfile,
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
} from '../types/harvest';

// Clean default unauthenticated profile (zero fake demo personas)
export const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'USR-LOCAL',
  email: '',
  fullName: '',
  role: 'BUYER_STUDENT',
  organization: '',
  phone: '',
  defaultAddress: '',
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
  donorBoardId: string;
  componentId: string | null;
  mode: OrderMode;
  deliveryType: DeliveryType;
  itemPriceInr: number;
  extractionFeeInr: number;
  deliveryFeeInr: number;
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

  if (params.upiUtrOrPaymentId) {
    await client
      .from('orders')
      .update({ upi_utr_or_payment_id: params.upiUtrOrPaymentId })
      .eq('id', data.id);
    data.upi_utr_or_payment_id = params.upiUtrOrPaymentId;
  }

  return mapDbOrderToOrder(data);
}

/**
 * Seller Auto-BoM Upload -> Insert parent row into `donor_boards` and bulk-insert child rows into `harvestable_components`
 */
export async function supabasePublishDonorBoard(input: {
  boardName: string;
  category: BoardCategory;
  sellerName: string;
  locationArea: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  components: (BoardTemplateComponent & { isPrimaryFault: boolean })[];
}): Promise<{ board: DonorBoard; components: HarvestableComponent[] } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const intactCount = input.components.filter((c) => !c.isPrimaryFault).length;
  const city = input.locationArea.toLowerCase().includes('bengaluru')
    ? 'Bengaluru'
    : 'Chennai';

  const { data: boardRow, error: boardErr } = await client
    .from('donor_boards')
    .insert({
      board_name: input.boardName,
      category: input.category,
      seller_name: input.sellerName,
      primary_fault: input.primaryFault,
      raw_board_price_inr: input.rawBoardPriceInr,
      status: 'AVAILABLE',
      location_city: city,
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
 * Supabase Auth Sign-In with Email & Password
 */
export async function supabaseSignInWithEmail(
  email: string,
  password: string
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      profile: null,
      error: 'Supabase connection is not configured yet. Connect your Supabase project or onboard your profile in the Profile Setup tab.',
    };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { profile: null, error: error?.message || 'Sign in failed' };
  }

  const { data: profRow } = await client
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (profRow) {
    return { profile: mapDbProfileToProfile(profRow), error: null };
  }

  const meta = data.user.user_metadata || {};
  return {
    profile: {
      id: data.user.id,
      email: data.user.email || email,
      fullName: meta.full_name || email.split('@')[0],
      role: (meta.role as UserRole) || 'BUYER_STUDENT',
      organization: meta.organization || '',
      phone: meta.phone || '',
      defaultAddress: meta.default_address || '',
      walletBalanceInr: 0,
      isSupabaseAuthenticated: true,
    },
    error: null,
  };
}

/**
 * Supabase Auth Sign-Up with Email, Password, Role, Phone & Campus Address
 */
export async function supabaseSignUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  organization: string;
  phone: string;
  defaultAddress: string;
}): Promise<{ profile: UserProfile | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      profile: null,
      error: 'Supabase connection is not configured yet. Connect your Supabase project or onboard your profile in the Profile Setup tab.',
    };
  }

  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        role: params.role,
        organization: params.organization,
        phone: params.phone,
        default_address: params.defaultAddress,
      },
    },
  });

  if (error || !data.user) {
    return { profile: null, error: error?.message || 'Sign up failed' };
  }

  const { data: insertedProf } = await client
    .from('profiles')
    .upsert(
      {
        auth_user_id: data.user.id,
        email: params.email,
        full_name: params.fullName,
        role: params.role,
        organization: params.organization,
        phone: params.phone,
        default_address: params.defaultAddress,
      },
      { onConflict: 'email' }
    )
    .select('*')
    .maybeSingle();

  if (insertedProf) {
    return { profile: mapDbProfileToProfile(insertedProf), error: null };
  }

  return {
    profile: {
      id: data.user.id,
      email: params.email,
      fullName: params.fullName,
      role: params.role,
      organization: params.organization,
      phone: params.phone,
      defaultAddress: params.defaultAddress,
      walletBalanceInr: 0,
      isSupabaseAuthenticated: true,
    },
    error: null,
  };
}

/**
 * Supabase Google OAuth Sign-In
 */
export async function supabaseSignInWithGoogle(): Promise<{
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      error: 'Supabase connection is not configured yet. Configure your Supabase project URL & Anon Key first.',
    };
  }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}
