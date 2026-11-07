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
const USER_SESSION_KEY = 'silicon_harvest_user_session';

const STORAGE_KEYS = {
  BOARDS: 'silicon_harvest_prod_v3_boards',
  COMPONENTS: 'silicon_harvest_prod_v3_components',
  ORDERS: 'silicon_harvest_prod_v3_orders',
  USER: 'silicon_harvest_prod_v3_user',
  TICKETS: 'silicon_harvest_prod_v3_tickets',
  BARGAINS: 'silicon_harvest_prod_v3_bargains',
  PRO_OVERRIDES: 'silicon_harvest_prod_v3_pro_overrides',
};

const LEGACY_KEYS_TO_PURGE = [
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
];

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

export interface NewBoardListingInput {
  boardName: string;
  category: BoardCategory;
  subModel?: string;
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
    fullName?: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  quickGoogleSignIn: (email: string, fullName: string) => Promise<{ error: string | null }>;
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
  publishDonorBoard: (input: NewBoardListingInput) => DonorBoard;
  submitBargainOffer: (offer: Omit<BargainOffer, 'id' | 'status' | 'createdAt'>) => BargainOffer;
  acceptBargainOffer: (offerId: string) => void;
  rejectBargainOffer: (offerId: string) => void;
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
  // Purge legacy prototype keys on first load
  useEffect(() => {
    try {
      LEGACY_KEYS_TO_PURGE.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
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
        (o.status === 'READY_FOR_DISPATCH' ||
          o.status === 'PICKED_UP_BY_PARTNER' ||
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
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(supportTickets));
    } catch {
      // ignore
    }
  }, [supportTickets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BARGAINS, JSON.stringify(bargainOffers));
    } catch {
      // ignore
    }
  }, [bargainOffers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRO_OVERRIDES, JSON.stringify(proDirectoryOverrides));
    } catch {
      // ignore
    }
  }, [proDirectoryOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      if (currentUser.id !== DEFAULT_GUEST_PROFILE.id && currentUser.email) {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
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

  const verifyPhoneOtp = async (phone: string, token: string, fullName = '') => {
    const { profile, error } = await supabaseVerifyPhoneOtp(phone, token, fullName);
    if (profile) {
      setCurrentUser(profile);
      setActiveTab('MARKETPLACE');
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    return supabaseSignInWithGoogle();
  };

  const quickGoogleSignIn = async (email: string, fullName: string) => {
    const { profile, error } = await quickGoogleProfileSignIn(email, fullName);
    if (profile) {
      setCurrentUser(profile);
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

    const targetComp = payload.componentId
      ? components.find((c) => c.id === payload.componentId) || null
      : null;

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

    const newOrder: Order = {
      id: `ORD-${orderNum}`,
      orderCode,
      buyerName: payload.buyerName,
      buyerPhone: payload.buyerPhone,
      buyerAddress: payload.buyerAddress,
      buyerState: payload.buyerState || 'Tamil Nadu',
      buyerDistrict: payload.buyerDistrict || 'Chennai',
      buyerPincode: payload.buyerPincode || '600001',
      sellerDistrict: targetBoard.sellerDistrict || targetBoard.locationCity || 'Chennai',
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
      totalPriceInr: totalPayableInr,
      isProOrder: isPro,
      bargainDiscountInr,
      redeemedBargainId,
      status:
        payload.mode === 'RAW_DONOR_BOARD'
          ? 'READY_FOR_DISPATCH'
          : 'PENDING_EXTRACTION',
      multimeterReadingValue:
        payload.mode === 'RAW_DONOR_BOARD'
          ? 'As-Is Raw Donor Assembly (Bypass / Self-Salvage)'
          : '',
      trackingOrPorterLink: '',
      upiUtrOrPaymentId: payload.upiUtrOrPaymentId || '',
      paymentUtr: payload.upiUtrOrPaymentId || '',
      createdAt: new Date().toISOString(),
    };

    // Single-use bargain invariant: immediately transition redeemed bargain to 'REDEEMED'
    if (redeemedBargainId) {
      setBargainOffers((prev) =>
        prev.map((b) =>
          b.id === redeemedBargainId ? { ...b, status: 'REDEEMED' } : b
        )
      );
    }

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

    syncCreateOrderBackend(newOrder).catch(() => undefined);

    // If connected to Supabase Cloud, invoke the PostgreSQL Atomic RPC `place_salvage_order`
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

  const publishDonorBoard = (input: NewBoardListingInput): DonorBoard => {
    const nextBoardNumber = getNextNumericId(
      boards.map((b) => b.id),
      'BRD-',
      100
    );
    const newBoardId = `BRD-${nextBoardNumber}`;

    const hwMode = input.hardwareMode || 'READY_TO_USE';

    const componentsList =
      input.components && input.components.length > 0
        ? input.components
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
              partPriceInr: input.rawBoardPriceInr,
              extractionFeeInr: hwMode === 'READY_TO_USE' ? 0 : 15,
              isPrimaryFault: false,
            },
          ];

    const intactCount = componentsList.filter((c) => !c.isPrimaryFault).length;
    const district = input.sellerDistrict || 'Chennai';

    const newBoard: DonorBoard = {
      id: newBoardId,
      boardName: input.boardName,
      category: input.category,
      subModel: input.subModel,
      sellerName: input.sellerName,
      sellerPhone: input.sellerPhone,
      sellerState: input.sellerState || 'Tamil Nadu',
      sellerDistrict: district,
      sellerPincode: input.sellerPincode || '600001',
      sellerFullAddress: input.sellerFullAddress || `${input.locationArea}, ${district}`,
      locationCity: district,
      locationArea: input.locationArea,
      distanceKm: input.distanceKm,
      primaryFault: input.primaryFault,
      rawBoardPriceInr: input.rawBoardPriceInr,
      desolderedPriceInr:
        input.desolderedPriceInr ??
        (hwMode === 'SOLDERED_RAW'
          ? undefined
          : hwMode === 'READY_TO_USE'
          ? input.rawBoardPriceInr
          : input.rawBoardPriceInr + 25),
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
    const targetType = offerInput.targetType || (offerInput.componentId ? 'COMPONENT' : 'BOARD');
    const targetId = offerInput.targetId || offerInput.componentId || offerInput.boardId;
    const newOffer: BargainOffer = {
      ...offerInput,
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
    setBargainOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'ACCEPTED' } : o))
    );
    broadcastLocalStateUpdate();
    syncUpdateBargainStatusBackend(offerId, 'ACCEPTED', targetOffer?.offeredPriceInr).catch(
      () => undefined
    );
  };

  const rejectBargainOffer = (offerId: string) => {
    setBargainOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'REJECTED' } : o))
    );
    broadcastLocalStateUpdate();
    syncUpdateBargainStatusBackend(offerId, 'REJECTED').catch(() => undefined);
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
        publishDonorBoard,
        submitBargainOffer,
        acceptBargainOffer,
        rejectBargainOffer,
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
