import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  DonorBoard,
  HarvestableComponent,
  Order,
  ActiveTab,
  OrderMode,
  DeliveryType,
  BoardCategory,
  BoardTemplateComponent,
  UserProfile,
  UserRole,
  ConnectionMode,
} from '../types/harvest';
import {
  INITIAL_DONOR_BOARDS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
} from '../data/seedData';
import {
  getSupabaseClient,
  saveRuntimeSupabaseConfig,
  clearRuntimeSupabaseConfig,
} from '../lib/supabase';
import {
  DEFAULT_GUEST_PROFILE,
  fetchSupabaseDataset,
  supabasePlaceSalvageOrder,
  supabasePublishDonorBoard,
  supabaseCompleteExtractionJob,
  supabaseUpdateOrderTracking,
  supabaseMarkOrderCompleted,
  supabaseSignInWithEmail,
  supabaseSignUpWithEmail,
  supabaseSignInWithGoogle,
} from '../services/harvestApi';

const STORAGE_KEYS = {
  BOARDS: 'silicon_harvest_prod_v1_boards',
  COMPONENTS: 'silicon_harvest_prod_v1_components',
  ORDERS: 'silicon_harvest_prod_v1_orders',
  USER: 'silicon_harvest_prod_v1_user',
};

const LEGACY_KEYS_TO_PURGE = [
  'silicon_harvest_boards_v3',
  'silicon_harvest_components_v3',
  'silicon_harvest_orders_v3',
  'silicon_harvest_tech_wallet_v3',
  'silicon_harvest_tech_jobs_v3',
  'silicon_harvest_current_user_v3',
];

const BROADCAST_CHANNEL_NAME = 'silicon_harvest_prod_v1_realtime_bus';

interface PlaceOrderPayload {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  donorBoardId: string;
  componentId: string | null;
  mode: OrderMode;
  deliveryType: DeliveryType;
  upiUtrOrPaymentId?: string;
}

interface NewBoardListingInput {
  boardName: string;
  category: BoardCategory;
  sellerName: string;
  locationArea: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  components: (BoardTemplateComponent & { isPrimaryFault: boolean })[];
}

