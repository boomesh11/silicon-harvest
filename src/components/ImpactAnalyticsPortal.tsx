import React, { useState, useMemo } from 'react';
import {
  Leaf,
  Cpu,
  Layers,
  Wallet,
  MapPin,
  Download,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Award,
  PlusCircle,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';

export const ImpactAnalyticsPortal: React.FC = () => {
  const {
    boards,
    components,
    orders,
    techWalletBalanceInr,
    techCompletedJobsCount,
    setActiveTab,
  } = useHarvestStore();

  const [reportDownloaded, setReportDownloaded] = useState(false);

  // 100% Dynamic ESG Metrics from actual live boards, components, and orders
  const intactCount = components.filter((c) => c.status === 'INTACT').length;
  const harvestedCount = components.filter(
    (c) => c.status === 'EXTRACTED_SOLD'
  ).length;

  const eWasteDivertedGrams = boards.length * 68 + harvestedCount * 14;
  const carbonSavedKg = Number(
    (boards.length * 2.1 + (harvestedCount + intactCount) * 0.42).toFixed(2)
  );

  const totalSalvageCatalogValueInr = components
    .filter((c) => c.status !== 'FAULTY_ON_ARRIVAL')
    .reduce((sum, c) => sum + c.partPriceInr, 0);
  const estimatedRetailEquivalentInr = Math.round(
    totalSalvageCatalogValueInr * 2.65
  );
  const studentSavingsInr =
    estimatedRetailEquivalentInr - totalSalvageCatalogValueInr;

  // Platform Escrow & Revenue Ledger (70% Tech Payout, 30% Hub Reserve, 10% Platform Commission)
  const completedExtractions = orders.filter(
    (o) =>
      o.mode === 'EXTRACTED_TESTED_PART' &&
      (o.status === 'READY_FOR_DISPATCH' || o.status === 'COMPLETED')
  );
  const hubReserve30PercentInr = Number(
    completedExtractions
      .reduce((sum, o) => sum + o.extractionFeeInr * 0.3, 0)
      .toFixed(2)
  );
  const totalPlatformCommission10PercentInr = Number(
    orders
      .reduce(
        (sum, o) =>
          sum +
          (o.platformCommissionInr ||
            Math.max(10, Math.round((o.itemPriceInr + o.extractionFeeInr) * 0.1))),
        0
      )
      .toFixed(2)
  );
  const totalPlatformRevenueInr = Number(
    (hubReserve30PercentInr + totalPlatformCommission10PercentInr).toFixed(2)
  );

  // Dynamically derive active hub locations from real listed donor boards
  const activeHubSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        locationArea: string;
        city: string;
        boardsCount: number;
        intactPartsCount: number;
        harvestedPartsCount: number;
        sellers: Set<string>;
      }
    >();

    boards.forEach((b) => {
      const key = b.locationArea.trim() || b.locationCity || 'Chennai';
      const existing = map.get(key) || {
        locationArea: b.locationArea,
        city: b.locationCity || 'Chennai',
        boardsCount: 0,
        intactPartsCount: 0,
        harvestedPartsCount: 0,
        sellers: new Set<string>(),
      };

      const boardComps = components.filter((c) => c.donorBoardId === b.id);
      existing.boardsCount += 1;
      existing.intactPartsCount += boardComps.filter(
        (c) => c.status === 'INTACT'
      ).length;
      existing.harvestedPartsCount += boardComps.filter(
        (c) => c.status === 'EXTRACTED_SOLD'
      ).length;
      if (b.sellerName) existing.sellers.add(b.sellerName);

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [boards, components]);

  const handleDownloadEsgReport = () => {
    const report = `====================================================================
SILICONHARVEST — ESG CIRCULAR ECONOMY & CAMPUS E-WASTE AUDIT REPORT
====================================================================
Generated At               : ${new Date().toLocaleString()}
Active Donor PCBs Mapped   : ${boards.length} Boards
Intact Harvestable ICs     : ${intactCount} Components
Extracted & Reused ICs     : ${harvestedCount} Components
Total Orders Processed     : ${orders.length} Orders
--------------------------------------------------------------------
ENVIRONMENTAL & CARBON TELEMETRY
E-Waste Diverted           : ${eWasteDivertedGrams} grams (${(
      eWasteDivertedGrams / 1000
    ).toFixed(2)} kg)
Embodied Carbon Avoided    : ${carbonSavedKg} kg CO2e (Wafer Fab + Logistics)
--------------------------------------------------------------------
MAKER ECONOMY & CAMPUS TECHNICIAN IMPACT
Total Salvage Catalog Value: Rs. ${totalSalvageCatalogValueInr}
Equivalent New Retail Cost : Rs. ${estimatedRetailEquivalentInr}
Net Student/Maker Savings  : Rs. ${studentSavingsInr}
Technician Escrow Payouts  : Rs. ${techWalletBalanceInr} (${techCompletedJobsCount} Verified Jobs)
====================================================================
`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SiliconHarvest_ESG_Circular_Audit_2026.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setReportDownloaded(true);
    setTimeout(() => setReportDownloaded(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              LIVE ESG CIRCULAR ECONOMY &amp; HUB TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Sustainability Impact, Student Savings &amp; Active Hub Network
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            100% live circular semiconductor metrics computed directly from
            listed donor boards, harvested components, and verified orders.
          </p>
        </div>

        <button
          onClick={handleDownloadEsgReport}
          className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shrink-0 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>
            {reportDownloaded
              ? 'ESG Audit Report Downloaded ✓'
              : 'Export ESG & E-Waste Audit Report'}
          </span>
        </button>
      </div>

      {/* 4 Key ESG & Economic KPI Cards (Computed Dynamically) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-7 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-700">
            <span>E-WASTE DIVERTED</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            {eWasteDivertedGrams}g
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Across{' '}
            <strong className="text-[#1D1D1F]">{boards.length} dead PCBs</strong>{' '}
            and{' '}
            <strong className="text-[#1D1D1F]">
              {harvestedCount} harvested ICs
            </strong>
            .
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-7 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-sky-700">
            <span>CARBON AVOIDED (CO₂e)</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            {carbonSavedKg} kg
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Embodied silicon wafer fab &amp; air-freight emissions prevented.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-7 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-amber-700">
            <span>STUDENT / LAB SAVINGS</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-emerald-700">
            ₹{studentSavingsInr}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Saved vs ₹{estimatedRetailEquivalentInr} new distributor retail
            across {intactCount + harvestedCount} cataloged parts.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-7 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-600">
            <span>TECH ESCROW EARNINGS</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-amber-700">
            ₹{techWalletBalanceInr}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            70% extraction fee paid across{' '}
            <strong className="text-[#1D1D1F]">
              {techCompletedJobsCount} multimeter-verified
            </strong>{' '}
            extractions.
          </p>
        </div>
      </div>

      {/* Platform Revenue & Escrow Split Ledger (70% Tech / 30% Hub / 10% Platform Fee) */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Platform Revenue &amp; Escrow Split Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time accounting of 70% technician payouts, 30% hub rework reserve, and 10% platform commission across {orders.length} orders.
            </p>
          </div>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            Net Platform Revenue: ₹{totalPlatformRevenueInr}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
              70% Technician Escrow Payouts
            </div>
            <div className="font-mono text-2xl font-bold text-amber-700">
              ₹{techWalletBalanceInr}
            </div>
            <div className="text-xs text-slate-500">
              Credited on multimeter QC completion ({techCompletedJobsCount} jobs)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
              30% Hub Rework &amp; Consumables Reserve
            </div>
            <div className="font-mono text-2xl font-bold text-sky-700">
              ₹{hubReserve30PercentInr}
            </div>
            <div className="text-xs text-slate-500">
              Retained from extraction fees for flux, solder wick &amp; ESD tubes
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
            <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
              10% Platform Escrow Commission
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-700">
              ₹{totalPlatformCommission10PercentInr}
            </div>
            <div className="text-xs text-slate-500">
              10% buyer protection &amp; escrow fee across {orders.length} orders
            </div>
          </div>
        </div>
      </div>

      {/* Live Hub Network Grid Derived from Listed Donor Boards */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Active Seller &amp; Extraction Locations (
              {activeHubSummaries.length} Live Nodes)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Populated dynamically from real donor boards listed on the
              platform.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className="text-xs font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Browse Live Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeHubSummaries.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-50/80 border border-slate-200/90 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-[#1D1D1F]">
              0 Active Hub Nodes — No Donor Boards Listed Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              As soon as a seller lists a dead PCB, its campus/hub location,
              intact component count, and circular e-waste savings appear here
              in real time.
            </p>
            <button
              onClick={() => setActiveTab('SELLER_PORTAL')}
              className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                No donor boards listed yet — List the first dead PCB in 30
                seconds →
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeHubSummaries.map((hub) => (
              <div
                key={hub.locationArea}
                className="p-6 rounded-3xl bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                        {hub.city}
                      </span>
                      <span className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● ACTIVE INVENTORY
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#1D1D1F] mt-2">
                      {hub.locationArea}
                    </h3>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-500 uppercase">
                      Listed PCBs
                    </div>
                    <div className="text-sm font-bold text-emerald-700">
                      {hub.boardsCount} Boards
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{hub.intactPartsCount} Intact ICs Available</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{hub.harvestedPartsCount} Parts Harvested</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                  <span className="truncate">
                    Seller(s):{' '}
                    <strong className="text-[#1D1D1F]">
                      {Array.from(hub.sellers).join(', ')}
                    </strong>
                  </span>
                  <button
                    onClick={() => setActiveTab('MARKETPLACE')}
                    className="font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>View Hub Parts</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
