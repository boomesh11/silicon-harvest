-- ============================================================================
-- SILICONHARVEST PRODUCTION SCHEMA: POSTGRESQL TABLES, RLS, REALTIME & ATOMIC RPC
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Zero Fake Inventory or Seed Rows — Ready for Live Production Use
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Buyer Students, Seller Labs, Extraction Technicians)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'BUYER_STUDENT' CHECK (role IN ('BUYER_STUDENT', 'SELLER_LAB', 'TECH_PARTNER')),
  organization TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  default_address TEXT DEFAULT '',
  wallet_balance_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  completed_jobs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DONOR BOARDS TABLE (Parent PCBs)
CREATE TABLE IF NOT EXISTS public.donor_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  category TEXT NOT NULL,
  seller_name TEXT NOT NULL DEFAULT '',
  seller_phone TEXT NOT NULL DEFAULT '',
  seller_state TEXT NOT NULL DEFAULT '',
  seller_district TEXT NOT NULL DEFAULT '',
  seller_pincode TEXT NOT NULL DEFAULT '',
  sub_model TEXT NOT NULL DEFAULT '',
  primary_fault TEXT NOT NULL,
  raw_board_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'PARTIALLY_HARVESTED', 'SOLD_RAW')),
  location_city TEXT NOT NULL DEFAULT 'Chennai',
  location_area TEXT NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL DEFAULT 2.5,
  image_url TEXT,
  total_components_count INTEGER NOT NULL DEFAULT 0,
  intact_components_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HARVESTABLE COMPONENTS TABLE (Child ICs & Connectors)
CREATE TABLE IF NOT EXISTS public.harvestable_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_board_id UUID NOT NULL REFERENCES public.donor_boards(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  component_category TEXT NOT NULL,
  package_type TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('LEVEL_1_PLUG_PULL', 'LEVEL_2_BASIC_IRON', 'LEVEL_3_HOT_AIR_SMD')),
  recommended_temp_c INTEGER NOT NULL DEFAULT 300,
  part_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  extraction_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bypass_hack_tip TEXT,
  status TEXT NOT NULL DEFAULT 'INTACT' CHECK (status IN ('INTACT', 'EXTRACTED_SOLD', 'FAULTY_ON_ARRIVAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ORDERS TABLE (Dual-Mode Orders, Multimeter QC, Tracking Link & UPI UTR)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  buyer_state TEXT DEFAULT '',
  buyer_district TEXT DEFAULT '',
  buyer_pincode TEXT DEFAULT '',
  donor_board_id UUID NOT NULL REFERENCES public.donor_boards(id) ON DELETE CASCADE,
  component_id UUID REFERENCES public.harvestable_components(id) ON DELETE SET NULL,
  mode TEXT NOT NULL CHECK (mode IN ('RAW_DONOR_BOARD', 'EXTRACTED_TESTED_PART')),
  delivery_type TEXT NOT NULL,
  logistics_partner TEXT DEFAULT '',
  platform_commission_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  item_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  extraction_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_payable_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_EXTRACTION' CHECK (status IN ('PENDING_EXTRACTION', 'READY_FOR_DISPATCH', 'COMPLETED')),
  multimeter_reading_value TEXT DEFAULT '',
  tracking_or_porter_link TEXT DEFAULT '',
  upi_utr_or_payment_id TEXT DEFAULT '',
  payment_utr TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_code TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_email TEXT NOT NULL,
  order_code TEXT DEFAULT '',
  category TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'MEDIUM',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ATOMIC CHECKOUT RPC FUNCTION: place_salvage_order
CREATE OR REPLACE FUNCTION public.place_salvage_order(
  p_order_code TEXT,
  p_buyer_name TEXT,
  p_buyer_phone TEXT,
  p_buyer_address TEXT,
  p_donor_board_id UUID,
  p_component_id UUID,
  p_mode TEXT,
  p_delivery_type TEXT,
  p_item_price_inr NUMERIC,
  p_extraction_fee_inr NUMERIC,
  p_delivery_fee_inr NUMERIC,
  p_total_payable_inr NUMERIC
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_board public.donor_boards;
  v_comp public.harvestable_components;
  v_new_order public.orders;
  v_initial_status TEXT;
  v_initial_reading TEXT;
BEGIN
  SELECT * INTO v_board
  FROM public.donor_boards
  WHERE id = p_donor_board_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donor board (%) not found', p_donor_board_id;
  END IF;

  IF p_mode = 'RAW_DONOR_BOARD' THEN
    IF v_board.status <> 'AVAILABLE' THEN
      RAISE EXCEPTION 'Donor board is already % and cannot be sold as a full raw board', v_board.status;
    END IF;

    UPDATE public.donor_boards
    SET status = 'SOLD_RAW',
        intact_components_count = 0
    WHERE id = p_donor_board_id;

    UPDATE public.harvestable_components
    SET status = 'EXTRACTED_SOLD'
    WHERE donor_board_id = p_donor_board_id
      AND status = 'INTACT';

    v_initial_status := 'READY_FOR_DISPATCH';
    v_initial_reading := 'As-Is Raw Donor Board (Bypass / Self-Salvage)';
  ELSE
    SELECT * INTO v_comp
    FROM public.harvestable_components
    WHERE id = p_component_id
    FOR UPDATE;

    IF NOT FOUND OR v_comp.status <> 'INTACT' THEN
      RAISE EXCEPTION 'Selected component is no longer INTACT';
    END IF;

    UPDATE public.harvestable_components
    SET status = 'EXTRACTED_SOLD'
    WHERE id = p_component_id;

    UPDATE public.donor_boards
    SET status = CASE WHEN status = 'AVAILABLE' THEN 'PARTIALLY_HARVESTED' ELSE status END,
        intact_components_count = GREATEST(0, intact_components_count - 1)
    WHERE id = p_donor_board_id;

    v_initial_status := 'PENDING_EXTRACTION';
    v_initial_reading := '';
  END IF;

  INSERT INTO public.orders (
    order_code,
    buyer_name,
    buyer_phone,
    buyer_address,
    donor_board_id,
    component_id,
    mode,
    delivery_type,
    item_price_inr,
    extraction_fee_inr,
    delivery_fee_inr,
    total_payable_inr,
    status,
    multimeter_reading_value
  ) VALUES (
    p_order_code,
    p_buyer_name,
    p_buyer_phone,
    p_buyer_address,
    p_donor_board_id,
    p_component_id,
    p_mode,
    p_delivery_type,
    p_item_price_inr,
    p_extraction_fee_inr,
    p_delivery_fee_inr,
    p_total_payable_inr,
    v_initial_status,
    v_initial_reading
  )
  RETURNING * INTO v_new_order;

  RETURN v_new_order;
END;
$$;

-- 6. ROW LEVEL SECURITY (RLS) & REALTIME PUBLICATION
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvestable_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read/write profiles" ON public.profiles;
CREATE POLICY "Public read/write profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write donor_boards" ON public.donor_boards;
CREATE POLICY "Public read/write donor_boards" ON public.donor_boards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write harvestable_components" ON public.harvestable_components;
CREATE POLICY "Public read/write harvestable_components" ON public.harvestable_components FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write orders" ON public.orders;
CREATE POLICY "Public read/write orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read/write support_tickets" ON public.support_tickets;
CREATE POLICY "Public read/write support_tickets" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_boards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.harvestable_components;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