interface HarvestStoreContextValue {
  boards: DonorBoard[];
  components: HarvestableComponent[];
  orders: Order[];
  techWalletBalanceInr: number;
  techCompletedJobsCount: number;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserProfile;
  switchDemoRole: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    organization: string,
    phone?: string,
    defaultAddress?: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => void;
  connectionMode: ConnectionMode;
  isSyncing: boolean;
  lastSyncError: string | null;
  realtimeEventsCount: number;
  connectSupabase: (url: string, anonKey: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  refreshFromSupabase: () => Promise<void>;
  placeOrder: (payload: PlaceOrderPayload) => Order;
  publishDonorBoard: (input: NewBoardListingInput) => DonorBoard;
  completeExtractionJob: (
    orderId: string,
    multimeterReading: string,
    trackingOrPorterLink?: string
  ) => void;
  updateOrderTracking: (orderId: string, trackingOrPorterLink: string) => void;
  markOrderCompleted: (orderId: string) => void;
  resetDemoState: () => void;
}

const HarvestStoreContext = createContext<HarvestStoreContextValue | undefined>(
  undefined
);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const HarvestStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Purge legacy v3 prototype keys on first load
  useEffect(() => {
    try {
      LEGACY_KEYS_TO_PURGE.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
  }, []);

  const [boards, setBoards] = useState<DonorBoard[]>(() =>
    loadFromStorage(STORAGE_KEYS.BOARDS, INITIAL_DONOR_BOARDS)
  );
  const [components, setComponents] = useState<HarvestableComponent[]>(() =>
    loadFromStorage(STORAGE_KEYS.COMPONENTS, INITIAL_COMPONENTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    loadFromStorage(STORAGE_KEYS.USER, DEFAULT_GUEST_PROFILE)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('MARKETPLACE');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(() =>
    getSupabaseClient() ? 'SUPABASE_CLOUD' : 'LOCAL_FALLBACK'
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [realtimeEventsCount, setRealtimeEventsCount] = useState<number>(0);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Compute technician wallet balance & completed jobs dynamically from actual completed orders
  const { techWalletBalanceInr, techCompletedJobsCount } = useMemo(() => {
    const completedExtractions = orders.filter(
      (o) =>
        o.mode === 'EXTRACTED_TESTED_PART' &&
        (o.status === 'READY_FOR_DISPATCH' || o.status === 'COMPLETED')
    );
    const count = completedExtractions.length;
    const balance = Number(
      completedExtractions
        .reduce((sum, o) => sum + o.extractionFeeInr * 0.7, 0)
        .toFixed(2)
    );
    return {
      techWalletBalanceInr: balance,
      techCompletedJobsCount: count,
    };
  }, [orders]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
    } catch {
      // ignore
    }
  }, [boards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(components));
    } catch {
      // ignore
    }
  }, [components]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Cross-tab BroadcastChannel sync
  const broadcastLocalStateUpdate = useCallback(() => {
    try {
      broadcastChannelRef.current?.postMessage({ type: 'STATE_UPDATED' });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }
    const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannelRef.current = ch;

    ch.onmessage = (ev) => {
      if (ev.data?.type === 'STATE_UPDATED') {
        setBoards(loadFromStorage(STORAGE_KEYS.BOARDS, INITIAL_DONOR_BOARDS));
        setComponents(
          loadFromStorage(STORAGE_KEYS.COMPONENTS, INITIAL_COMPONENTS)
        );
        setOrders(loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
        setRealtimeEventsCount((c) => c + 1);
      }
    };

    return () => {
      ch.close();
      broadcastChannelRef.current = null;
    };
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setConnectionMode('LOCAL_FALLBACK');
      return;
    }

    setIsSyncing(true);
    try {
      const snapshot = await fetchSupabaseDataset();
      if (snapshot) {
        setBoards(snapshot.boards);
        setComponents(snapshot.components);
        setOrders(snapshot.orders);
        setConnectionMode('SUPABASE_CLOUD');
        setLastSyncError(null);
      }
    } catch (err: any) {
      setLastSyncError(err?.message || 'Supabase sync error');
      setConnectionMode('LOCAL_FALLBACK');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Subscribe to Supabase Realtime changes
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setConnectionMode('LOCAL_FALLBACK');
      return;
    }

    refreshFromSupabase();

    const channel = client
      .channel('silicon_harvest_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donor_boards' },
        () => {
          setRealtimeEventsCount((c) => c + 1);
          refreshFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'harvestable_components' },
        () => {
          setRealtimeEventsCount((c) => c + 1);
          refreshFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          setRealtimeEventsCount((c) => c + 1);
          refreshFromSupabase();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [refreshFromSupabase, connectionMode]);

  const connectSupabase = async (
    url: string,
    anonKey: string
  ): Promise<boolean> => {
    saveRuntimeSupabaseConfig(url, anonKey);
    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const snapshot = await fetchSupabaseDataset();
      if (snapshot) {
        setBoards(snapshot.boards);
        setComponents(snapshot.components);
        setOrders(snapshot.orders);
        setConnectionMode('SUPABASE_CLOUD');
        return true;
      }
      setConnectionMode('LOCAL_FALLBACK');
      return false;
    } catch (err: any) {
      setLastSyncError(
        err?.message ||
          'Connected to Supabase URL, but tables not found yet. Run the SQL Schema in your Supabase SQL Editor.'
      );
      setConnectionMode('SUPABASE_CLOUD');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectSupabase = () => {
    clearRuntimeSupabaseConfig();
    setConnectionMode('LOCAL_FALLBACK');
    setLastSyncError(null);
  };

  // Switch active role without injecting fake user personas
  const switchDemoRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
    }));
    if (role === 'BUYER_STUDENT') setActiveTab('MARKETPLACE');
    if (role === 'SELLER_LAB') setActiveTab('SELLER_PORTAL');
    if (role === 'TECH_PARTNER') setActiveTab('TECH_WORKBENCH');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.role === 'BUYER_STUDENT') setActiveTab('MARKETPLACE');
      if (updates.role === 'SELLER_LAB') setActiveTab('SELLER_PORTAL');
      if (updates.role === 'TECH_PARTNER') setActiveTab('TECH_WORKBENCH');
      return updated;
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { profile, error } = await supabaseSignInWithEmail(email, password);
    if (profile) {
      setCurrentUser(profile);
    }
    return { error };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    organization: string,
    phone = '',
    defaultAddress = ''
  ) => {
    const { profile, error } = await supabaseSignUpWithEmail({
      email,
      password,
      fullName,
      role,
      organization,
      phone,
      defaultAddress,
    });
    if (profile) {
      setCurrentUser(profile);
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    return supabaseSignInWithGoogle();
  };

  const signOut = () => {
    const client = getSupabaseClient();
    client?.auth.signOut();
    setCurrentUser(DEFAULT_GUEST_PROFILE);
  };

  const placeOrder = (payload: PlaceOrderPayload): Order => {
    const targetBoard = boards.find((b) => b.id === payload.donorBoardId);
    if (!targetBoard) {
      throw new Error('Donor board not found');
    }

    const targetComp = payload.componentId
      ? components.find((c) => c.id === payload.componentId) || null
      : null;

    const deliveryFeeInr =
      payload.deliveryType === 'CAMPUS_HUB_PICKUP'
        ? 0
        : payload.deliveryType === 'HYPERLOCAL_PORTER'
        ? 45
        : 49;

    const itemPriceInr =
      payload.mode === 'RAW_DONOR_BOARD'
        ? targetBoard.rawBoardPriceInr
        : targetComp
        ? targetComp.partPriceInr
        : 0;

    const extractionFeeInr =
      payload.mode === 'RAW_DONOR_BOARD'
        ? 0
        : targetComp
        ? targetComp.extractionFeeInr
        : 0;

    const totalPayableInr = itemPriceInr + extractionFeeInr + deliveryFeeInr;
    const orderNum = 2040 + orders.length + 1;
    const orderCode = `SH-ORD-${orderNum}`;

    const newOrder: Order = {
      id: `ORD-${orderNum}`,
      orderCode,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerAddress: payload.buyerAddress,
      donorBoardId: payload.donorBoardId,
      componentId: payload.componentId,
      mode: payload.mode,
      deliveryType: payload.deliveryType,
      itemPriceInr,
      extractionFeeInr,
      deliveryFeeInr,
      totalPayableInr,
      status:
        payload.mode === 'RAW_DONOR_BOARD'
          ? 'READY_FOR_DISPATCH'
          : 'PENDING_EXTRACTION',
      multimeterReadingValue:
        payload.mode === 'RAW_DONOR_BOARD'
          ? 'As-Is Raw Donor Board (Bypass / Self-Salvage)'
          : '',
      trackingOrPorterLink: '',
      upiUtrOrPaymentId: payload.upiUtrOrPaymentId || '',
      createdAt: new Date().toISOString(),
    };

    // Optimistic Atomic Local Update
    if (payload.mode === 'RAW_DONOR_BOARD') {
      setBoards((prev) =>
        prev.map((b) =>
          b.id === payload.donorBoardId
            ? { ...b, status: 'SOLD_RAW', intactComponentsCount: 0 }
            : b
        )
      );
      setComponents((prev) =>
        prev.map((c) =>
          c.donorBoardId === payload.donorBoardId && c.status === 'INTACT'
            ? { ...c, status: 'EXTRACTED_SOLD' }
            : c
        )
      );
    } else if (payload.componentId) {
      setComponents((prev) =>
        prev.map((c) =>
          c.id === payload.componentId ? { ...c, status: 'EXTRACTED_SOLD' } : c
        )
      );
      setBoards((prev) =>
        prev.map((b) => {
          if (b.id !== payload.donorBoardId) return b;
          const nextIntact = Math.max(0, (b.intactComponentsCount ?? 1) - 1);
          return {
            ...b,
            status:
              b.status === 'AVAILABLE' ? 'PARTIALLY_HARVESTED' : b.status,
            intactComponentsCount: nextIntact,
          };
        })
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    broadcastLocalStateUpdate();

    // If connected to Supabase Cloud, invoke the PostgreSQL Atomic RPC `place_salvage_order`
    if (connectionMode === 'SUPABASE_CLOUD') {
      supabasePlaceSalvageOrder({
        orderCode,
        buyerName: payload.buyerName,
        buyerPhone: payload.buyerPhone,
        buyerAddress: payload.buyerAddress,
        donorBoardId: payload.donorBoardId,
        componentId: payload.componentId,
        mode: payload.mode,
        deliveryType: payload.deliveryType,
        itemPriceInr,
        extractionFeeInr,
        deliveryFeeInr,
        totalPayableInr,
        upiUtrOrPaymentId: payload.upiUtrOrPaymentId,
      })
        .then(() => refreshFromSupabase())
        .catch((err) => setLastSyncError(err?.message || 'RPC checkout failed'));
    }

    return newOrder;
  };

  const publishDonorBoard = (input: NewBoardListingInput): DonorBoard => {
    const nextBoardNumber = 100 + boards.length + 1;
    const newBoardId = `BRD-${nextBoardNumber}`;

    const intactCount = input.components.filter((c) => !c.isPrimaryFault).length;
    const city = input.locationArea.toLowerCase().includes('bengaluru')
      ? 'Bengaluru'
      : 'Chennai';

    const newBoard: DonorBoard = {
      id: newBoardId,
      boardName: input.boardName,
      category: input.category,
      sellerName: input.sellerName,
      locationCity: city,
      locationArea: input.locationArea,
      distanceKm: input.distanceKm,
      primaryFault: input.primaryFault,
      rawBoardPriceInr: input.rawBoardPriceInr,
      status: 'AVAILABLE',
      totalComponentsCount: input.components.length,
      intactComponentsCount: intactCount,
    };

    const newChildComponents: HarvestableComponent[] = input.components.map(
      (comp, idx) => ({
        id: `CMP-${nextBoardNumber}-${idx + 1}`,
        donorBoardId: newBoardId,
        partNumber: comp.partNumber,
        partName: comp.partName,
        componentCategory: comp.componentCategory,
        packageType: comp.packageType,
        difficulty: comp.difficulty,
        recommendedTempC: comp.recommendedTempC,
        partPriceInr: comp.partPriceInr,
        extractionFeeInr: comp.extractionFeeInr,
        bypassHackTip: comp.bypassHackTip,
        status: comp.isPrimaryFault ? 'FAULTY_ON_ARRIVAL' : 'INTACT',
      })
    );

    setBoards((prev) => [newBoard, ...prev]);
    setComponents((prev) => [...newChildComponents, ...prev]);
    broadcastLocalStateUpdate();

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabasePublishDonorBoard(input)
        .then(() => refreshFromSupabase())
        .catch((err) =>
          setLastSyncError(err?.message || 'Failed to publish board to Supabase')
        );
    }

    return newBoard;
  };

  const completeExtractionJob = (
    orderId: string,
    multimeterReading: string,
    trackingOrPorterLink = ''
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'PENDING_EXTRACTION') return;

    const finalReading =
      multimeterReading.trim() ||
      '3.30V / 0.51V Diode Drop Verified — Passed Load Check';

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'READY_FOR_DISPATCH',
              multimeterReadingValue: finalReading,
              trackingOrPorterLink:
                trackingOrPorterLink.trim() || o.trackingOrPorterLink || '',
            }
          : o
      )
    );
    broadcastLocalStateUpdate();

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabaseCompleteExtractionJob(
        orderId,
        finalReading,
        trackingOrPorterLink
      )
        .then(() => refreshFromSupabase())
        .catch((err) =>
          setLastSyncError(err?.message || 'Failed to update job in Supabase')
        );
    }
  };

  const updateOrderTracking = (
    orderId: string,
    trackingOrPorterLink: string
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, trackingOrPorterLink: trackingOrPorterLink.trim() }
          : o
      )
    );
    broadcastLocalStateUpdate();

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabaseUpdateOrderTracking(orderId, trackingOrPorterLink)
        .then(() => refreshFromSupabase())
        .catch((err) =>
          setLastSyncError(
            err?.message || 'Failed to save tracking link in Supabase'
          )
        );
    }
  };

  const markOrderCompleted = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
    );
    broadcastLocalStateUpdate();

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabaseMarkOrderCompleted(orderId).then(() => refreshFromSupabase());
    }
  };

  const resetDemoState = () => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      LEGACY_KEYS_TO_PURGE.forEach((key) => localStorage.removeItem(key));
    } catch {
      // ignore
    }
    setBoards(INITIAL_DONOR_BOARDS);
    setComponents(INITIAL_COMPONENTS);
    setOrders(INITIAL_ORDERS);
    setCurrentUser(DEFAULT_GUEST_PROFILE);
    broadcastLocalStateUpdate();
  };

  return (
    <HarvestStoreContext.Provider
      value={{
        boards,
        components,
        orders,
        techWalletBalanceInr,
        techCompletedJobsCount,
        activeTab,
        setActiveTab,
        currentUser,
        switchDemoRole,
        updateUserProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        connectionMode,
        isSyncing,
        lastSyncError,
        realtimeEventsCount,
        connectSupabase,
        disconnectSupabase,
        refreshFromSupabase,
        placeOrder,
        publishDonorBoard,
        completeExtractionJob,
        updateOrderTracking,
        markOrderCompleted,
        resetDemoState,
      }}
    >
      {children}
    </HarvestStoreContext.Provider>
  );
};

export function useHarvestStore(): HarvestStoreContextValue {
  const ctx = useContext(HarvestStoreContext);
  if (!ctx) {
    throw new Error('useHarvestStore must be used inside HarvestStoreProvider');
  }
  return ctx;
}
