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
  SupportTicket,
  BargainOffer,
  HardwareMode,
  OrderStatus,
} from '../types/harvest';
import {
  INITIAL_DONOR_BOARDS,
  INITIAL_COMPONENTS,
  INITIAL_ORDERS,
  INITIAL_BARGAINS,
} from '../data/seedData';
import {
  calculateOrderBreakdown,
  findScopedAcceptedBargain,
  resolveDeliveryFeeFromType,
} from '../config/pricingEngine';
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
  supabaseSendPhoneOtp,
  supabaseVerifyPhoneOtp,
  supabaseCreateSupportTicket,
  supabaseFetchSupportTickets,
  quickGoogleProfileSignIn,
  restoreSupabaseAuthSession,
  supabaseUpdateProfile,
} from '../services/harvestApi';
import {
  bootstrapSupabaseIfEmpty,
  syncCreateBoardBackend,
  syncCreateOrderBackend,
  syncCreateBargainBackend,
  syncUpdateBargainStatusBackend,
  syncAdminOrderUpdateBackend,
  syncAdminBoardPriceBackend,
  syncAdminDeleteBoardBackend,
  syncCreateSupportTicketBackend,
  syncUserAccountBackend,
} from '../services/backendApi';

/** Persisted signed-in customer session (restored on reload). */
const USER_SESSION_KEY = 'sh_clean_prod_v5_user_session';

const STORAGE_KEYS = {
  BOARDS: 'sh_clean_prod_v5_boards',
  COMPONENTS: 'sh_clean_prod_v5_components',
  ORDERS: 'sh_clean_prod_v5_orders',
  USER: 'sh_clean_prod_v5_user',
  TICKETS: 'sh_clean_prod_v5_tickets',
  BARGAINS: 'sh_clean_prod_v5_bargains',
  PRO_OVERRIDES: 'sh_clean_prod_v5_pro_overrides',
};

const LEGACY_KEYS_TO_PURGE = [
  'silicon_harvest_user_session',
  'silicon_harvest_boards_v3',
  'silicon_harvest_components_v3',
  'silicon_harvest_orders_v3',
  'silicon_harvest_tech_wallet_v3',
  'silicon_harvest_tech_jobs_v3',
  'silicon_harvest_current_user_v3',
  'silicon_harvest_prod_v1_boards',
  'silicon_harvest_prod_v1_components',
  'silicon_harvest_prod_v1_orders',
  'silicon_harvest_prod_v1_user',
  'silicon_harvest_prod_v2_boards',
  'silicon_harvest_prod_v2_components',
  'silicon_harvest_prod_v2_orders',
  'silicon_harvest_prod_v2_user',
  'silicon_harvest_prod_v2_tickets',
  'silicon_harvest_prod_v2_bargains',
  'silicon_harvest_prod_v2_pro_overrides',
  'silicon_harvest_prod_v3_boards',
  'silicon_harvest_prod_v3_components',
  'silicon_harvest_prod_v3_orders',
  'silicon_harvest_prod_v3_user',
  'silicon_harvest_prod_v3_tickets',
  'silicon_harvest_prod_v3_bargains',
  'silicon_harvest_prod_v3_pro_overrides',
];

function purgeAllLegacyLocalStorage() {
  try {
    LEGACY_KEYS_TO_PURGE.forEach((k) => localStorage.removeItem(k));
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('silicon_harvest_') ||
          key.startsWith('sh_prod_') ||
          (key.startsWith('sh_v') && !key.startsWith('sh_clean_prod_v5_')))
      ) {
        if (
          key !== 'silicon_harvest_supabase_url' &&
          key !== 'silicon_harvest_supabase_anon_key'
        ) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore storage errors
  }
}

const BROADCAST_CHANNEL_NAME = 'silicon_harvest_prod_v2_realtime_bus';

export interface PendingCheckoutTarget {
  boardId: string;
  componentId?: string | null;
  mode: OrderMode;
}

export interface PlaceOrderPayload {
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
  platformCommissionInr?: number;
  deliveryFeeInr?: number;
  upiUtrOrPaymentId?: string;
  isProOrder?: boolean;
  bargainDiscountInr?: number;
  redeemedBargainId?: string;
  totalPriceInr?: number;
}

export interface PlaceBulkCartOrderPayload {
  componentIds: string[];
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerState?: string;
  buyerDistrict?: string;
  buyerPincode?: string;
  upiUtrOrPaymentId?: string;
}

export interface NewBoardListingInput {
  boardName: string;
  category: BoardCategory;
  subModel?: string;
  sellerId?: string;
  sellerEmail?: string;
  sellerName: string;
  sellerPhone?: string;
  sellerState?: string;
  sellerDistrict?: string;
  sellerPincode?: string;
  sellerFullAddress?: string;
  locationArea: string;
  distanceKm: number;
  primaryFault: string;
  rawBoardPriceInr: number;
  desolderedPriceInr?: number;
  hardwareMode?: HardwareMode;
  allowBargain?: boolean;
  isVerified?: boolean;
  imageUrl?: string;
  components?: (BoardTemplateComponent & { isPrimaryFault?: boolean })[];
}

