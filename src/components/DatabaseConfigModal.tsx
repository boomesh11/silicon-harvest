import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  Radio,
  AlertCircle,
  RefreshCw,
  Terminal,
  Zap,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { getSupabaseConfig } from '../lib/supabase';

const SUPABASE_PHASE3_SQL = `-- SILICONHARVEST PRODUCTION: TABLES + ATOMIC CHECKOUT RPC + REALTIME (ZERO FAKE DATA)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'BUYER_STUDENT',
  organization TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  default_address TEXT DEFAULT '',
  wallet_balance_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  completed_jobs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.donor_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_name TEXT NOT NULL,
  category TEXT NOT NULL,
  seller_name TEXT NOT NULL DEFAULT '',
  primary_fault TEXT NOT NULL,
  raw_board_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  location_city TEXT NOT NULL DEFAULT 'Chennai',
  location_area TEXT NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL DEFAULT 2.5,
  total_components_count INTEGER NOT NULL DEFAULT 0,
  intact_components_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.harvestable_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_board_id UUID NOT NULL REFERENCES public.donor_boards(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_name TEXT NOT NULL,
  component_category TEXT NOT NULL,
  package_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  recommended_temp_c INTEGER NOT NULL DEFAULT 300,
  part_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  extraction_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bypass_hack_tip TEXT,
  status TEXT NOT NULL DEFAULT 'INTACT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code TEXT NOT NULL UNIQUE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  donor_board_id UUID NOT NULL REFERENCES public.donor_boards(id) ON DELETE CASCADE,
  component_id UUID REFERENCES public.harvestable_components(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  delivery_type TEXT NOT NULL,
  item_price_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  extraction_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_payable_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_EXTRACTION',
  multimeter_reading_value TEXT DEFAULT '',
  tracking_or_porter_link TEXT DEFAULT '',
  upi_utr_or_payment_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ATOMIC CHECKOUT RPC: supabase.rpc('place_salvage_order', ...)
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
  SELECT * INTO v_board FROM public.donor_boards WHERE id = p_donor_board_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Donor board not found'; END IF;

  IF p_mode = 'RAW_DONOR_BOARD' THEN
    IF v_board.status <> 'AVAILABLE' THEN
      RAISE EXCEPTION 'Board no longer available as full raw board';
    END IF;
    UPDATE public.donor_boards SET status = 'SOLD_RAW', intact_components_count = 0 WHERE id = p_donor_board_id;
    UPDATE public.harvestable_components SET status = 'EXTRACTED_SOLD' WHERE donor_board_id = p_donor_board_id AND status = 'INTACT';
    v_initial_status := 'READY_FOR_DISPATCH';
    v_initial_reading := 'As-Is Raw Donor Board (Bypass / Self-Salvage)';
  ELSE
    SELECT * INTO v_comp FROM public.harvestable_components WHERE id = p_component_id FOR UPDATE;
    IF NOT FOUND OR v_comp.status <> 'INTACT' THEN
      RAISE EXCEPTION 'Component already harvested';
    END IF;
    UPDATE public.harvestable_components SET status = 'EXTRACTED_SOLD' WHERE id = p_component_id;
    UPDATE public.donor_boards
    SET status = CASE WHEN status = 'AVAILABLE' THEN 'PARTIALLY_HARVESTED' ELSE status END,
        intact_components_count = GREATEST(0, intact_components_count - 1)
    WHERE id = p_donor_board_id;
    v_initial_status := 'PENDING_EXTRACTION';
    v_initial_reading := '';
  END IF;

  INSERT INTO public.orders (
    order_code, buyer_name, buyer_phone, buyer_address, donor_board_id, component_id,
    mode, delivery_type, item_price_inr, extraction_fee_inr, delivery_fee_inr,
    total_payable_inr, status, multimeter_reading_value
  ) VALUES (
    p_order_code, p_buyer_name, p_buyer_phone, p_buyer_address, p_donor_board_id, p_component_id,
    p_mode, p_delivery_type, p_item_price_inr, p_extraction_fee_inr, p_delivery_fee_inr,
    p_total_payable_inr, v_initial_status, v_initial_reading
  ) RETURNING * INTO v_new_order;

  RETURN v_new_order;
END;
$$;`;

interface DatabaseConfigModalProps {
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  onClose,
}) => {
  const {
    connectionMode,
    isSyncing,
    lastSyncError,
    realtimeEventsCount,
    connectSupabase,
    disconnectSupabase,
    refreshFromSupabase,
  } = useHarvestStore();

  const initialCfg = getSupabaseConfig();
  const [url, setUrl] = useState(initialCfg.url);
  const [anonKey, setAnonKey] = useState(initialCfg.anonKey);
  const [copied, setCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_PHASE3_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await connectSupabase(url, anonKey);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                Configure Supabase Connection &amp; Atomic Checkout RPC
              </h2>
              <p className="text-xs text-slate-500">
                Hybrid Data Adapter (`src/services/harvestApi.ts`) • Realtime
                Events Synced:{' '}
                <span className="font-mono text-emerald-700 font-semibold">
                  {realtimeEventsCount}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1D1D1F] border border-slate-200 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Radio
                className={`w-4 h-4 ${
                  connectionMode === 'SUPABASE_CLOUD'
                    ? 'text-emerald-600 animate-pulse'
                    : 'text-amber-600'
                }`}
              />
              <div className="text-xs">
                <span className="text-slate-500">Active Adapter Mode: </span>
                <span className="font-mono font-bold text-[#1D1D1F]">
                  {connectionMode === 'SUPABASE_CLOUD'
                    ? 'SUPABASE POSTGRESQL CLOUD + REALTIME'
                    : 'LOCAL STORAGE FALLBACK (BROADCAST CHANNEL SYNC)'}
                </span>
              </div>
            </div>

            {connectionMode === 'SUPABASE_CLOUD' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshFromSupabase}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs flex items-center gap-1"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>Sync Tables</span>
                </button>
                <button
                  onClick={disconnectSupabase}
                  className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs"
                >
                  Use Local Fallback
                </button>
              </div>
            )}
          </div>

          {lastSyncError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lastSyncError}</span>
            </div>
          )}

          {/* Runtime Credentials Form */}
          <form onSubmit={handleConnect} className="space-y-3.5">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Paste Supabase URL &amp; Anon Key for Instant Live Testing (Saved
              to localStorage)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="VITE_SUPABASE_URL (https://xyz.supabase.co)"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <input
                type="password"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="VITE_SUPABASE_ANON_KEY (eyJhbGci...)"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSyncing}
                className="px-5 py-2.5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs transition-all"
              >
                {isSyncing
                  ? 'Connecting & Subscribing to Realtime...'
                  : 'Save & Connect to Supabase Live'}
              </button>
              <span className="text-[11px] text-slate-500">
                Or define{' '}
                <code className="text-[#1D1D1F] font-semibold">
                  VITE_SUPABASE_URL
                </code>{' '}
                and{' '}
                <code className="text-[#1D1D1F] font-semibold">
                  VITE_SUPABASE_ANON_KEY
                </code>{' '}
                in <code className="text-[#1D1D1F] font-semibold">.env</code>
              </span>
            </div>
          </form>

          {/* SQL DDL + RPC Viewer */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                Atomic Checkout RPC &amp; Schema (`supabase/schema.sql`)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL + RPC</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-56">
              {SUPABASE_PHASE3_SQL}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
