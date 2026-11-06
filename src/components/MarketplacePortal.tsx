import React, { useState, useMemo } from 'react';
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
import { CATALOG_CATEGORIES, CatalogCategory } from '../data/catalogPricing';

export const MarketplacePortal: React.FC = () => {
  const { boards, components, setActiveTab } = useHarvestStore();

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

      if (hyperlocalOnly && parent.distanceKm >= 15) {
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
  ]);

  // Filtered boards for Donor Board View
  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      if (selectedCategory !== 'ALL' && board.category !== selectedCategory) {
        return false;
      }
      if (hyperlocalOnly && board.distanceKm >= 15) {
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
    { id: 'LEVEL_3_HOT_AIR_SMD', label: '🔴 Hot-Air SMD' },
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
      case 'LEVEL_3_HOT_AIR_SMD':
        return (
          <span className="font-mono text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            🔴 Hot-Air SMD
          </span>
        );
    }
  };

  return (
    <div className="space-y-12">
      {/* Apple Daylight Hero Section */}
      <section className="pt-8 pb-4 md:py-14 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-sm text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Certified Semiconductor Recovery • Multimeter Verified</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#1D1D1F] max-w-3xl mx-auto leading-[1.08]">
          Salvage Precision.{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-800 bg-clip-text text-transparent">
            Zero Waste.
          </span>
        </h1>

        <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          Harvest genuine, bench-tested integrated circuits from fault-isolated
          donor boards—or acquire complete raw PCBs for hardware jumper bypass
          hacks at a fraction of retail cost.
        </p>

        {/* Floating Frosted Glass Search & Filter Console */}
        <div className="max-w-4xl mx-auto pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IC part number (e.g. AMS1117-3.3, CH340G, ATMEGA328P), package (SOT-223, DIP-28), or donor board..."
                className="w-full pl-12 pr-20 py-3.5 rounded-full bg-white/90 backdrop-blur-2xl border border-slate-200 hover:border-slate-300 text-sm text-[#1D1D1F] placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Segmented Pill View Mode Switcher */}
            <div className="bg-white/90 p-1 rounded-full border border-slate-200/80 shadow-sm flex items-center shrink-0 self-center">
              <button
                onClick={() => setViewMode('COMPONENT_VIEW')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'COMPONENT_VIEW'
                    ? 'bg-[#1D1D1F] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Component View ({filteredComponents.length})</span>
              </button>
              <button
                onClick={() => setViewMode('BOARD_VIEW')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'BOARD_VIEW'
                    ? 'bg-[#1D1D1F] text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Donor Board View ({filteredBoards.length})</span>
              </button>
            </div>
          </div>

          {/* Segmented Pill Filter Bars */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {/* Category Pills */}
            <div className="bg-white/80 p-1 rounded-full border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-1">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#1D1D1F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#1D1D1F]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Difficulty & Proximity Pills */}
            <div className="bg-white/80 p-1 rounded-full border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-1">
              {difficultyOptions.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedDifficulty(tier.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDifficulty === tier.id
                      ? 'bg-[#1D1D1F] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#1D1D1F]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}

              <button
                onClick={() => setHyperlocalOnly((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  hyperlocalOnly
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>&lt; 15 km Hyperlocal</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* VIEW 1: COMPONENT MARKETPLACE BENTO GRID */}
      {viewMode === 'COMPONENT_VIEW' ? (
        filteredComponents.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-5 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Cpu className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
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
                className="px-6 py-3.5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm"
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

              return (
                <div
                  key={comp.id}
                  onClick={() =>
                    setModalTarget({
                      board: parentBoard,
                      component: comp,
                      mode: 'EXTRACTED_TESTED_PART',
                    })
                  }
                  className="group bg-white/90 backdrop-blur-2xl border border-slate-200/80 hover:border-slate-300 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300 rounded-3xl p-7 flex flex-col justify-between cursor-pointer shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]"
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
                          <div className="font-mono text-lg font-bold text-[#1D1D1F] tracking-tight">
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
                      <h3 className="text-base font-semibold text-[#1D1D1F] leading-snug">
                        {comp.partName}
                      </h3>

                      {/* Donor Board Context Pill */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600 max-w-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">
                          Inside:{' '}
                          <strong className="text-[#1D1D1F] font-medium">
                            {parentBoard.boardName}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {parentBoard.sellerDistrict
                              ? `${parentBoard.sellerDistrict}, ${parentBoard.sellerState || ''}`
                              : parentBoard.locationArea}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-slate-700 font-medium shrink-0 ml-2">
                          {parentBoard.distanceKm} km
                        </span>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTarget({
                          board: parentBoard,
                          component: comp,
                          mode: 'EXTRACTED_TESTED_PART',
                        });
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-between transition-all shadow-sm"
                    >
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        Buy Extracted
                      </span>
                      <span className="font-mono font-semibold text-emerald-300">
                        ₹{comp.partPriceInr} + ₹{comp.extractionFeeInr} fee
                      </span>
                    </button>

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
                      className={`w-full py-3 px-4 rounded-2xl text-xs flex items-center justify-between border transition-all ${
                        isRawAvailable
                          ? 'bg-slate-100/80 hover:bg-slate-200/70 text-[#1D1D1F] border-slate-200/90'
                          : 'bg-slate-50 text-slate-400 border-slate-200/50 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        {isRawAvailable ? (
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
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
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredBoards.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-16 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
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
              className="px-6 py-3.5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm"
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
        /* VIEW 2: DONOR BOARD BENTO GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBoards.map((board) => {
            const childComps = components.filter(
              (c) => c.donorBoardId === board.id
            );
            const intactChildComps = childComps.filter(
              (c) => c.status === 'INTACT'
            );
            const hasBypassHack = childComps.some((c) => c.bypassHackTip);
            const isRawAvailable = board.status === 'AVAILABLE';

            return (
              <div
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
                className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 hover:border-slate-300 hover:-translate-y-1 hover:scale-[1.01] rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-[0_8px_30px_rgba(15,23,42,0.05)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.09)]"
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
                      <h3 className="text-xl font-semibold text-[#1D1D1F] mt-2 tracking-tight">
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

                {/* Footer Location + Dual CTA */}
                <div className="mt-6 pt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {board.sellerDistrict
                        ? `${board.sellerDistrict}, ${board.sellerState || ''}`
                        : board.locationArea}
                    </span>
                    <span className="font-mono text-slate-800 font-medium">
                      ({board.distanceKm} km)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalTarget({
                          board,
                          component: intactChildComps[0] || null,
                          mode: 'EXTRACTED_TESTED_PART',
                        });
                      }}
                      className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all"
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
                      className={`px-4 py-2 rounded-full font-mono text-xs font-semibold transition-all ${
                        isRawAvailable
                          ? 'bg-[#1D1D1F] hover:bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isRawAvailable
                        ? `Buy Raw ₹${board.rawBoardPriceInr}`
                        : board.status}
                    </button>
                  </div>
                </div>
              </div>
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
    </div>
  );
};