interface HarvestStoreContextValue {
  boards: DonorBoard[];
  components: HarvestableComponent[];
  orders: Order[];
  bargainOffers: BargainOffer[];
  supportTickets: SupportTicket[];
  techWalletBalanceInr: number;
  techCompletedJobsCount: number;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCheckoutTarget: PendingCheckoutTarget | null;
  setPendingCheckoutTarget: (target: PendingCheckoutTarget | null) => void;
  currentUser: UserProfile;
  proDirectoryOverrides: Record<string, boolean>;
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
    defaultAddress?: string,
    state?: string,
    district?: string,
    pincode?: string
  ) => Promise<{ error: string | null }>;
  sendPhoneOtp: (phone: string) => Promise<{ error: string | null; onScreenCode?: string }>;
  verifyPhoneOtp: (
    phone: string,
    token: string,
    fullName?: string,
    district?: string,
    state?: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  quickGoogleSignIn: (
    email: string,
    fullName: string,
    phone?: string,
    district?: string,
    state?: string
  ) => Promise<{ error: string | null }>;
  isSignedIn: boolean;
  signOut: () => void;
  connectionMode: ConnectionMode;
  isSyncing: boolean;
  lastSyncError: string | null;
  realtimeEventsCount: number;
  connectSupabase: (url: string, anonKey: string) => Promise<boolean>;
  disconnectSupabase: () => void;
  refreshFromSupabase: () => Promise<void>;
  placeOrder: (payload: PlaceOrderPayload) => Order;
  placeBulkCartOrder: (payload: PlaceBulkCartOrderPayload) => Order[];
  publishDonorBoard: (input: NewBoardListingInput) => DonorBoard;
  submitBargainOffer: (offer: Omit<BargainOffer, 'id' | 'status' | 'createdAt'>) => BargainOffer;
  acceptBargainOffer: (offerId: string) => void;
  rejectBargainOffer: (offerId: string) => void;
  cancelBargainOffer: (offerId: string) => void;
  dispatchOrderBySeller: (
    orderId: string,
    trackingOrPorterLink: string,
    targetStatus?: OrderStatus
  ) => void;
  upgradeToProMembership: (plan: 'monthly' | 'yearly') => void;
  toggleUserProStatus: (userId?: string) => void;
  switchOwnerAdmin: () => void;
  updateBoardPrice: (boardId: string, newPrice: number) => void;
  toggleBoardVerified: (boardId: string) => void;
  deleteBoardListing: (boardId: string) => void;
  updateOrderStatusAdmin: (orderId: string, newStatus: OrderStatus) => void;
  resolveSupportTicket: (ticketId: string) => void;
  completeExtractionJob: (
    orderId: string,
    multimeterReading: string,
    trackingOrPorterLink?: string
  ) => void;
  updateOrderTracking: (orderId: string, trackingOrPorterLink: string) => void;
  markOrderCompleted: (orderId: string) => void;
  createSupportTicket: (ticket: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderCode?: string;
    category: string;
    message: string;
  }) => Promise<SupportTicket>;
  resetDemoState: () => void;
}

const HarvestStoreContext = createContext<HarvestStoreContextValue | undefined>(
  undefined
);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSaveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err: any) {
    // Handle QuotaExceededError gracefully by stripping large base64 data URIs on boards
    if (
      key === STORAGE_KEYS.BOARDS &&
      Array.isArray(value)
    ) {
      try {
        const trimmed = value.map((b: any) => ({
          ...b,
          imageUrl:
            typeof b?.imageUrl === 'string' && b.imageUrl.startsWith('data:')
              ? '/assets/3d/hero-pcb.png'
              : b?.imageUrl,
        }));
        localStorage.setItem(key, JSON.stringify(trimmed));
      } catch {
        // Ignore if storage remains full
      }
    }
  }
}

