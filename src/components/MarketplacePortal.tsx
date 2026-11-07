import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Layers,
  Cpu,
  MapPin,
  Flame,
  Sparkles,
  AlertTriangle,
  Thermometer,
  Eye,
  Lock,
  BookOpen,
  PlusCircle,
  ShoppingBag,
  Check,
  X,
  Truck,
  MessageCircle,
  Crown,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import {
  BoardCategory,
  DonorBoard,
  ExtractionDifficulty,
  HarvestableComponent,
  OrderMode,
} from '../types/harvest';
import { InspectionCheckoutModal } from './InspectionCheckoutModal';
import { DatasheetPinoutModal } from './DatasheetPinoutModal';
import { Hardware3DStage } from './Hardware3DStage';
import { Card3D } from './Card3D';
import {
  CATALOG_CATEGORIES,
  CatalogCategory,
  INDIAN_STATES_DISTRICTS,
} from '../data/catalogPricing';
import {
  calculateBulkCartBreakdown,
  computeEffectiveDistanceKm,
} from '../config/pricingEngine';

export const MarketplacePortal: React.FC = () => {
  const {
    boards,
    components,
    setActiveTab,
    placeOrder,
    submitBargainOffer,
    currentUser,
    pendingCheckoutTarget,
    setPendingCheckoutTarget,
  } = useHarvestStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    BoardCategory | 'ALL'
  >('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    ExtractionDifficulty | 'ALL'
  >('ALL');
  const [hyperlocalOnly, setHyperlocalOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'COMPONENT_VIEW' | 'BOARD_VIEW'>(
    'COMPONENT_VIEW'
  );

  // Scoped Bargain Modal State (tracks whether bargaining on a single Component or whole Board)
  const [bargainTargetBoard, setBargainTargetBoard] = useState<DonorBoard | null>(
    null
  );
  const [bargainTargetComponent, setBargainTargetComponent] =
    useState<HarvestableComponent | null>(null);
  const [bargainOfferAmount, setBargainOfferAmount] = useState<number>(0);
  const [bargainNote, setBargainNote] = useState<string>('');
  const [bargainSuccessMsg, setBargainSuccessMsg] = useState<string | null>(
    null
  );

  // Bulk Component Cart state
  const [bulkCartIds, setBulkCartIds] = useState<string[]>([]);
  const [showBulkCartModal, setShowBulkCartModal] = useState(false);
  const [bulkBuyerDistrict, setBulkBuyerDistrict] = useState(
    currentUser.district || 'Chennai'
  );
  const [bulkBuyerName, setBulkBuyerName] = useState(
    currentUser.fullName || 'Laptop Service Lab'
  );
  const [bulkBuyerPhone, setBulkBuyerPhone] = useState(
    currentUser.phone
      ? currentUser.phone.replace(/\D/g, '').slice(-10)
      : '9840012345'
  );
  const [bulkBuyerAddress, setBulkBuyerAddress] = useState(
    currentUser.defaultAddress || 'Shop #14, Ritchie Street, Chennai'
  );
  const [bulkUtr, setBulkUtr] = useState('429104829104');

  const toggleCartItem = (compId: string) => {
    setBulkCartIds((prev) =>
      prev.includes(compId)
        ? prev.filter((id) => id !== compId)
        : [...prev, compId]
    );
  };

  const bulkCartComponents = useMemo(
    () =>
      components.filter(
        (c) => bulkCartIds.includes(c.id) && c.status === 'INTACT'
      ),
    [components, bulkCartIds]
  );

  // Checkout Modal state
  const [modalTarget, setModalTarget] = useState<{
    board: DonorBoard;
    component: HarvestableComponent | null;
    mode: OrderMode;
  } | null>(null);

  // Pinout Spec Sheet Modal state
  const [pinoutTarget, setPinoutTarget] = useState<{
    component: HarvestableComponent;
    board?: DonorBoard;
  } | null>(null);

  const boardMap = useMemo(() => {
    const map = new Map<string, DonorBoard>();
    boards.forEach((b) => map.set(b.id, b));
    return map;
  }, [boards]);

  // Automatically open InspectionCheckoutModal if redirected from an Accepted Bargain in OrdersTrackerPortal
  useEffect(() => {
    if (!pendingCheckoutTarget) return;
    const targetBoard = boardMap.get(pendingCheckoutTarget.boardId);
    if (targetBoard) {
      const targetComp = pendingCheckoutTarget.componentId
        ? components.find((c) => c.id === pendingCheckoutTarget.componentId) ||
          null
        : components.find(
            (c) => c.donorBoardId === targetBoard.id && c.status === 'INTACT'
          ) || null;
      setModalTarget({
        board: targetBoard,
        component: targetComp,
        mode: pendingCheckoutTarget.mode,
      });
    }
    setPendingCheckoutTarget(null);
  }, [pendingCheckoutTarget, boardMap, components, setPendingCheckoutTarget]);

  const userDistrict = currentUser.district || 'Chennai';

  // Filtered intact components for Component View
  const filteredComponents = useMemo(() => {
    return components.filter((comp) => {
      if (comp.status !== 'INTACT') return false;
      const parent = boardMap.get(comp.donorBoardId);
      if (!parent || parent.status === 'SOLD_RAW') return false;

      if (selectedCategory !== 'ALL' && parent.category !== selectedCategory) {
        return false;
      }

      if (
        selectedDifficulty !== 'ALL' &&
        comp.difficulty !== selectedDifficulty
      ) {
        return false;
      }

      const effectiveKm = computeEffectiveDistanceKm(parent, userDistrict);
      if (hyperlocalOnly && effectiveKm >= 15) {
        return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchPart =
          comp.partNumber.toLowerCase().includes(q) ||
          comp.partName.toLowerCase().includes(q) ||
          comp.packageType.toLowerCase().includes(q) ||
          comp.componentCategory.toLowerCase().includes(q) ||
          parent.boardName.toLowerCase().includes(q) ||
          parent.locationArea.toLowerCase().includes(q);
        if (!matchPart) return false;
      }

      return true;
    });
  }, [
    components,
    boardMap,
    selectedCategory,
    selectedDifficulty,
    hyperlocalOnly,
    searchQuery,
    userDistrict,
  ]);

  // Filtered boards for Donor Board View
  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      if (selectedCategory !== 'ALL' && board.category !== selectedCategory) {
        return false;
      }
      const effectiveKm = computeEffectiveDistanceKm(board, userDistrict);
      if (hyperlocalOnly && effectiveKm >= 15) {
        return false;
      }
      const boardChildren = components.filter(
        (c) => c.donorBoardId === board.id
      );
      if (selectedDifficulty !== 'ALL') {
        const hasTier = boardChildren.some(
          (c) => c.status === 'INTACT' && c.difficulty === selectedDifficulty
        );
        if (!hasTier) return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchBoard =
          board.boardName.toLowerCase().includes(q) ||
          board.primaryFault.toLowerCase().includes(q) ||
          board.locationArea.toLowerCase().includes(q) ||
          boardChildren.some(
            (c) =>
              c.partNumber.toLowerCase().includes(q) ||
              c.partName.toLowerCase().includes(q)
          );
        if (!matchBoard) return false;
      }
      return true;
    });
  }, [
    boards,
    components,
    selectedCategory,
    selectedDifficulty,
    hyperlocalOnly,
    searchQuery,
    userDistrict,
  ]);

  const categoryOptions: { id: BoardCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Categories' },
    ...CATALOG_CATEGORIES.map((c: CatalogCategory) => ({
      id: c.id as BoardCategory,
      label: `${c.icon} ${c.shortName || c.name}`,
    })),
  ];

  const difficultyOptions: {
    id: ExtractionDifficulty | 'ALL';
    label: string;
  }[] = [
    { id: 'ALL', label: 'All Tiers' },
    { id: 'LEVEL_1_PLUG_PULL', label: '🟢 Plug & Pull' },
    { id: 'LEVEL_2_BASIC_IRON', label: '🟡 Basic Iron' },
    { id: 'LEVEL_2_THROUGH_HOLE', label: '🟠 Through-Hole' },
    { id: 'LEVEL_3_HOT_AIR_SMD', label: '🔴 Hot-Air SMD' },
    { id: 'LEVEL_4_BGA_REWORK', label: '🟣 BGA Rework' },
  ];

  const renderDifficultyBadge = (difficulty: ExtractionDifficulty) => {
    switch (difficulty) {
      case 'LEVEL_1_PLUG_PULL':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            🟢 Plug &amp; Pull
          </span>
        );
      case 'LEVEL_2_BASIC_IRON':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            🟡 Basic Iron
          </span>
        );
      case 'LEVEL_2_THROUGH_HOLE':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            🟠 Through-Hole
          </span>
        );
      case 'LEVEL_3_HOT_AIR_SMD':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            🔴 Hot-Air SMD
          </span>
        );
      case 'LEVEL_4_BGA_REWORK':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 border border-slate-700">
            🟣 BGA Rework
          </span>
        );
    }
  };

  const bargainOriginalPrice = bargainTargetComponent
    ? bargainTargetComponent.partPriceInr
    : bargainTargetBoard?.rawBoardPriceInr ?? 100;

  const bargainMinPrice = Math.max(10, Math.round(bargainOriginalPrice * 0.4));

  const handleBargainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bargainTargetBoard) return;

    const isComponentBargain = Boolean(bargainTargetComponent);
    const targetDisplayName = bargainTargetComponent
      ? `${bargainTargetComponent.partNumber} (${bargainTargetBoard.boardName})`
      : bargainTargetBoard.boardName;

    submitBargainOffer({
      boardId: bargainTargetBoard.id,
      componentId: bargainTargetComponent?.id ?? null,
      targetType: isComponentBargain ? 'COMPONENT' : 'BOARD',
      targetId: bargainTargetComponent
        ? bargainTargetComponent.id
        : bargainTargetBoard.id,
      boardName: targetDisplayName,
      buyerId: currentUser.id,
      buyerName: currentUser.fullName || 'Verified Buyer',
      buyerPhone: currentUser.phone || '+91 98401 23456',
      buyerDistrict: currentUser.district || 'Chennai',
      sellerName: bargainTargetBoard.sellerName,
      sellerPhone: bargainTargetBoard.sellerPhone || '+91 98401 23456',
      sellerDistrict: bargainTargetBoard.sellerDistrict || 'Chennai',
      originalPriceInr: bargainOriginalPrice,
      offeredPriceInr: bargainOfferAmount,
      note: bargainNote.trim(),
    });
    setBargainSuccessMsg(
      `Bargain offer of ₹${bargainOfferAmount} for ${targetDisplayName} submitted to ${bargainTargetBoard.sellerName}! Track it under "My Orders & Bargains".`
    );
    setTimeout(() => {
      setBargainSuccessMsg(null);
      setBargainTargetBoard(null);
      setBargainTargetComponent(null);
    }, 3500);
  };

  // Single-source-of-truth Bulk Cart breakdown
  const bulkCartSummary = useMemo(() => {
    return calculateBulkCartBreakdown({
      components: bulkCartComponents,
      boardMap,
      buyerDistrict: bulkBuyerDistrict,
      isProMember: Boolean(currentUser.isProMember),
    });
  }, [
    bulkCartComponents,
    boardMap,
    bulkBuyerDistrict,
    currentUser.isProMember,
  ]);

  return (
    <div className="space-y-12">
      {/* Interactive 3D Hardware Hero Stage & 4-Pillar Action Console */}
      <section className="pt-2 pb-2 md:pt-4 space-y-6">
        <Hardware3DStage
          activeBoardsCount={boards.length}
          intactComponentsCount={
            components.filter((c) => c.status === 'INTACT').length
          }
          onSelectPillar={(pillar) => {
            if (pillar === 'SELL') setActiveTab('SELLER_PORTAL');
            else if (pillar === 'PROCURE') {
              const el = document.getElementById('catalog-search-bar');
              el?.scrollIntoView({ behavior: 'smooth' });
            } else if (pillar === 'BARGAIN') setActiveTab('MEMBERSHIP');
            else if (pillar === 'TRACK') setActiveTab('ORDERS_TRACKER');
          }}
        />

        {/* Floating Frosted Glass Search & Filter Console */}
        <div
          id="catalog-search-bar"
          className="max-w-4xl mx-auto pt-2 space-y-3 sm:space-y-4 text-center"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input (16px on mobile prevents auto-zoom) */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IC part number, package, or board..."
                className="w-full pl-11 pr-20 py-3 sm:py-3.5 min-h-[44px] rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200 hover:border-slate-300 text-base sm:text-sm text-[#0F172A] placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs px-2.5 py-1 min-h-[32px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Segmented Pill View Mode Switcher */}
            <div className="bg-white/90 p-1 rounded-full border border-slate-200/80 shadow-sm flex items-center justify-center shrink-0 self-center w-full sm:w-auto">
              <button
                onClick={() => setViewMode('COMPONENT_VIEW')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] rounded-full text-xs font-medium active:scale-95 transition-all ${
                  viewMode === 'COMPONENT_VIEW'
                    ? 'bg-[#0F172A] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Components ({filteredComponents.length})</span>
              </button>
              <button
                onClick={() => setViewMode('BOARD_VIEW')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] rounded-full text-xs font-medium active:scale-95 transition-all ${
                  viewMode === 'BOARD_VIEW'
                    ? 'bg-[#0F172A] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Donor Boards ({filteredBoards.length})</span>
              </button>
            </div>
          </div>

          {/* Segmented Pill Filter Bars with Mobile Horizontal Momentum Swipe Strip */}
          <div className="space-y-2 pt-1">
            {/* Category Swipe Strip */}
            <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 px-0.5">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 min-h-[38px] rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#0F172A] text-white shadow-sm font-semibold'
                      : 'bg-white/80 border border-slate-200/80 text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Difficulty & Proximity Strip */}
            <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 px-0.5">
              {difficultyOptions.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedDifficulty(tier.id)}
                  className={`shrink-0 px-3.5 py-1.5 min-h-[38px] rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition-all ${
                    selectedDifficulty === tier.id
                      ? 'bg-[#0F172A] text-white shadow-sm font-semibold'
                      : 'bg-white/80 border border-slate-200/80 text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}

              <button
                onClick={() => setHyperlocalOnly((prev) => !prev)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-full text-xs font-medium whitespace-nowrap active:scale-95 transition-all ${
                  hyperlocalOnly
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-white/80 border border-slate-200/80 text-slate-600 hover:text-[#0F172A]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>&lt; 15 km Hyperlocal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* VIEW 1: COMPONENT MARKETPLACE BENTO GRID (3D SPATIAL TILT CARDS) */}
      {viewMode === 'COMPONENT_VIEW' ? (
        filteredComponents.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Cpu className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[#0F172A] font-display">
              {boards.length === 0
                ? 'No Donor Boards Listed Yet (0 Active Boards)'
                : 'No Harvestable Components Match Your Filter'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              {boards.length === 0
                ? 'The marketplace starts 100% clean with zero fake inventory. Use a 1-Click Auto-BoM Hardware Template or upload a PCB photo to list the first dead donor board.'
                : 'Try clearing your search query or toggling off the < 15 km hyperlocal filter to explore all listed donor boards.'}
            </p>
            <div className="pt-1">
              <button
                onClick={() => setActiveTab('SELLER_PORTAL')}
                className="px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  No donor boards listed yet — List the first dead PCB in 30
                  seconds →
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((comp) => {
              const parentBoard = boardMap.get(comp.donorBoardId);
              if (!parentBoard) return null;

              const isRawAvailable = parentBoard.status === 'AVAILABLE';
              const isSolderedOnly = parentBoard.hardwareMode === 'SOLDERED_RAW';
              const isReadyToUse = parentBoard.hardwareMode === 'READY_TO_USE';
              const effectiveExtractionFee = isReadyToUse ? 0 : comp.extractionFeeInr;
              const effectiveDistanceKm = computeEffectiveDistanceKm(
                parentBoard,
                userDistrict
              );

              return (
                <Card3D
                  key={comp.id}
                  onClick={() =>
                    setModalTarget({
                      board: parentBoard,
                      component: comp,
                      mode: isSolderedOnly
                        ? 'RAW_DONOR_BOARD'
                        : 'EXTRACTED_TESTED_PART',
                    })
                  }
                  className="group bg-white/95 backdrop-blur-2xl border border-slate-200/90 hover:border-emerald-400/70 rounded-3xl p-7 flex flex-col justify-between cursor-pointer shadow-[0_10px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                >
                  <div className="space-y-5">
                    {/* Clean Hardware Thumbnail Preview Header */}
                    <div className="relative h-32 rounded-2xl bg-gradient-to-br from-slate-50 via-slate-100/70 to-emerald-50/40 border border-slate-200/80 p-4 flex flex-col justify-between overflow-hidden">
                      {parentBoard.imageUrl ? (
                        <img
                          src={parentBoard.imageUrl}
                          alt={parentBoard.boardName}
                          className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity"
                        />
                      ) : (
                        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-emerald-400/15 blur-2xl group-hover:bg-emerald-400/25 transition-all" />
                      )}

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-sm">
                          {comp.packageType}
                        </span>
                        {renderDifficultyBadge(comp.difficulty)}
                      </div>

                      <div className="relative z-10 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
                            {comp.componentCategory}
                          </div>
                          <div className="font-mono text-lg font-bold text-[#0F172A] tracking-tight">
                            {comp.partNumber}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Inspect IC Pinout & Multimeter Probe Guide"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinoutTarget({
                                component: comp,
                                board: parentBoard,
                              });
                            }}
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[10px] font-medium flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>Pinout</span>
                          </button>
                          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-medium">
                            <Thermometer className="w-3 h-3" />
                            {comp.recommendedTempC}°C
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Component Title & Donor Board Context Pill */}
                    <div className="space-y-2.5">
                      <h3 className="text-base font-semibold text-[#0F172A] leading-snug font-display">
                        {comp.partName}
                      </h3>

                      {/* Donor Board Context Pill */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600 max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">
                          Inside:{' '}
                          <strong className="text-[#0F172A] font-medium">
                            {parentBoard.boardName}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {parentBoard.sellerDistrict
                              ? `${parentBoard.sellerDistrict}, ${
                                  parentBoard.sellerState || ''
                                }`
                              : parentBoard.locationArea}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-slate-700 font-medium shrink-0 ml-2">
                          {effectiveDistanceKm} km
                        </span>
                      </div>

                      {/* Seller & Verified Recycler Contact Block */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 truncate">
                            {parentBoard.sellerName}
                          </span>
                          {parentBoard.isVerified && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                        </div>

                        {/* Pro Unlocked Contact vs Masked */}
                        {currentUser.isProMember ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                            <span className="font-mono font-bold text-slate-800 text-[11px]">
                              📞 {parentBoard.sellerPhone || '+91 98401 23456'}
                            </span>
                            <a
                              href={`https://wa.me/91${(
                                parentBoard.sellerPhone || '9840123456'
                              )
                                .replace(/\D/g, '')
                                .slice(-10)}?text=Hi%20${encodeURIComponent(
                                parentBoard.sellerName
                              )},%20interested%20in%20${encodeURIComponent(
                                comp.partNumber
                              )}%20from%20SiliconHarvest`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <span className="font-mono text-slate-400 text-[11px]">
                              📞 +91 9840X XXXXX
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('MEMBERSHIP');
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg active:scale-95 transition-all"
                            >
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>Unlock (Pro ⭐)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bypass Hack Pill if applicable */}
                    {comp.bypassHackTip && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed text-amber-900">
                          <span className="font-semibold text-amber-700">
                            Bypass Hack:{' '}
                          </span>
                          <span className="line-clamp-2">
                            {comp.bypassHackTip}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dual-Action Pricing Buttons */}
                  <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-2.5">
                    {!isSolderedOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalTarget({
                            board: parentBoard,
                            component: comp,
                            mode: 'EXTRACTED_TESTED_PART',
                          });
                        }}
                        className="w-full min-h-[44px] py-3 px-4 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-between active:scale-95 transition-all shadow-sm"
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          {isReadyToUse ? 'Buy Ready-to-Use' : 'Buy Extracted'}
                        </span>
                        <span className="font-mono font-semibold text-emerald-300">
                          {isReadyToUse
                            ? `₹${comp.partPriceInr} (₹0 QC fee)`
                            : `₹${comp.partPriceInr} + ₹${effectiveExtractionFee} fee`}
                        </span>
                      </button>
                    )}

                    <button
                      disabled={!isRawAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTarget({
                          board: parentBoard,
                          component: comp,
                          mode: 'RAW_DONOR_BOARD',
                        });
                      }}
                      className={`w-full min-h-[44px] py-3 px-4 rounded-2xl text-xs flex items-center justify-between border transition-all ${
                        isRawAvailable
                          ? isSolderedOnly
                            ? 'bg-[#0F172A] hover:bg-slate-800 text-white border-slate-900 active:scale-95 font-semibold'
                            : 'bg-slate-100/80 hover:bg-slate-200/70 text-[#0F172A] border-slate-200/90 active:scale-95'
                          : 'bg-slate-50 text-slate-400 border-slate-200/50 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        {isRawAvailable ? (
                          <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        Buy Full Raw Board
                      </span>
                      <span className="font-mono font-medium">
                        {isRawAvailable
                          ? `₹${parentBoard.rawBoardPriceInr} (As-Is)`
                          : 'Partially Harvested'}
                      </span>
                    </button>

                    {!isSolderedOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCartItem(comp.id);
                        }}
                        className={`w-full min-h-[44px] py-2.5 px-4 rounded-2xl text-xs font-medium flex items-center justify-center gap-1.5 border active:scale-95 transition-all ${
                          bulkCartIds.includes(comp.id)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {bulkCartIds.includes(comp.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>In Bulk Cart (Click to Remove)</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                            <span>+ Add to Bulk Component Cart</span>
                          </>
                        )}
                      </button>
                    )}

                    {parentBoard.allowBargain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBargainTargetBoard(parentBoard);
                          setBargainTargetComponent(
                            isSolderedOnly ? null : comp
                          );
                          const basePrice = isSolderedOnly
                            ? parentBoard.rawBoardPriceInr
                            : comp.partPriceInr;
                          setBargainOfferAmount(
                            Math.max(10, Math.round(basePrice * 0.85))
                          );
                          setBargainNote(
                            `Inquiring about ${comp.partNumber} (${parentBoard.boardName})`
                          );
                        }}
                        className="w-full min-h-[40px] py-2 px-3 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          Bargain Price (₹
                          {isSolderedOnly
                            ? parentBoard.rawBoardPriceInr
                            : comp.partPriceInr}
                          )
                        </span>
                      </button>
                    )}
                  </div>
                </Card3D>
              );
            })}
          </div>
        )
      ) : filteredBoards.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-[#0F172A] font-display">
            {boards.length === 0
              ? 'No Donor Boards Listed Yet (0 Active Boards)'
              : 'No Donor Boards Match Your Filter'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {boards.length === 0
              ? 'Publish a fault-isolated dead PCB using the 1-Click Auto-BoM Templates or Gemini 2.5 Flash Vision Scanner.'
              : 'Try clearing your search filter to view all available donor boards.'}
          </p>
          <div className="pt-1">
            <button
              onClick={() => setActiveTab('SELLER_PORTAL')}
              className="px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                No donor boards listed yet — List the first dead PCB in 30
                seconds →
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: DONOR BOARD BENTO GRID (3D SPATIAL TILT CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredBoards.map((board) => {
            const childComps = components.filter(
              (c) => c.donorBoardId === board.id
            );
            const intactChildComps = childComps.filter(
              (c) => c.status === 'INTACT'
            );
            const hasBypassHack = childComps.some((c) => c.bypassHackTip);
            const isRawAvailable = board.status === 'AVAILABLE';
            const effectiveDistanceKm = computeEffectiveDistanceKm(
              board,
              userDistrict
            );

            return (
              <Card3D
                key={board.id}
                onClick={() =>
                  setModalTarget({
                    board,
                    component: intactChildComps[0] || null,
                    mode: isRawAvailable
                      ? 'RAW_DONOR_BOARD'
                      : 'EXTRACTED_TESTED_PART',
                  })
                }
                className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 hover:border-emerald-400/70 rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer shadow-[0_10px_35px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
              >
                <div className="space-y-4">
                  {board.imageUrl && (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200/80 mb-3 bg-slate-100">
                      <img
                        src={board.imageUrl}
                        alt={board.boardName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      <span className="absolute bottom-2.5 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono">
                        Verified Donor PCB Photo
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {board.id}
                        </span>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {board.category}
                        </span>
                        {hasBypassHack && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Bypass Hack
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-[#0F172A] mt-2 tracking-tight font-display">
                        {board.boardName}
                      </h3>
                    </div>

                    <span
                      className={`font-mono text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${
                        board.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : board.status === 'PARTIALLY_HARVESTED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {board.status}
                    </span>
                  </div>

                  {/* Primary Fault Box */}
                  <div className="px-4 py-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong className="font-semibold text-rose-950">
                        Isolated Fault:
                      </strong>{' '}
                      {board.primaryFault}
                    </span>
                  </div>

                  {/* Child Component Pills */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 font-medium">
                      Mapped Silicon Nodes ({intactChildComps.length} Intact /{' '}
                      {childComps.length} Total):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {childComps.map((c) => (
                        <span
                          key={c.id}
                          className={`font-mono text-xs px-2.5 py-1 rounded-full border ${
                            c.status === 'INTACT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'FAULTY_ON_ARRIVAL'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          {c.status === 'INTACT'
                            ? '🟢'
                            : c.status === 'FAULTY_ON_ARRIVAL'
                            ? '🔴'
                            : '⚫'}{' '}
                          {c.partNumber}
                          {c.status === 'INTACT' && ` • ₹${c.partPriceInr}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Seller & Verified Recycler Contact Block */}
                <div className="pt-2 border-t border-slate-100 space-y-2 mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {board.sellerName}
                    </span>
                    {board.isVerified && (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified Recycler
                      </span>
                    )}
                  </div>

                  {currentUser.isProMember ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        📞 {board.sellerPhone || '+91 98401 23456'}
                      </span>
                      <a
                        href={`https://wa.me/91${(
                          board.sellerPhone || '9840123456'
                        )
                          .replace(/\D/g, '')
                          .slice(-10)}?text=Hi%20${encodeURIComponent(
                          board.sellerName
                        )},%20interested%20in%20${encodeURIComponent(
                          board.boardName
                        )}%20from%20SiliconHarvest`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Direct WhatsApp</span>
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-mono text-slate-400 text-xs">
                        📞 +91 9840X XXXXX
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('MEMBERSHIP');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg active:scale-95 transition-all"
                      >
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Unlock WhatsApp (Pro ⭐)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Location + Dual CTA */}
                <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {board.sellerDistrict
                        ? `${board.sellerDistrict}, ${board.sellerState || ''}`
                        : board.locationArea}
                    </span>
                    <span className="font-mono text-slate-800 font-medium">
                      ({effectiveDistanceKm} km)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {board.allowBargain && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBargainTargetBoard(board);
                          setBargainTargetComponent(null);
                          setBargainOfferAmount(
                            Math.max(10, Math.round(board.rawBoardPriceInr * 0.85))
                          );
                          setBargainNote(
                            `Proposing bargain on ${board.boardName}`
                          );
                        }}
                        className="min-h-[44px] px-3.5 py-2 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Bargain</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTarget({
                          board,
                          component: intactChildComps[0] || null,
                          mode:
                            board.hardwareMode === 'SOLDERED_RAW'
                              ? 'RAW_DONOR_BOARD'
                              : 'EXTRACTED_TESTED_PART',
                        });
                      }}
                      className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Inspect PCB Map</span>
                    </button>

                    <button
                      disabled={!isRawAvailable}
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTarget({
                          board,
                          component: intactChildComps[0] || null,
                          mode: 'RAW_DONOR_BOARD',
                        });
                      }}
                      className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-full font-mono text-xs font-semibold active:scale-95 transition-all ${
                        isRawAvailable
                          ? 'bg-[#0F172A] hover:bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isRawAvailable
                        ? `Buy Raw ₹${board.rawBoardPriceInr}`
                        : board.status}
                    </button>
                  </div>
                </div>
              </Card3D>
            );
          })}
        </div>
      )}

      {/* Inspection & Checkout Modal */}
      {modalTarget && (
        <InspectionCheckoutModal
          board={modalTarget.board}
          initialComponent={modalTarget.component}
          initialMode={modalTarget.mode}
          onClose={() => setModalTarget(null)}
        />
      )}

      {/* Datasheet & Pinout Modal */}
      {pinoutTarget && (
        <DatasheetPinoutModal
          component={pinoutTarget.component}
          board={pinoutTarget.board}
          onClose={() => setPinoutTarget(null)}
          onBuyExtracted={() => {
            if (pinoutTarget.board) {
              setModalTarget({
                board: pinoutTarget.board,
                component: pinoutTarget.component,
                mode: 'EXTRACTED_TESTED_PART',
              });
            }
          }}
        />
      )}

      {/* Floating Bulk Salvage Cart Bar */}
      {bulkCartComponents.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl bg-[#0F172A] text-white rounded-3xl p-4 sm:px-6 shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              {bulkCartComponents.length}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold font-display">
                Bulk Salvage Cart ({bulkCartComponents.length} ICs from{' '}
                {new Set(bulkCartComponents.map((c) => c.donorBoardId)).size}{' '}
                Donor Boards)
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Parts: ₹{bulkCartSummary.totalPartsInr} + QC: ₹
                {bulkCartSummary.totalExtractionInr} + Fee: ₹
                {bulkCartSummary.unifiedCommissionInr} + Shipping: ₹
                {bulkCartSummary.bundledShippingInr}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setBulkCartIds([])}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowBulkCartModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-semibold text-xs transition-all"
            >
              Checkout Bulk Cart (₹{bulkCartSummary.grandTotalInr}) →
            </button>
          </div>
        </div>
      )}

      {/* Bulk Component Cart Checkout Modal */}
      {showBulkCartModal && bulkCartComponents.length > 0 && (() => {
        const distinctBoardsCount = new Set(
          bulkCartComponents.map((c) => c.donorBoardId)
        ).size;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-[#0F172A] font-display">
                    Bulk Component Cart Checkout ({bulkCartComponents.length}{' '}
                    Parts)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bundled across {distinctBoardsCount} Donor Motherboards •
                    Single-Source Escrow &amp; Bundled Shipping
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkCartModal(false)}
                  className="min-h-[44px] min-w-[44px] rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  {bulkCartComponents.map((c) => {
                    const b = boardMap.get(c.donorBoardId);
                    const effExt =
                      b?.hardwareMode === 'READY_TO_USE' ? 0 : c.extractionFeeInr;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#0F172A]">
                            {c.partNumber} — {c.partName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Origin: {b?.boardName} ({b?.sellerDistrict || 'Chennai'})
                          </div>
                        </div>
                        <div className="font-mono text-right">
                          <div className="font-semibold text-emerald-700">
                            ₹{c.partPriceInr} + ₹{effExt} fee
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Buyer Name
                    </label>
                    <input
                      type="text"
                      value={bulkBuyerName}
                      onChange={(e) => setBulkBuyerName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-xs text-[#0F172A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Destination District
                    </label>
                    <select
                      value={bulkBuyerDistrict}
                      onChange={(e) => setBulkBuyerDistrict(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-base sm:text-xs font-medium text-[#0F172A] focus:outline-none"
                    >
                      {(
                        INDIAN_STATES_DISTRICTS[0]?.districts || [
                          'Chennai',
                          'Madurai',
                          'Coimbatore',
                        ]
                      ).map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Combined Parts ({bulkCartComponents.length} ICs):
                    </span>
                    <span>₹{bulkCartSummary.totalPartsInr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Combined Hot-Air Extraction Escrow:
                    </span>
                    <span>₹{bulkCartSummary.totalExtractionInr}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      Unified Platform Fee (
                      {currentUser.isProMember ? 'Pro ⭐ ₹0 Free' : '5%'}):
                    </span>
                    <span>₹{bulkCartSummary.unifiedCommissionInr}</span>
                  </div>
                  <div className="flex justify-between text-sky-700">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {bulkCartSummary.bundledLogisticsLabel}:
                    </span>
                    <span>₹{bulkCartSummary.bundledShippingInr}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-[#0F172A]">
                    <span>Total Bundled Payable:</span>
                    <span className="text-emerald-700">
                      ₹{bulkCartSummary.grandTotalInr}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    bulkCartComponents.forEach((c, idx) => {
                      const b = boardMap.get(c.donorBoardId);
                      const effExt =
                        b?.hardwareMode === 'READY_TO_USE'
                          ? 0
                          : c.extractionFeeInr;
                      const itemComm =
                        idx === 0 ? bulkCartSummary.unifiedCommissionInr : 0;
                      const itemShip =
                        idx === 0 ? bulkCartSummary.bundledShippingInr : 0;
                      placeOrder({
                        buyerName: bulkBuyerName || 'Laptop Shop Owner',
                        buyerPhone: bulkBuyerPhone || '9840012345',
                        buyerAddress: bulkBuyerAddress || 'Ritchie Street',
                        buyerState: 'Tamil Nadu',
                        buyerDistrict: bulkBuyerDistrict,
                        buyerPincode: '600002',
                        donorBoardId: c.donorBoardId,
                        componentId: c.id,
                        mode: 'EXTRACTED_TESTED_PART',
                        deliveryType: bulkCartSummary.allSameDistrict
                          ? 'HYPERLOCAL_RAPIDO'
                          : 'OUTSTATION_PARCEL',
                        logisticsPartner: bulkCartSummary.bundledLogisticsLabel,
                        platformCommissionInr: itemComm,
                        deliveryFeeInr: itemShip,
                        totalPriceInr: c.partPriceInr + effExt + itemComm + itemShip,
                        upiUtrOrPaymentId: bulkUtr || '429104829104',
                      });
                    });
                    setBulkCartIds([]);
                    setShowBulkCartModal(false);
                    setActiveTab('ORDERS_TRACKER');
                  }}
                  className="w-full min-h-[48px] py-3 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs active:scale-95 transition-all"
                >
                  Confirm Bulk Cart Order (₹{bulkCartSummary.grandTotalInr}) →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Interactive Scoped Bargain & Counter-Offer Modal */}
      {bargainTargetBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <button
              type="button"
              onClick={() => {
                setBargainTargetBoard(null);
                setBargainTargetComponent(null);
                setBargainSuccessMsg(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Scoped Hardware Bargain Engine (
                {bargainTargetComponent ? 'Component Offer' : 'Full Board Offer'})
              </div>
              <h3 className="mt-2 text-xl font-black text-slate-900 font-display">
                Make an Offer / Propose Discount
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Negotiate directly with{' '}
                <strong>{bargainTargetBoard.sellerName}</strong> for{' '}
                <strong>
                  {bargainTargetComponent
                    ? `${bargainTargetComponent.partNumber} (${bargainTargetComponent.partName})`
                    : bargainTargetBoard.boardName}
                </strong>
                .
              </p>
            </div>

            {bargainSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold space-y-2">
                <p>{bargainSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBargainTargetBoard(null);
                    setBargainTargetComponent(null);
                    setBargainSuccessMsg(null);
                    setActiveTab('ORDERS_TRACKER');
                  }}
                  className="mt-2 w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  View in My Orders &amp; Bargains →
                </button>
              </div>
            ) : (
              <form onSubmit={handleBargainSubmit} className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Listed{' '}
                      {bargainTargetComponent ? 'Component' : 'Raw Board'} Price:
                    </span>
                    <span className="font-mono line-through text-slate-400">
                      ₹{bargainOriginalPrice}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">
                      Your Proposed Counter-Price:
                    </span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      ₹{bargainOfferAmount}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={bargainMinPrice}
                    max={bargainOriginalPrice}
                    step={1}
                    value={bargainOfferAmount}
                    onChange={(e) =>
                      setBargainOfferAmount(Number(e.target.value))
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Min: ₹{bargainMinPrice}</span>
                    <span className="text-emerald-700 font-bold">
                      Discount:{' '}
                      {Math.max(
                        0,
                        Math.round(
                          ((bargainOriginalPrice - bargainOfferAmount) /
                            bargainOriginalPrice) *
                            100
                        )
                      )}
                      % Off
                    </span>
                    <span>Max: ₹{bargainOriginalPrice}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Note for Seller (Optional):
                  </label>
                  <input
                    type="text"
                    value={bargainNote}
                    onChange={(e) => setBargainNote(e.target.value)}
                    placeholder="e.g. Student buying for final-year project, can pick up today"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {!currentUser.isProMember && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Tip: Pro Members get instant counter-offer notifications
                      and ₹0 convenience fee at checkout. You can still test
                      this offer!
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBargainTargetBoard(null);
                      setBargainTargetComponent(null);
                    }}
                    className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                  >
                    Submit Counter-Offer (₹{bargainOfferAmount})
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
