import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  Upload,
  KeyRound,
  ScanLine,
  AlertCircle,
} from 'lucide-react';
import { BOARD_TEMPLATES } from '../data/seedData';
import { useHarvestStore } from '../store/useHarvestStore';
import {
  BoardCategory,
  BoardTemplateComponent,
  DonorBoard,
} from '../types/harvest';
import {
  scanPcbPhotoForBom,
  getGeminiApiKey,
  saveRuntimeGeminiApiKey,
  AiScannedPcbResult,
} from '../services/geminiPcbScanner';

export const SellerPortal: React.FC = () => {
  const { publishDonorBoard, setActiveTab, currentUser } = useHarvestStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    BOARD_TEMPLATES[0].id
  );
  const [boardName, setBoardName] = useState<string>(
    BOARD_TEMPLATES[0].boardName
  );
  const [category, setCategory] = useState<BoardCategory>(
    BOARD_TEMPLATES[0].category
  );
  const [sellerName, setSellerName] = useState<string>(
    currentUser.fullName || ''
  );
  const [locationArea, setLocationArea] = useState<string>(
    currentUser.defaultAddress || ''
  );
  const [distanceKm, setDistanceKm] = useState<number>(2.8);
  const [rawBoardPriceInr, setRawBoardPriceInr] = useState<number>(
    BOARD_TEMPLATES[0].defaultRawPriceInr
  );

  useEffect(() => {
    if (currentUser.fullName && !sellerName) {
      setSellerName(currentUser.fullName);
    }
    if (currentUser.defaultAddress && !locationArea) {
      setLocationArea(currentUser.defaultAddress);
    }
  }, [currentUser.fullName, currentUser.defaultAddress, sellerName, locationArea]);

  const [bomItems, setBomItems] = useState<
    (BoardTemplateComponent & { isPrimaryFault: boolean })[]
  >(() =>
    BOARD_TEMPLATES[0].components.map((c) => ({
      ...c,
      isPrimaryFault:
        c.partNumber === BOARD_TEMPLATES[0].defaultPrimaryFaultPartNumber,
    }))
  );

  // Live Gemini 2.5 Flash Vision PCB Photo Scanner State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    null
  );
  const [lastAiScanResult, setLastAiScanResult] =
    useState<AiScannedPcbResult | null>(null);
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [showGeminiKeyInput, setShowGeminiKeyInput] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() => getGeminiApiKey());

  const [publishedBoard, setPublishedBoard] = useState<DonorBoard | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    const tpl = BOARD_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    setBoardName(tpl.boardName);
    setCategory(tpl.category);
    setRawBoardPriceInr(tpl.defaultRawPriceInr);
    setBomItems(
      tpl.components.map((c) => ({
        ...c,
        isPrimaryFault: c.partNumber === tpl.defaultPrimaryFaultPartNumber,
      }))
    );
    setPublishedBoard(null);
    setAiScanError(null);
  };

  const applyAiScanToForm = (res: AiScannedPcbResult) => {
    setLastAiScanResult(res);
    setAiScanError(null);
    setSelectedTemplateId('AI_CUSTOM_SCAN');
    setBoardName(res.boardName);
    setCategory(res.category);
    setRawBoardPriceInr(res.defaultRawPriceInr);
    setBomItems(res.components);
    setPublishedBoard(null);
  };

  const handleFileUpload = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setUploadedPreviewUrl(objectUrl);
    setIsScanningPhoto(true);
    setAiScanError(null);
    try {
      const scanRes = await scanPcbPhotoForBom(file);
      applyAiScanToForm(scanRes);
    } catch (err: any) {
      setAiScanError(
        err?.message ||
          'Failed to scan PCB photo with Gemini 2.5 Flash Vision.'
      );
      if (!getGeminiApiKey()) {
        setShowGeminiKeyInput(true);
      }
    } finally {
      setIsScanningPhoto(false);
    }
  };

  const handleSetPrimaryFault = (index: number) => {
    setBomItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        isPrimaryFault: idx === index,
      }))
    );
  };

  const handlePartPriceChange = (index: number, newPrice: number) => {
    setBomItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, partPriceInr: Math.max(0, newPrice) } : item
      )
    );
  };

  const faultyComponent = bomItems.find((i) => i.isPrimaryFault) || bomItems[0];
  const primaryFaultSummary = faultyComponent
    ? `${faultyComponent.partNumber} (${faultyComponent.partName}) blown/shorted`
    : 'Primary power rail fault';

  const totalIntactPartsValue = bomItems
    .filter((i) => !i.isPrimaryFault)
    .reduce((sum, i) => sum + i.partPriceInr, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = publishDonorBoard({
      boardName: boardName.trim(),
      category,
      sellerName: sellerName.trim(),
      locationArea: locationArea.trim(),
      distanceKm,
      primaryFault: primaryFaultSummary,
      rawBoardPriceInr,
      components: bomItems,
    });
    setPublishedBoard(created);
  };

  const presetLocations = [
    { label: 'Guindy / Anna Univ Campus, Chennai', dist: 2.4 },
    { label: 'Ritchie Street Hub, Chennai', dist: 8.1 },
    { label: 'IITM Research Park, Taramani, Chennai', dist: 4.9 },
    { label: 'SP Road, Bengaluru', dist: 342.0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              SELLER AUTO-BoM &amp; GEMINI 2.5 FLASH VISION
            </span>
            <span className="font-mono text-xs text-slate-500">
              • Hardware Reference Templates + Live Photo Scanner
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            List Dead Hardware &amp; Auto-Generate Component BoM
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Upload a real circuit board photo for Gemini 2.5 Flash Vision
            detection, or select a 1-Click Hardware Reference Template below,
            mark the{' '}
            <span className="text-rose-600 font-mono font-medium">
              🔴 Primary Fault
            </span>
            , and publish all{' '}
            <span className="text-emerald-700 font-mono font-medium">
              🟢 Intact
            </span>{' '}
            ICs.
          </p>
        </div>

        {/* Recovery Value Comparison Pill */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-5 py-4 flex items-center gap-5 shrink-0 font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">
              Scrap Weight Value
            </div>
            <div className="text-sm font-bold text-rose-600 line-through">
              ₹10 / PCB
            </div>
          </div>
          <div className="text-slate-400">→</div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">
              Raw Board Ask
            </div>
            <div className="text-sm font-bold text-amber-700">
              ₹{rawBoardPriceInr}
            </div>
          </div>
          <div className="text-slate-400">→</div>
          <div>
            <div className="text-[10px] text-emerald-700 uppercase font-semibold">
              Child IC Yield
            </div>
            <div className="text-base font-bold text-emerald-700">
              ₹{totalIntactPartsValue}
            </div>
          </div>
        </div>
      </div>

      {/* Published Confirmation Banner */}
      {publishedBoard && (
        <div className="bg-emerald-50/90 backdrop-blur-2xl border border-emerald-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Published Live to SiliconHarvest Marketplace! (
                {publishedBoard.id})
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong className="text-[#1D1D1F]">
                  {publishedBoard.boardName}
                </strong>{' '}
                is now live with{' '}
                <span className="font-mono text-emerald-700 font-semibold">
                  {bomItems.filter((i) => !i.isPrimaryFault).length} intact
                  child components
                </span>{' '}
                and primary fault marked as{' '}
                <span className="font-mono text-rose-700 font-semibold">
                  {publishedBoard.primaryFault}
                </span>
                .
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('MARKETPLACE')}
            className="px-5 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shrink-0 transition-all"
          >
            <span>View in Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form Grid */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Column: AI PCB Photo Auto-Scanner + Step 1 Template Selector + Step 2 Fault Picker */}
        <div className="lg:col-span-7 space-y-6">
          {/* LIVE GEMINI 2.5 FLASH VISION PCB PHOTO AUTO-SCANNER DROPZONE */}
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold">
                  Upload Real PCB Photo for Auto-BoM Scan (Gemini 2.5 Flash
                  Vision)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGeminiKeyInput((prev) => !prev)}
                className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all"
              >
                <KeyRound className="w-3 h-3 text-amber-600" />
                <span>
                  {geminiKey
                    ? 'Gemini API Key Active ✓'
                    : 'Configure Gemini API Key'}
                </span>
              </button>
            </div>

            {showGeminiKeyInput && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    saveRuntimeGeminiApiKey(e.target.value);
                    if (e.target.value.trim().startsWith('AIza')) {
                      setAiScanError(null);
                    }
                  }}
                  placeholder="Paste VITE_GEMINI_API_KEY (AIzaSy...) for live Gemini 2.5 Flash Vision"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="font-mono text-[10px] text-slate-500">
                  Saved
                </span>
              </div>
            )}

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 rounded-3xl p-6 text-center cursor-pointer transition-all space-y-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {isScanningPhoto ? (
                <div className="py-4 space-y-2">
                  <ScanLine className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                  <div className="font-mono text-xs text-emerald-700 font-bold">
                    CALLING GEMINI 2.5 FLASH VISION API...
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Inspecting PCB silkscreen, SMD footprints &amp; package
                    markings
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-sm font-medium text-[#1D1D1F]">
                    Drop a circuit board photo here or{' '}
                    <span className="text-emerald-600 underline font-semibold">
                      click to upload image
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Supports JPG, PNG, WebP • Requires{' '}
                    <code className="font-mono text-[#1D1D1F]">
                      VITE_GEMINI_API_KEY
                    </code>
                  </p>
                </>
              )}
            </div>

            {aiScanError && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{aiScanError}</span>
              </div>
            )}

            {/* AI Scan Telemetry Result Box */}
            {lastAiScanResult && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3.5 text-xs">
                {uploadedPreviewUrl && (
                  <img
                    src={uploadedPreviewUrl}
                    alt="Scanned PCB"
                    className="w-16 h-16 object-cover rounded-xl border border-emerald-300 shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                      {lastAiScanResult.scanEngine} •{' '}
                      {lastAiScanResult.confidencePercent}% CONFIDENCE
                    </span>
                    <span className="text-[#1D1D1F] font-bold">
                      {lastAiScanResult.components.length} Packages Populated
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {lastAiScanResult.diagnosticSummary}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Template Selector */}
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
              Step 1 • Or Pick a 1-Click Hardware Reference Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BOARD_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Cpu
                      className={`w-4 h-4 mb-2 ${
                        isSelected ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-xs font-semibold text-[#1D1D1F]">
                      {tpl.templateName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 mt-1">
                      {tpl.components.length} Child Parts • ₹
                      {tpl.defaultRawPriceInr}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Child BoM & Primary Fault Selector */}
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                  Step 2 • Click Which Component Is the Primary Fault
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Click any component row to toggle it as the{' '}
                  <span className="text-rose-600 font-semibold">
                    🔴 Primary Fault (Dead)
                  </span>
                  . All other components remain{' '}
                  <span className="text-emerald-700 font-semibold">
                    🟢 Intact (Harvestable)
                  </span>
                  .
                </p>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                {bomItems.filter((i) => !i.isPrimaryFault).length} Intact / 1
                Fault
              </span>
            </div>

            <div className="space-y-3">
              {bomItems.map((item, idx) => {
                const isFault = item.isPrimaryFault;
                return (
                  <div
                    key={item.partNumber + idx}
                    onClick={() => handleSetPrimaryFault(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                      isFault
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                        : 'bg-slate-50/60 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isFault
                              ? 'bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isFault
                            ? '🔴 PRIMARY FAULT'
                            : '🟢 INTACT & HARVESTABLE'}
                        </span>
                        <span className="font-mono text-sm font-bold text-[#1D1D1F]">
                          {item.partNumber}
                        </span>
                        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                          {item.packageType} • {item.recommendedTempC}°C
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{item.partName}</p>
                      {item.bypassHackTip && !isFault && (
                        <p className="text-[11px] text-amber-800 font-mono flex items-center gap-1 pt-0.5">
                          <Sparkles className="w-3 h-3 shrink-0 text-amber-600" />
                          Auto-Attached Bypass Hack: {item.bypassHackTip}
                        </p>
                      )}
                    </div>

                    {/* Part Price Editor */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 shrink-0"
                    >
                      {isFault ? (
                        <span className="font-mono text-xs text-rose-700 font-semibold px-3 py-1 rounded-full bg-rose-100 border border-rose-200">
                          ₹0 (Blown IC)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                          <span className="text-[11px] font-mono text-slate-500">
                            Part ₹
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={item.partPriceInr}
                            onChange={(e) =>
                              handlePartPriceChange(idx, Number(e.target.value))
                            }
                            className="w-14 bg-transparent font-mono text-xs font-bold text-emerald-700 focus:outline-none"
                          />
                          <span className="text-[10px] font-mono text-amber-700">
                            (+₹{item.extractionFeeInr} fee)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Step 3 Board Metadata, Pricing, Location & Publish */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl p-8 space-y-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
              Step 3 • Board Pricing &amp; Hyperlocal Hub Coordinates
            </label>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">
                  Donor Board Listing Title *
                </label>
                <input
                  type="text"
                  required
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">
                    Board Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as BoardCategory)
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ACADEMIC_MAKER">ACADEMIC_MAKER</option>
                    <option value="POWER_SMPS">POWER_SMPS</option>
                    <option value="APPLIANCE_PCB">APPLIANCE_PCB</option>
                    <option value="LAPTOP_MOBILE">LAPTOP_MOBILE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1.5">
                    Full Raw Board Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={rawBoardPriceInr}
                    onChange={(e) =>
                      setRawBoardPriceInr(Number(e.target.value))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">
                  Seller / Lab Name *
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Enter your Name, Lab, or Repair Shop"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">
                  Campus / Hub Location Area *
                </label>
                <input
                  type="text"
                  required
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="Enter Campus, Street, and City"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {/* Quick Location Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {presetLocations.map((loc) => (
                    <button
                      type="button"
                      key={loc.label}
                      onClick={() => {
                        setLocationArea(loc.label);
                        setDistanceKm(loc.dist);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                    >
                      <MapPin className="w-2.5 h-2.5 inline mr-1 text-emerald-600" />
                      {loc.label.split(',')[0]} ({loc.dist}km)
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1.5">
                  Distance from Buyer Hub (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0.5}
                  required
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Diagnostic Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Auto-Tagged Primary Fault:
                  </span>
                  <span className="font-mono text-rose-700 font-semibold">
                    {faultyComponent?.partNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Intact Child Components:
                  </span>
                  <span className="font-mono text-emerald-700 font-semibold">
                    {bomItems.filter((i) => !i.isPrimaryFault).length} Parts
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Individual Harvest Sum:
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">
                    ₹{totalIntactPartsValue}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Donor Board &amp; Child BoM Immediately</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