function getNextNumericId(ids: string[], prefix: string, minStart: number): number {
  let maxNum = minStart;
  for (const id of ids) {
    const matches = id.match(/(\d+)$/);
    if (matches) {
      const parsed = parseInt(matches[1], 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    } else if (id.startsWith(prefix)) {
      const rest = parseInt(id.replace(prefix, ''), 10);
      if (!Number.isNaN(rest) && rest > maxNum) {
        maxNum = rest;
      }
    }
  }
  return maxNum + 1;
}

export const HarvestStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Purge legacy prototype keys synchronously before initializing state
  purgeAllLegacyLocalStorage();

  useEffect(() => {
    purgeAllLegacyLocalStorage();
  }, []);

  const [boards, setBoards] = useState<DonorBoard[]>(() =>
    loadFromStorage<DonorBoard[]>(STORAGE_KEYS.BOARDS, INITIAL_DONOR_BOARDS)
  );
  const [components, setComponents] = useState<HarvestableComponent[]>(() =>
    loadFromStorage<HarvestableComponent[]>(STORAGE_KEYS.COMPONENTS, INITIAL_COMPONENTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [bargainOffers, setBargainOffers] = useState<BargainOffer[]>(() =>
    loadFromStorage<BargainOffer[]>(STORAGE_KEYS.BARGAINS, INITIAL_BARGAINS)
  );
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() =>
    loadFromStorage(STORAGE_KEYS.TICKETS, [])
  );
  const [proDirectoryOverrides, setProDirectoryOverrides] = useState<Record<string, boolean>>(() =>
    loadFromStorage(STORAGE_KEYS.PRO_OVERRIDES, {})
  );
  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    loadFromStorage(
      USER_SESSION_KEY,
      loadFromStorage(STORAGE_KEYS.USER, DEFAULT_GUEST_PROFILE)
    )
  );
  const [pendingCheckoutTarget, setPendingCheckoutTarget] =
    useState<PendingCheckoutTarget | null>(null);

  const isSignedIn = currentUser.id !== DEFAULT_GUEST_PROFILE.id && !!currentUser.email;

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/login' || window.location.hash === '#/login')
    ) {
      return 'LOGIN';
    }
    return isSignedIn ? 'MARKETPLACE' : 'LOGIN';
  });
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(() =>
    getSupabaseClient() ? 'SUPABASE_CLOUD' : 'LOCAL_FALLBACK'
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [realtimeEventsCount, setRealtimeEventsCount] = useState<number>(0);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Compute technician wallet balance & completed jobs dynamically from all post-extraction orders
  const { techWalletBalanceInr, techCompletedJobsCount } = useMemo(() => {
    const completedExtractions = orders.filter(
      (o) =>
        o.mode === 'EXTRACTED_TESTED_PART' &&
        (o.extractionFeeInr ?? 0) > 0 &&
        (o.status === 'READY_FOR_DISPATCH' ||
          o.status === 'PICKED_UP_BY_PARTNER' ||
          o.status === 'IN_TRANSIT' ||
          o.status === 'DELIVERED' ||
          o.status === 'COMPLETED')
    );
    const count = completedExtractions.length;
    const balance = Number(
      completedExtractions
        .reduce((sum, o) => sum + (o.extractionFeeInr ?? 0) * 0.7, 0)
        .toFixed(2)
    );
    return {
      techWalletBalanceInr: balance,
      techCompletedJobsCount: count,
    };
  }, [orders]);

  // Persist to localStorage using safeSaveToStorage (prevents QuotaExceededError crashes)
  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.BOARDS, boards);
  }, [boards]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.COMPONENTS, components);
  }, [components]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.TICKETS, supportTickets);
  }, [supportTickets]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.BARGAINS, bargainOffers);
  }, [bargainOffers]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.PRO_OVERRIDES, proDirectoryOverrides);
  }, [proDirectoryOverrides]);

  useEffect(() => {
    safeSaveToStorage(STORAGE_KEYS.USER, currentUser);
    try {
      if (currentUser.id !== DEFAULT_GUEST_PROFILE.id && currentUser.email) {
        safeSaveToStorage(USER_SESSION_KEY, currentUser);
      } else {
        localStorage.removeItem(USER_SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Restore a real Supabase OAuth / email session & subscribe to auth state changes
  // Preserves local Pro membership and Owner Admin flags so session refresh never downgrades a user
  useEffect(() => {
    let cancelled = false;
    const mergeSessionProfile = (profile: UserProfile) => {
      setCurrentUser((prev) => ({
        ...profile,
        isProMember: prev.isProMember ?? profile.isProMember ?? false,
        proMembershipExpiry: prev.proMembershipExpiry ?? profile.proMembershipExpiry,
        isOwnerAdmin: prev.isOwnerAdmin ?? profile.isOwnerAdmin ?? false,
      }));
    };

    restoreSupabaseAuthSession()
      .then((profile) => {
        if (!cancelled && profile) {
          mergeSessionProfile(profile);
          setActiveTab((prev) => (prev === 'LOGIN' ? 'MARKETPLACE' : prev));
        }
      })
      .catch(() => {
        // ignore — local session (if any) remains active
      });

    const client = getSupabaseClient();
    const sub = client?.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user?.email) {
        restoreSupabaseAuthSession()
          .then((profile) => {
            if (!cancelled && profile) {
              mergeSessionProfile(profile);
              setActiveTab((prev) => (prev === 'LOGIN' ? 'MARKETPLACE' : prev));
            }
          })
          .catch(() => undefined);
      }
    });

    return () => {
      cancelled = true;
      sub?.data?.subscription?.unsubscribe();
    };
  }, []);

  // Cross-tab BroadcastChannel sync (includes bargainOffers & currentUser)
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
        setComponents(loadFromStorage(STORAGE_KEYS.COMPONENTS, INITIAL_COMPONENTS));
        setOrders(loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
        setBargainOffers(loadFromStorage(STORAGE_KEYS.BARGAINS, INITIAL_BARGAINS));
        setSupportTickets(loadFromStorage(STORAGE_KEYS.TICKETS, []));
        setProDirectoryOverrides(loadFromStorage(STORAGE_KEYS.PRO_OVERRIDES, {}));
        setCurrentUser(
          loadFromStorage(
            USER_SESSION_KEY,
            loadFromStorage(STORAGE_KEYS.USER, DEFAULT_GUEST_PROFILE)
          )
        );
      }
    };

    return () => {
      ch.close();
    };
  }, []);

  // Sync from Supabase / Backend API on mount with automatic Cloud Bootstrapper
  const refreshFromSupabase = useCallback(async () => {
    try {
      setIsSyncing(true);
      const cloudState = await bootstrapSupabaseIfEmpty();

      if (cloudState.donorBoards.length > 0) {
        setBoards(cloudState.donorBoards);
      }
      if (cloudState.components.length > 0) {
        setComponents(cloudState.components);
      }
      if (cloudState.orders.length > 0) {
        setOrders(cloudState.orders);
      }
      if (cloudState.bargains.length > 0) {
        setBargainOffers(cloudState.bargains);
      }

      const client = getSupabaseClient();
      if (client) {
        const [snapshot, tickets] = await Promise.all([
          fetchSupabaseDataset(),
          supabaseFetchSupportTickets(),
        ]);
        if (snapshot) {
          if (snapshot.boards.length > 0) setBoards(snapshot.boards);
          if (snapshot.components.length > 0) setComponents(snapshot.components);
          if (snapshot.orders.length > 0) setOrders(snapshot.orders);
        }
        if (tickets.length > 0) {
          setSupportTickets(tickets);
        }
        setConnectionMode('SUPABASE_CLOUD');
      } else {
        setConnectionMode(
          cloudState.source === 'SERVERLESS_API' ? 'SUPABASE_CLOUD' : 'LOCAL_FALLBACK'
        );
      }
      setLastSyncError(null);
    } catch (err: any) {
      setLastSyncError(err?.message || 'Failed to sync with Supabase');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshFromSupabase();
  }, [refreshFromSupabase]);

  // Realtime subscription setup
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel('public:realtime_feed')
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => {
          setRealtimeEventsCount((c) => c + 1);
          refreshFromSupabase();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [refreshFromSupabase]);

  const connectSupabase = async (url: string, anonKey: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      saveRuntimeSupabaseConfig(url, anonKey);
      await refreshFromSupabase();
      setConnectionMode('SUPABASE_CLOUD');
      return true;
    } catch (err: any) {
      setLastSyncError(err?.message || 'Connection failed');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectSupabase = () => {
    clearRuntimeSupabaseConfig();
    setConnectionMode('LOCAL_FALLBACK');
  };

  const switchDemoRole = (role: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      if (updated.id !== DEFAULT_GUEST_PROFILE.id && updated.email) {
        supabaseUpdateProfile(updated).catch(() => undefined);
      }
      return updated;
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { profile, error } = await supabaseSignInWithEmail(email, password);
    if (profile) {
      setCurrentUser(profile);
      setActiveTab('MARKETPLACE');
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
    defaultAddress = '',
    state = 'Tamil Nadu',
    district = 'Chennai',
    pincode = '600001'
  ) => {
    const { profile, error } = await supabaseSignUpWithEmail({
      email,
      password,
      fullName,
      role,
      organization,
      phone,
      defaultAddress,
      state,
      district,
      pincode,
    });
    if (profile) {
      setCurrentUser(profile);
      setActiveTab('MARKETPLACE');
    }
    return { error };
  };

  const sendPhoneOtp = async (phone: string) => {
    return supabaseSendPhoneOtp(phone);
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
    fullName = '',
    district = 'Chennai',
    state = 'Tamil Nadu'
  ) => {
    const { profile, error } = await supabaseVerifyPhoneOtp(
      phone,
      token,
      fullName,
      district,
      state
    );
    if (profile) {
      setCurrentUser(profile);
      syncUserAccountBackend(profile).catch(() => undefined);
      setActiveTab('MARKETPLACE');
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    return supabaseSignInWithGoogle();
  };

  const quickGoogleSignIn = async (
    email: string,
    fullName: string,
    phone = '',
    district = 'Chennai',
    state = 'Tamil Nadu'
  ) => {
    const { profile, error } = await quickGoogleProfileSignIn(
      email,
      fullName,
      phone,
      district,
      state
    );
    if (profile) {
      setCurrentUser(profile);
      syncUserAccountBackend(profile).catch(() => undefined);
      setActiveTab('MARKETPLACE');
    }
    return { error };
  };

  const signOut = () => {
    const client = getSupabaseClient();
    client?.auth.signOut().catch(() => undefined);
    try {
      localStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // ignore
    }
    setCurrentUser(DEFAULT_GUEST_PROFILE);
    setActiveTab('LOGIN');
  };

  const placeOrder = (payload: PlaceOrderPayload): Order => {
    const targetBoard = boards.find((b) => b.id === payload.donorBoardId);
    if (!targetBoard) {
      throw new Error('Donor board not found');
    }

    // 1. Self-Purchase Guard
    if (
      targetBoard.sellerId &&
      targetBoard.sellerId === currentUser.id
    ) {
      throw new Error(
        'Self-purchase guard: You cannot purchase your own listed product.'
      );
    }

    const targetComp = payload.componentId
      ? components.find((c) => c.id === payload.componentId) || null
      : null;

    // 2. Inventory Availability Validation
    if (payload.mode === 'RAW_DONOR_BOARD' && targetBoard.status !== 'AVAILABLE') {
      throw new Error(
        'This donor board is no longer available as a full raw board because one or more components were already harvested.'
      );
    }
    if (
      payload.mode === 'EXTRACTED_TESTED_PART' &&
      targetComp &&
      targetComp.status !== 'INTACT'
    ) {
      throw new Error('This component has already been sold.');
    }

    const isPro = Boolean(payload.isProOrder ?? currentUser.isProMember);
    const isSameDistrict =
      (payload.buyerDistrict || 'Chennai').toLowerCase().trim() ===
      (targetBoard.sellerDistrict || targetBoard.locationCity || 'Chennai')
        .toLowerCase()
        .trim();

    const breakdown = calculateOrderBreakdown({
      board: targetBoard,
      component: targetComp,
      mode: payload.mode,
      deliveryType: payload.deliveryType,
      isSameDistrict,
      isProMember: isPro,
      buyerId: currentUser.id,
      bargainOffers,
    });

    const itemPriceInr = breakdown.itemPriceInr;
    const extractionFeeInr = breakdown.extractionFeeInr;
    const deliveryFeeInr = payload.deliveryFeeInr ?? breakdown.deliveryFeeInr;
    const bargainDiscountInr = payload.bargainDiscountInr ?? breakdown.bargainDiscountInr;
    const platformCommissionInr =
      payload.platformCommissionInr ?? breakdown.platformCommissionInr;
    const totalPayableInr =
      payload.totalPriceInr ??
      Math.max(
        0,
        itemPriceInr -
          bargainDiscountInr +
          extractionFeeInr +
          platformCommissionInr +
          deliveryFeeInr
      );

    const redeemedBargainId =
      payload.redeemedBargainId ?? breakdown.matchedBargain?.id;
    const resolvedPartnerLabel =
      payload.logisticsPartner || breakdown.logisticsPartnerLabel;

    const orderNum = getNextNumericId(
      orders.map((o) => o.orderCode || o.id),
      'SH-ORD-',
      2040
    );
    const orderCode = `SH-ORD-${orderNum}`;

    // Context-aware lifecycle state machine:
    // Only soldered components ordered as EXTRACTED_TESTED_PART enter PENDING_EXTRACTION.
    // RAW_DONOR_BOARD and READY_TO_USE pre-desoldered spares skip workbench extraction and start at READY_FOR_DISPATCH.
    const requiresHotAirExtraction =
      payload.mode === 'EXTRACTED_TESTED_PART' &&
      targetBoard.hardwareMode !== 'READY_TO_USE' &&
      extractionFeeInr > 0;

    const newOrder: Order = {
      id: `ORD-${orderNum}`,
      orderCode,
      buyerId: currentUser.id,
      buyerEmail: currentUser.email,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerAddress: payload.buyerAddress,
      buyerState: payload.buyerState || 'Tamil Nadu',
      buyerDistrict: payload.buyerDistrict || 'Chennai',
      buyerPincode: payload.buyerPincode || '600001',
      sellerId: targetBoard.sellerId,
      sellerEmail: targetBoard.sellerEmail,
      sellerName: targetBoard.sellerName,
      sellerPhone: targetBoard.sellerPhone,
      sellerDistrict: targetBoard.sellerDistrict || targetBoard.locationCity || 'Chennai',
      donorBoardId: payload.donorBoardId,
      componentId: payload.componentId,
      componentIds: payload.componentId ? [payload.componentId] : [],
      mode: payload.mode,
      hardwareMode: targetBoard.hardwareMode,
      deliveryType: payload.deliveryType,
      logisticsPartner: resolvedPartnerLabel,
      itemPriceInr,
      extractionFeeInr,
      deliveryFeeInr,
      platformCommissionInr,
      totalPayableInr,
      totalPriceInr: totalPayableInr,
      isProOrder: isPro,
      bargainDiscountInr,
      redeemedBargainId,
      status: requiresHotAirExtraction
        ? 'PENDING_EXTRACTION'
        : 'READY_FOR_DISPATCH',
      multimeterReadingValue:
        payload.mode === 'RAW_DONOR_BOARD'
          ? 'As-Is Raw Donor Assembly (Bypass / Self-Salvage)'
          : targetBoard.hardwareMode === 'READY_TO_USE'
          ? 'Pre-Desoldered Ready-to-Use Spare (Verified)'
          : '',
      trackingOrPorterLink: '',
      upiUtrOrPaymentId: payload.upiUtrOrPaymentId || '',
      paymentUtr: payload.upiUtrOrPaymentId || '',
      createdAt: new Date().toISOString(),
    };

    // Single-use bargain invariant + Automatic Bargain Expiration for sold-out targets
    setBargainOffers((prev) =>
      prev.map((b) => {
        if (redeemedBargainId && b.id === redeemedBargainId) {
          return { ...b, status: 'REDEEMED' };
        }
        if (b.status !== 'PENDING' && b.status !== 'ACCEPTED') {
          return b;
        }
        // If the entire board was bought raw, expire all remaining offers on this board and its parts
        if (payload.mode === 'RAW_DONOR_BOARD' && b.boardId === payload.donorBoardId) {
          return { ...b, status: 'EXPIRED' };
        }
        // If a specific component was bought, expire remaining offers on that component
        // AND expire BOARD-level offers on the parent board (since the full raw board is now PARTIALLY_HARVESTED)
        if (payload.mode === 'EXTRACTED_TESTED_PART' && b.boardId === payload.donorBoardId) {
          if (
            (payload.componentId && b.componentId === payload.componentId) ||
            b.targetType === 'BOARD' ||
            !b.componentId
          ) {
            return { ...b, status: 'EXPIRED' };
          }
        }
        return b;
      })
    );

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
      const updatedComps = components.map((c) =>
        c.id === payload.componentId ? { ...c, status: 'EXTRACTED_SOLD' as const } : c
      );
      setComponents(updatedComps);

      const remainingIntactForBoard = updatedComps.filter(
        (c) => c.donorBoardId === payload.donorBoardId && c.status === 'INTACT'
      ).length;

      setBoards((prev) =>
        prev.map((b) => {
          if (b.id !== payload.donorBoardId) return b;
          const totalCount =
            b.totalComponentsCount ??
            updatedComps.filter((c) => c.donorBoardId === b.id).length;
          return {
            ...b,
            status:
              remainingIntactForBoard < totalCount || b.status === 'AVAILABLE'
                ? 'PARTIALLY_HARVESTED'
                : b.status,
            intactComponentsCount: remainingIntactForBoard,
          };
        })
      );
    }

    setOrders((prev) => [newOrder, ...prev]);
    broadcastLocalStateUpdate();

    syncCreateOrderBackend(newOrder).catch(() => undefined);

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabasePlaceSalvageOrder({
        orderCode,
        buyerName: payload.buyerName,
        buyerPhone: payload.buyerPhone,
        buyerAddress: payload.buyerAddress,
        buyerState: payload.buyerState,
        buyerDistrict: payload.buyerDistrict,
        buyerPincode: payload.buyerPincode,
        donorBoardId: payload.donorBoardId,
        componentId: payload.componentId,
        mode: payload.mode,
        deliveryType: payload.deliveryType,
        logisticsPartner: resolvedPartnerLabel,
        itemPriceInr,
        extractionFeeInr,
        deliveryFeeInr,
        platformCommissionInr,
        totalPayableInr,
        upiUtrOrPaymentId: payload.upiUtrOrPaymentId,
      })
        .then(() => refreshFromSupabase())
        .catch((err) => setLastSyncError(err?.message || 'RPC checkout failed'));
    }

    return newOrder;
  };

  /**
   * Atomic Multi-Item Bulk Cart Order Engine:
   * 1. Validates every component is still INTACT and parent board is not SOLD_RAW or self-owned.
   * 2. Atomically locks all purchased componentIds as EXTRACTED_SOLD.
   * 3. Recalculates intactComponentsCount on each affected parent board and transitions status to PARTIALLY_HARVESTED.
   * 4. Creates linked Order records so every part requiring hot-air extraction enters the Technician Workbench queue.
   */
  const placeBulkCartOrder = (payload: PlaceBulkCartOrderPayload): Order[] => {
    const uniqueCompIds = Array.from(new Set(payload.componentIds));
    if (uniqueCompIds.length === 0) {
      throw new Error('Your bulk cart is empty.');
    }

    const boardMap = new Map(boards.map((b) => [b.id, b]));
    const targetComps: HarvestableComponent[] = [];

    for (const compId of uniqueCompIds) {
      const comp = components.find((c) => c.id === compId);
      if (!comp) {
        throw new Error(`Component ${compId} no longer exists.`);
      }
      if (comp.status !== 'INTACT') {
        throw new Error(
          `Component ${comp.partNumber} (${comp.partName}) was already sold. Please remove it from your cart.`
        );
      }
      const parentBoard = boardMap.get(comp.donorBoardId);
      if (!parentBoard || parentBoard.status === 'SOLD_RAW') {
        throw new Error(
          `Donor board for ${comp.partNumber} is no longer available.`
        );
      }
      if (parentBoard.sellerId && parentBoard.sellerId === currentUser.id) {
        throw new Error(
          `Self-purchase guard: You cannot purchase your own listing (${comp.partNumber}).`
        );
      }
      targetComps.push(comp);
    }

    const isPro = Boolean(currentUser.isProMember);
    const buyerDist = (payload.buyerDistrict || currentUser.district || 'Chennai').trim();
    const allSameDistrict = targetComps.every((c) => {
      const b = boardMap.get(c.donorBoardId);
      return (
        (b?.sellerDistrict || 'Chennai').toLowerCase().trim() ===
        buyerDist.toLowerCase()
      );
    });

    const totalPartsInr = targetComps.reduce((s, c) => s + c.partPriceInr, 0);
    const totalExtractionInr = targetComps.reduce((s, c) => {
      const b = boardMap.get(c.donorBoardId);
      return s + (b?.hardwareMode === 'READY_TO_USE' ? 0 : c.extractionFeeInr);
    }, 0);
    const unifiedCommissionInr = isPro
      ? 0
      : Math.min(15, Math.max(5, Math.round((totalPartsInr + totalExtractionInr) * 0.05)));
    const bundledShippingInr = allSameDistrict ? 35 : 45;
    const deliveryType: DeliveryType = allSameDistrict
      ? 'HYPERLOCAL_RAPIDO'
      : 'OUTSTATION_PARCEL';
    const partnerLabel = allSameDistrict
      ? 'Rapido Bike Parcel (Bundled)'
      : 'India Post Speed Post (Bundled)';

    // Atomically mark all purchased components as EXTRACTED_SOLD
    const purchasedSet = new Set(uniqueCompIds);
    const affectedBoardIds = new Set(targetComps.map((c) => c.donorBoardId));

    const updatedComponents = components.map((c) =>
      purchasedSet.has(c.id) ? { ...c, status: 'EXTRACTED_SOLD' as const } : c
    );
    setComponents(updatedComponents);

    // Update each affected parent board's intactComponentsCount and transition to PARTIALLY_HARVESTED
    setBoards((prev) =>
      prev.map((b) => {
        if (!affectedBoardIds.has(b.id)) return b;
        const boardComps = updatedComponents.filter((c) => c.donorBoardId === b.id);
        const totalCount = b.totalComponentsCount ?? boardComps.length;
        const remainingIntact = boardComps.filter((c) => c.status === 'INTACT').length;
        return {
          ...b,
          intactComponentsCount: remainingIntact,
          status:
            remainingIntact < totalCount || b.status === 'AVAILABLE'
              ? 'PARTIALLY_HARVESTED'
              : b.status,
        };
      })
    );

    // Expire any remaining PENDING or ACCEPTED bargains on sold components or affected raw boards
    setBargainOffers((prev) =>
      prev.map((offer) => {
        if (offer.status !== 'PENDING' && offer.status !== 'ACCEPTED') {
          return offer;
        }
        if (offer.componentId && purchasedSet.has(offer.componentId)) {
          return { ...offer, status: 'EXPIRED' };
        }
        if (
          affectedBoardIds.has(offer.boardId) &&
          (offer.targetType === 'BOARD' || !offer.componentId)
        ) {
          return { ...offer, status: 'EXPIRED' };
        }
        return offer;
      })
    );

    // Create linked Order records so each component requiring hot-air extraction appears in the Workbench queue
    let nextOrderNum = getNextNumericId(
      orders.map((o) => o.orderCode || o.id),
      'SH-ORD-',
      2040
    );

    const createdOrders: Order[] = targetComps.map((comp, idx) => {
      const parentBoard = boardMap.get(comp.donorBoardId)!;
      const compExtractionFee =
        parentBoard.hardwareMode === 'READY_TO_USE' ? 0 : comp.extractionFeeInr;
      const requiresExtraction =
        parentBoard.hardwareMode !== 'READY_TO_USE' && compExtractionFee > 0;
      // Attach bundled shipping & commission to first order in the bulk batch so grand total matches 100%
      const orderDeliveryFee = idx === 0 ? bundledShippingInr : 0;
      const orderCommissionFee = idx === 0 ? unifiedCommissionInr : 0;
      const orderTotal =
        comp.partPriceInr + compExtractionFee + orderDeliveryFee + orderCommissionFee;
      const orderCode = `SH-ORD-${nextOrderNum + idx}`;

      return {
        id: `ORD-${nextOrderNum + idx}`,
        orderCode,
        buyerId: currentUser.id,
        buyerEmail: currentUser.email,
        buyerName: payload.buyerName,
        buyerPhone: payload.buyerPhone,
        buyerAddress: payload.buyerAddress,
        buyerState: payload.buyerState || currentUser.state || 'Tamil Nadu',
        buyerDistrict: buyerDist,
        buyerPincode: payload.buyerPincode || currentUser.pincode || '600001',
        sellerId: parentBoard.sellerId,
        sellerEmail: parentBoard.sellerEmail,
        sellerName: parentBoard.sellerName,
        sellerPhone: parentBoard.sellerPhone,
        sellerDistrict: parentBoard.sellerDistrict || parentBoard.locationCity || 'Chennai',
        donorBoardId: parentBoard.id,
        componentId: comp.id,
        componentIds: uniqueCompIds,
        mode: 'EXTRACTED_TESTED_PART',
        hardwareMode: parentBoard.hardwareMode,
        deliveryType,
        logisticsPartner: partnerLabel,
        itemPriceInr: comp.partPriceInr,
        extractionFeeInr: compExtractionFee,
        deliveryFeeInr: orderDeliveryFee,
        platformCommissionInr: orderCommissionFee,
        totalPayableInr: orderTotal,
        totalPriceInr: orderTotal,
        isProOrder: isPro,
        bargainDiscountInr: 0,
        status: requiresExtraction ? 'PENDING_EXTRACTION' : 'READY_FOR_DISPATCH',
        multimeterReadingValue: requiresExtraction
          ? ''
          : 'Pre-Desoldered Ready-to-Use Spare (Verified)',
        trackingOrPorterLink: '',
        upiUtrOrPaymentId: payload.upiUtrOrPaymentId || '',
        paymentUtr: payload.upiUtrOrPaymentId || '',
        createdAt: new Date().toISOString(),
      };
    });

    setOrders((prev) => [...createdOrders, ...prev]);
    broadcastLocalStateUpdate();

    createdOrders.forEach((ord) => {
      syncCreateOrderBackend(ord).catch(() => undefined);
    });

    return createdOrders;
  };

  const publishDonorBoard = (input: NewBoardListingInput): DonorBoard => {
    const nextBoardNumber = getNextNumericId(
      boards.map((b) => b.id),
      'BRD-',
      100
    );
    const newBoardId = `BRD-${nextBoardNumber}`;

    const hwMode = input.hardwareMode || 'READY_TO_USE';
    const resolvedSellerId = input.sellerId || currentUser.id;
    const resolvedSellerEmail = input.sellerEmail || currentUser.email;

    // Distinct pricing for BOTH vs READY_TO_USE vs SOLDERED_RAW
    const singlePartPrice =
      hwMode === 'BOTH'
        ? input.desolderedPriceInr ?? Math.max(10, Math.round(input.rawBoardPriceInr * 0.5))
        : input.rawBoardPriceInr;
    const fullRawBoardPrice =
      hwMode === 'BOTH'
        ? Math.max(singlePartPrice, input.rawBoardPriceInr)
        : input.rawBoardPriceInr;

    const componentsList =
      input.components && input.components.length > 0
        ? input.components
        : hwMode === 'BOTH'
        ? [
            {
              partNumber: input.subModel || input.boardName,
              partName: `${input.boardName} — Primary Target IC / Module`,
              componentCategory: 'Primary Harvestable IC',
              packageType: 'SMD / Through-Hole',
              difficulty: 'LEVEL_3_HOT_AIR_SMD' as const,
              recommendedTempC: 320,
              partPriceInr: singlePartPrice,
              extractionFeeInr: 20,
              isPrimaryFault: false,
            },
            {
              partNumber: `${(input.subModel || input.boardName).slice(0, 12)}-AUX`,
              partName: `${input.boardName} — Secondary Power / Relay Stage`,
              componentCategory: 'Secondary Power Stage',
              packageType: 'Through-Hole / SMD',
              difficulty: 'LEVEL_2_BASIC_IRON' as const,
              recommendedTempC: 300,
              partPriceInr: Math.max(15, Math.round(singlePartPrice * 0.75)),
              extractionFeeInr: 15,
              isPrimaryFault: false,
            },
          ]
        : [
            {
              partNumber: input.subModel || input.boardName,
              partName: `${input.boardName} (${
                hwMode === 'SOLDERED_RAW'
                  ? 'Raw Donor Assembly'
                  : 'Intact Functional Sub-assembly'
              })`,
              componentCategory: 'Core Module',
              packageType: hwMode === 'SOLDERED_RAW' ? 'Soldered PCB' : 'Module',
              difficulty:
                hwMode === 'SOLDERED_RAW'
                  ? ('LEVEL_2_BASIC_IRON' as const)
                  : ('LEVEL_1_PLUG_PULL' as const),
              recommendedTempC: hwMode === 'SOLDERED_RAW' ? 320 : 25,
              partPriceInr: singlePartPrice,
              extractionFeeInr: hwMode === 'READY_TO_USE' ? 0 : 15,
              isPrimaryFault: false,
            },
          ];

    const intactCount = componentsList.filter((c) => !c.isPrimaryFault).length;
    const district = input.sellerDistrict || currentUser.district || 'Chennai';

    const newBoard: DonorBoard = {
      id: newBoardId,
      boardName: input.boardName,
      category: input.category,
      subModel: input.subModel,
      sellerId: resolvedSellerId,
      sellerEmail: resolvedSellerEmail,
      sellerName: input.sellerName || currentUser.fullName || 'Verified Seller',
      sellerPhone: input.sellerPhone || currentUser.phone,
      sellerState: input.sellerState || currentUser.state || 'Tamil Nadu',
      sellerDistrict: district,
      sellerPincode: input.sellerPincode || currentUser.pincode || '600001',
      sellerFullAddress: input.sellerFullAddress || `${input.locationArea}, ${district}`,
      locationCity: district,
      locationArea: input.locationArea,
      distanceKm: input.distanceKm,
      primaryFault: input.primaryFault,
      rawBoardPriceInr: fullRawBoardPrice,
      desolderedPriceInr:
        hwMode === 'SOLDERED_RAW'
          ? undefined
          : hwMode === 'READY_TO_USE'
          ? singlePartPrice
          : singlePartPrice,
      hardwareMode: hwMode,
      allowBargain: input.allowBargain ?? true,
      isVerified: input.isVerified ?? true,
      imageUrl: input.imageUrl,
      status: 'AVAILABLE',
      totalComponentsCount: componentsList.length,
      intactComponentsCount: intactCount,
      createdAt: new Date().toISOString(),
    };

    const newChildComponents: HarvestableComponent[] = componentsList.map(
      (comp, idx) => ({
        id: `CMP-${nextBoardNumber}-${idx + 1}`,
        donorBoardId: newBoardId,
        sellerId: resolvedSellerId,
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

    syncCreateBoardBackend(newBoard, newChildComponents).catch(() => undefined);

    if (connectionMode === 'SUPABASE_CLOUD') {
      supabasePublishDonorBoard({
        ...input,
        rawBoardPriceInr: fullRawBoardPrice,
        components: componentsList.map((c) => ({
          ...c,
          isPrimaryFault: Boolean(c.isPrimaryFault),
        })),
      })
        .then(() => refreshFromSupabase())
        .catch((err) =>
          setLastSyncError(err?.message || 'Failed to publish board to Supabase')
        );
    }

    return newBoard;
  };

  const submitBargainOffer = (
    offerInput: Omit<BargainOffer, 'id' | 'status' | 'createdAt'>
  ): BargainOffer => {
    const parentBoard = boards.find((b) => b.id === offerInput.boardId);

    // 1. Self-Bargain Guard
    const resolvedSellerId = offerInput.sellerId || parentBoard?.sellerId;
    if (resolvedSellerId && resolvedSellerId === currentUser.id) {
      throw new Error(
        'Self-bargain guard: You cannot submit a bargain offer on your own listing.'
      );
    }

    // 2. Store-Level Price Bounds Validation (50% floor to < 100% original price)
    const minAllowedOffer = Math.ceil(offerInput.originalPriceInr * 0.5);
    if (
      offerInput.offeredPriceInr < minAllowedOffer ||
      offerInput.offeredPriceInr >= offerInput.originalPriceInr
    ) {
      throw new Error(
        `Bargain offer must be between ₹${minAllowedOffer} (50% floor) and ₹${
          offerInput.originalPriceInr - 1
        }.`
      );
    }

    const targetType =
      offerInput.targetType || (offerInput.componentId ? 'COMPONENT' : 'BOARD');
    const targetId =
      offerInput.targetId || offerInput.componentId || offerInput.boardId;

    // 3. Prevent Duplicate Bargain Offers: update existing PENDING offer for same buyer & target
    const existingPending = bargainOffers.find(
      (o) =>
        o.status === 'PENDING' &&
        o.buyerId === (offerInput.buyerId || currentUser.id) &&
        o.boardId === offerInput.boardId &&
        (o.targetType || (o.componentId ? 'COMPONENT' : 'BOARD')) === targetType &&
        (o.componentId || null) === (offerInput.componentId || null)
    );

    if (existingPending) {
      const updatedOffer: BargainOffer = {
        ...existingPending,
        ...offerInput,
        sellerId: resolvedSellerId,
        targetType,
        targetId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      setBargainOffers((prev) =>
        prev.map((o) => (o.id === existingPending.id ? updatedOffer : o))
      );
      broadcastLocalStateUpdate();
      syncCreateBargainBackend(updatedOffer).catch(() => undefined);
      return updatedOffer;
    }

    const newOffer: BargainOffer = {
      ...offerInput,
      buyerId: offerInput.buyerId || currentUser.id,
      sellerId: resolvedSellerId,
      targetType,
      targetId,
      id: `BRG-${Date.now().toString().slice(-6)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setBargainOffers((prev) => [newOffer, ...prev]);
    broadcastLocalStateUpdate();
    syncCreateBargainBackend(newOffer).catch(() => undefined);
    return newOffer;
  };

  const acceptBargainOffer = (offerId: string) => {
    const targetOffer = bargainOffers.find((o) => o.id === offerId);
    if (!targetOffer) return;

    const isOwner =
      currentUser.role === 'OWNER_ADMIN' || Boolean(currentUser.isOwnerAdmin);
    // Strict guard: A buyer can NEVER accept their own bargain offer
    if (!isOwner && targetOffer.buyerId === currentUser.id) {
      throw new Error(
        'Authorization guard: Buyers cannot accept their own bargain offers.'
      );
    }

    setBargainOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'ACCEPTED' } : o))
    );
    broadcastLocalStateUpdate();
    syncUpdateBargainStatusBackend(
      offerId,
      'ACCEPTED',
      targetOffer?.offeredPriceInr
    ).catch(() => undefined);
  };

  const rejectBargainOffer = (offerId: string) => {
    setBargainOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'REJECTED' } : o))
    );
    broadcastLocalStateUpdate();
    syncUpdateBargainStatusBackend(offerId, 'REJECTED').catch(() => undefined);
  };

  const cancelBargainOffer = (offerId: string) => {
    setBargainOffers((prev) =>
      prev.map((o) =>
        o.id === offerId && o.buyerId === currentUser.id
          ? { ...o, status: 'CANCELLED' }
          : o
      )
    );
    broadcastLocalStateUpdate();
  };

  const dispatchOrderBySeller = (
    orderId: string,
    trackingOrPorterLink: string,
    targetStatus: OrderStatus = 'IN_TRANSIT'
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              trackingOrPorterLink:
                trackingOrPorterLink.trim() || o.trackingOrPorterLink || '',
              status: targetStatus,
            }
          : o
      )
    );
    broadcastLocalStateUpdate();
  };

  const upgradeToProMembership = (plan: 'monthly' | 'yearly') => {
    const expiry = new Date();
    if (plan === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    const updatedUser: UserProfile = {
      ...currentUser,
      isProMember: true,
      proMembershipExpiry: expiry.toISOString(),
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    broadcastLocalStateUpdate();
  };

  const toggleUserProStatus = (userId?: string) => {
    if (userId && userId !== currentUser.id) {
      setProDirectoryOverrides((prev) => ({
        ...prev,
        [userId]: !(prev[userId] ?? false),
      }));
      broadcastLocalStateUpdate();
      return;
    }

    const nextStatus = !currentUser.isProMember;
    const updatedUser: UserProfile = {
      ...currentUser,
      isProMember: nextStatus,
      proMembershipExpiry: nextStatus
        ? new Date(Date.now() + 365 * 24 * 3600000).toISOString()
        : undefined,
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    broadcastLocalStateUpdate();
  };

  const switchOwnerAdmin = () => {
    const ownerUser: UserProfile = {
      id: 'USR-OWNER-ADMIN-01',
      email: 'rkboomesh@gmail.com',
      fullName: 'Boomesh R K (Founder & Admin)',
      role: 'OWNER_ADMIN',
      organization: 'SiliconHarvest Headquarters',
      phone: '+91 7200255069',
      defaultAddress: 'SiliconHarvest Hub, Guindy Industrial Estate, Chennai 600025',
      state: 'Tamil Nadu',
      district: 'Chennai',
      pincode: '600025',
      walletBalanceInr: 8450,
      isProMember: true,
      proMembershipExpiry: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
      isOwnerAdmin: true,
      isSupabaseAuthenticated: true,
      authMethod: 'OWNER_OVERRIDE',
    };
    setCurrentUser(ownerUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(ownerUser));
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(ownerUser));
    } catch {
      // ignore
    }
    syncUserAccountBackend(ownerUser).catch(() => undefined);
    setActiveTab('OWNER_ADMIN');
    broadcastLocalStateUpdate();
  };

  // Synchronizes board rawBoardPriceInr, desolderedPriceInr, and single-module component price
  const updateBoardPrice = (boardId: string, newPrice: number) => {
    const clampedPrice = Math.max(1, Math.round(newPrice));
    const existingBoard = boards.find((b) => b.id === boardId);
    const oldRawPrice = existingBoard?.rawBoardPriceInr;

    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const nextDesoldered =
          b.hardwareMode === 'SOLDERED_RAW'
            ? undefined
            : b.hardwareMode === 'READY_TO_USE'
            ? clampedPrice
            : clampedPrice + 25;
        return {
          ...b,
          rawBoardPriceInr: clampedPrice,
          desolderedPriceInr: nextDesoldered,
        };
      })
    );

    // Sync child component price if it was a single-module auto-generated listing
    setComponents((prev) => {
      const boardComps = prev.filter((c) => c.donorBoardId === boardId);
      if (boardComps.length === 1 || oldRawPrice !== undefined) {
        return prev.map((c) => {
          if (c.donorBoardId !== boardId) return c;
          if (boardComps.length === 1 || c.partPriceInr === oldRawPrice) {
            return { ...c, partPriceInr: clampedPrice };
          }
          return c;
        });
      }
      return prev;
    });

    broadcastLocalStateUpdate();
    syncAdminBoardPriceBackend(boardId, clampedPrice).catch(() => undefined);
  };

  const toggleBoardVerified = (boardId: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, isVerified: !b.isVerified } : b))
    );
    broadcastLocalStateUpdate();
  };

  const deleteBoardListing = (boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setComponents((prev) => prev.filter((c) => c.donorBoardId !== boardId));
    broadcastLocalStateUpdate();
    syncAdminDeleteBoardBackend(boardId).catch(() => undefined);
  };

  const updateOrderStatusAdmin = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    broadcastLocalStateUpdate();
    syncAdminOrderUpdateBackend(orderId, newStatus).catch(() => undefined);
  };

  const resolveSupportTicket = (ticketId: string) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
    );
    broadcastLocalStateUpdate();
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
      '3.30V / 0.51V Diode Drop Verified — Passed Multimeter Load Check';

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

  const createSupportTicket = async (ticket: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    orderCode?: string;
    category: string;
    message: string;
  }): Promise<SupportTicket> => {
    const newTicket = await supabaseCreateSupportTicket(ticket);
    setSupportTickets((prev) => [newTicket, ...prev]);
    broadcastLocalStateUpdate();
    syncCreateSupportTicketBackend({
      id: newTicket.id,
      senderName: newTicket.customerName,
      senderEmail: newTicket.customerEmail || 'rkboomesh@gmail.com',
      senderPhone: newTicket.customerPhone,
      category: newTicket.category,
      orderCode: newTicket.orderCode,
      message: newTicket.message,
      status: 'OPEN',
      createdAt: newTicket.createdAt,
    }).catch(() => undefined);
    return newTicket;
  };

  const resetDemoState = () => {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      LEGACY_KEYS_TO_PURGE.forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem(USER_SESSION_KEY);
    } catch {
      // ignore
    }
    setBoards(INITIAL_DONOR_BOARDS);
    setComponents(INITIAL_COMPONENTS);
    setOrders(INITIAL_ORDERS);
    setBargainOffers(INITIAL_BARGAINS);
    setSupportTickets([]);
    setProDirectoryOverrides({});
    setCurrentUser(DEFAULT_GUEST_PROFILE);
    setActiveTab('LOGIN');
    broadcastLocalStateUpdate();
  };

  return (
    <HarvestStoreContext.Provider
      value={{
        boards,
        components,
        orders,
        bargainOffers,
        supportTickets,
        techWalletBalanceInr,
        techCompletedJobsCount,
        activeTab,
        setActiveTab,
        pendingCheckoutTarget,
        setPendingCheckoutTarget,
        currentUser,
        proDirectoryOverrides,
        switchDemoRole,
        updateUserProfile,
        signInWithEmail,
        signUpWithEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        signInWithGoogle,
        quickGoogleSignIn,
        isSignedIn,
        signOut,
        connectionMode,
        isSyncing,
        lastSyncError,
        realtimeEventsCount,
        connectSupabase,
        disconnectSupabase,
        refreshFromSupabase,
        placeOrder,
        placeBulkCartOrder,
        publishDonorBoard,
        submitBargainOffer,
        acceptBargainOffer,
        rejectBargainOffer,
        cancelBargainOffer,
        dispatchOrderBySeller,
        upgradeToProMembership,
        toggleUserProStatus,
        switchOwnerAdmin,
        updateBoardPrice,
        toggleBoardVerified,
        deleteBoardListing,
        updateOrderStatusAdmin,
        resolveSupportTicket,
        completeExtractionJob,
        updateOrderTracking,
        markOrderCompleted,
        createSupportTicket,
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
