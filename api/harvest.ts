import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_DONOR_BOARDS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
  INITIAL_BARGAINS,
} from '../src/data/seedData';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder.supabase.co';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'placeholder-key';

const isConfigured =
  Boolean(supabaseUrl && supabaseKey) &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseKey !== 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

function mapBoardToRow(board: any) {
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
    location_city: board.locationCity || board.sellerDistrict || 'Chennai',
    location_area: board.locationArea || 'Guindy',
    distance_km: board.distanceKm ?? 2.5,
    primary_fault: board.primaryFault,
    raw_board_price_inr: board.rawBoardPriceInr,
    desoldered_price_inr: board.desolderedPriceInr || board.rawBoardPriceInr,
    hardware_mode: board.hardwareMode || 'BOTH',
    allow_bargain: board.allowBargain ?? true,
    is_verified: board.isVerified ?? true,
    status: board.status || 'AVAILABLE',
    total_components_count: board.totalComponentsCount ?? 1,
    image_url: board.imageUrl || '/assets/3d/hero-pcb.png',
    created_at: board.createdAt || new Date().toISOString(),
  };
}

function mapComponentToRow(comp: any) {
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
    status: comp.status || 'INTACT',
  };
}

function mapRowToBoard(row: any) {
  return {
    id: row.id,
    boardName: row.board_name ?? row.boardName,
    category: row.category || 'IC_MICROCONTROLLERS',
    subModel: row.sub_model ?? row.subModel ?? row.board_name,
    sellerName: row.seller_name ?? row.sellerName ?? 'Verified Seller',
    sellerPhone: row.seller_phone ?? row.sellerPhone ?? '+91 7200255069',
    sellerState: row.seller_state ?? row.sellerState ?? 'Tamil Nadu',
    sellerDistrict: row.seller_district ?? row.sellerDistrict ?? row.location_city ?? 'Chennai',
    sellerPincode: row.seller_pincode ?? row.sellerPincode ?? '600025',
    sellerFullAddress:
      row.seller_full_address ?? row.sellerFullAddress ?? `${row.location_area || 'Main Area'}, ${row.location_city || 'Chennai'}`,
    locationCity: row.location_city ?? row.locationCity ?? 'Chennai',
    locationArea: row.location_area ?? row.locationArea ?? 'Guindy',
    distanceKm: Number(row.distance_km ?? row.distanceKm ?? 2.5),
    primaryFault: row.primary_fault ?? row.primaryFault ?? 'Tested Harvestable Assembly',
    rawBoardPriceInr: Number(row.raw_board_price_inr ?? row.rawBoardPriceInr ?? 50),
    desolderedPriceInr: Number(
      row.desoldered_price_inr ?? row.desolderedPriceInr ?? row.raw_board_price_inr ?? 65
    ),
    hardwareMode: row.hardware_mode ?? row.hardwareMode ?? 'BOTH',
    allowBargain: row.allow_bargain ?? row.allowBargain ?? true,
    isVerified: Boolean(row.is_verified ?? row.isVerified ?? true),
    status: row.status ?? 'AVAILABLE',
    totalComponentsCount: Number(row.total_components_count ?? row.totalComponentsCount ?? 1),
    imageUrl: row.image_url ?? row.imageUrl ?? '/assets/3d/hero-pcb.png',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function mapRowToComponent(row: any) {
  return {
    id: row.id,
    donorBoardId: row.donor_board_id ?? row.donorBoardId,
    partNumber: row.part_number ?? row.partNumber,
    partName: row.part_name ?? row.partName,
    componentCategory: row.component_category ?? row.componentCategory ?? 'Electronic Spare',
    packageType: row.package_type ?? row.packageType ?? 'SMD / Through-Hole',
    difficulty: row.difficulty ?? 'LEVEL_2_THROUGH_HOLE',
    recommendedTempC: Number(row.recommended_temp_c ?? row.recommendedTempC ?? 300),
    partPriceInr: Number(row.part_price_inr ?? row.partPriceInr ?? 25),
    extractionFeeInr: Number(row.extraction_fee_inr ?? row.extractionFeeInr ?? 20),
    bypassHackTip: row.bypass_hack_tip ?? row.bypassHackTip ?? undefined,
    status: row.status ?? 'INTACT',
  };
}

function mapRowToOrder(row: any) {
  const itemPrice = Number(row.item_price_inr ?? row.itemPriceInr ?? 0);
  const extractionFee = Number(row.extraction_fee_inr ?? row.extractionFeeInr ?? 0);
  const deliveryFee = Number(row.delivery_fee_inr ?? row.deliveryFeeInr ?? 35);
  const totalPayable = Number(
    row.total_payable_inr ??
      row.total_price_inr ??
      row.totalPayableInr ??
      itemPrice + extractionFee + deliveryFee
  );
  return {
    id: row.id,
    orderCode: row.order_code ?? row.orderCode ?? `SH-ORD-${String(row.id).slice(-4)}`,
    donorBoardId: row.donor_board_id ?? row.donorBoardId,
    componentId: row.component_id ?? row.componentId ?? null,
    mode: row.mode ?? 'DESOLDERED_PART',
    status: row.status ?? 'ESCROW_HELD',
    itemPriceInr: itemPrice,
    extractionFeeInr: extractionFee,
    deliveryFeeInr: deliveryFee,
    platformCommissionInr: Number(
      row.platform_commission_inr ??
        row.platformCommissionInr ??
        Math.round((itemPrice + extractionFee) * 0.1)
    ),
    totalPayableInr: totalPayable,
    totalPriceInr: totalPayable,
    deliveryType: row.delivery_type ?? row.deliveryType ?? 'HYPERLOCAL_BIKE',
    logisticsPartner: row.logistics_partner ?? row.logisticsPartner ?? 'Rapido Local Parcel',
    multimeterReadingValue: row.multimeter_reading_value ?? row.multimeterReadingValue ?? 'Verified Continuity',
    buyerName: row.buyer_name ?? row.buyerName ?? 'Verified Buyer',
    buyerPhone: row.buyer_phone ?? row.buyerPhone ?? '+91 7200255069',
    buyerAddress: row.buyer_address ?? row.buyerAddress ?? 'Chennai, Tamil Nadu',
    buyerDistrict: row.buyer_district ?? row.buyerDistrict ?? 'Chennai',
    buyerPincode: row.buyer_pincode ?? row.buyerPincode ?? '600025',
    upiUtrOrPaymentId: row.upi_utr_or_payment_id ?? row.upiUtrOrPaymentId ?? 'UPI-ESCROW-VERIFIED',
    isProOrder: Boolean(row.is_pro_order ?? row.isProOrder ?? false),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET /api/harvest -> Fetch all cloud state & auto-bootstrap if empty
    if (req.method === 'GET') {
      if (!isConfigured) {
        return res.status(200).json({
          source: 'SEED_FALLBACK',
          donorBoards: INITIAL_DONOR_BOARDS,
          components: INITIAL_COMPONENTS,
          orders: INITIAL_ORDERS,
          bargains: INITIAL_BARGAINS,
          supportTickets: [],
        });
      }

      const { data: boardsData, error: bErr } = await supabase
        .from('donor_boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (bErr) {
        return res.status(200).json({
          source: 'SEED_FALLBACK',
          donorBoards: [],
          components: [],
          orders: [],
          bargains: [],
          supportTickets: [],
        });
      }

      const [compRes, ordRes, bargRes, supRes] = await Promise.all([
        supabase.from('harvestable_components').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('bargain_offers').select('*').order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
      ]);

      return res.status(200).json({
        source: 'SUPABASE_CLOUD',
        donorBoards: boardsData ? boardsData.map(mapRowToBoard) : [],
        components: compRes.data ? compRes.data.map(mapRowToComponent) : [],
        orders: ordRes.data ? ordRes.data.map(mapRowToOrder) : [],
        bargains: bargRes.data || [],
        supportTickets: supRes.data || [],
      });
    }

    // 2. POST /api/harvest -> Create Board, Order, Bargain, Account, or Support Ticket
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { action, payload } = body;

      if (!isConfigured) {
        return res.status(200).json({ ok: true, mode: 'LOCAL_SYNC', action });
      }

      if (action === 'CREATE_BOARD' && payload?.board) {
        await supabase.from('donor_boards').upsert(mapBoardToRow(payload.board), { onConflict: 'id' });
        if (Array.isArray(payload.components) && payload.components.length > 0) {
          await supabase
            .from('harvestable_components')
            .upsert(payload.components.map(mapComponentToRow), { onConflict: 'id' });
        }
        return res.status(200).json({ ok: true, action });
      }

      if (action === 'CREATE_ORDER' && payload?.order) {
        const ord = payload.order;
        await supabase.from('orders').upsert(
          {
            id: ord.id,
            order_code: ord.orderCode,
            donor_board_id: ord.donorBoardId,
            component_id: ord.componentId,
            mode: ord.mode,
            status: ord.status,
            item_price_inr: ord.itemPriceInr,
            extraction_fee_inr: ord.extractionFeeInr,
            delivery_fee_inr: ord.deliveryFeeInr,
            platform_commission_inr: ord.platformCommissionInr,
            total_payable_inr: ord.totalPayableInr,
            total_price_inr: ord.totalPriceInr,
            delivery_type: ord.deliveryType,
            logistics_partner: ord.logisticsPartner,
            multimeter_reading_value: ord.multimeterReadingValue,
            buyer_name: ord.buyerName,
            buyer_phone: ord.buyerPhone,
            buyer_address: ord.buyerAddress,
            buyer_district: ord.buyerDistrict,
            buyer_pincode: ord.buyerPincode,
            upi_utr_or_payment_id: ord.upiUtrOrPaymentId,
            is_pro_order: ord.isProOrder,
            created_at: ord.createdAt,
          },
          { onConflict: 'id' }
        );

        if (ord.mode === 'RAW_DONOR_BOARD') {
          await supabase.from('donor_boards').update({ status: 'SOLD_RAW' }).eq('id', ord.donorBoardId);
          await supabase
            .from('harvestable_components')
            .update({ status: 'BOARD_SOLD_RAW' })
            .eq('donor_board_id', ord.donorBoardId)
            .eq('status', 'INTACT');
        } else if (ord.componentId) {
          await supabase
            .from('harvestable_components')
            .update({ status: 'HARVESTED' })
            .eq('id', ord.componentId);
        }
        return res.status(200).json({ ok: true, action });
      }

      if (action === 'CREATE_BARGAIN' && payload?.offer) {
        await supabase.from('bargain_offers').upsert(payload.offer, { onConflict: 'id' });
        return res.status(200).json({ ok: true, action });
      }

      if (action === 'CREATE_SUPPORT' && payload?.ticket) {
        await supabase.from('support_tickets').upsert(payload.ticket, { onConflict: 'id' });
        return res.status(200).json({ ok: true, action });
      }

      if (action === 'SYNC_USER' && payload?.user) {
        await supabase.from('user_profiles').upsert(payload.user, { onConflict: 'id' });
        return res.status(200).json({ ok: true, action });
      }

      return res.status(200).json({ ok: true, action });
    }

    // 3. PATCH /api/harvest -> Owner Admin mutations & Bargain status updates
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { action, payload } = body;

      if (!isConfigured) {
        return res.status(200).json({ ok: true, mode: 'LOCAL_SYNC', action });
      }

      if (action === 'UPDATE_ORDER_STATUS' && payload?.orderId) {
        await supabase.from('orders').update({ status: payload.status }).eq('id', payload.orderId);
      } else if (action === 'UPDATE_BOARD_PRICE' && payload?.boardId) {
        await supabase
          .from('donor_boards')
          .update({ raw_board_price_inr: payload.newRawPriceInr })
          .eq('id', payload.boardId);
      } else if (action === 'DELETE_BOARD' && payload?.boardId) {
        await supabase.from('harvestable_components').delete().eq('donor_board_id', payload.boardId);
        await supabase.from('donor_boards').delete().eq('id', payload.boardId);
      } else if (action === 'UPDATE_BARGAIN_STATUS' && payload?.offerId) {
        await supabase
          .from('bargain_offers')
          .update({ status: payload.status, agreedPriceInr: payload.agreedPriceInr })
          .eq('id', payload.offerId);
      } else if (action === 'UPDATE_TICKET_STATUS' && payload?.ticketId) {
        await supabase
          .from('support_tickets')
          .update({ status: payload.status })
          .eq('id', payload.ticketId);
      }

      return res.status(200).json({ ok: true, action });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    return res.status(200).json({
      source: 'FALLBACK_ON_ERROR',
      error: err?.message || 'Unexpected error',
      donorBoards: INITIAL_DONOR_BOARDS,
      components: INITIAL_COMPONENTS,
      orders: INITIAL_ORDERS,
      bargains: INITIAL_BARGAINS,
      supportTickets: [],
    });
  }
}

