import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Tag,
  Sliders,
  DollarSign,
  Package,
  Trash2,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import {
  CATALOG_CATEGORIES,
  CatalogCategory,
  INDIAN_STATES_DISTRICTS,
} from '../data/catalogPricing';
import {
  BoardCategory,
  BoardTemplateComponent,
  DonorBoard,
} from '../types/harvest';

interface SelectedComponentConfig {
  optionId: string;
  partNumber: string;
  partName: string;
  componentCategory: string;
  packageType: string;
  difficulty: 'LEVEL_1_PLUG_PULL' | 'LEVEL_2_BASIC_IRON' | 'LEVEL_3_HOT_AIR_SMD';
  recommendedTempC: number;
  extractionFeeInr: number;
  bypassHackTip?: string;
  statusMode: 'WORKING' | 'DAMAGED' | 'NOT_PRESENT';
  chosenPrice: number;
}

export const SellerPortal: React.FC = () => {
  const { publishDonorBoard, setActiveTab, currentUser } = useHarvestStore();

  // Category & Sub-Model
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>(
    CATALOG_CATEGORIES[0]
  );
  const [subModel, setSubModel] = useState<string>('');
  const [boardName, setBoardName] = useState<string>('');
  const [rawBoardPriceInr, setRawBoardPriceInr] = useState<number>(
    CATALOG_CATEGORIES[0].rawBoardPriceTiers[1].price
  );

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Sub-Components Configurator
  const [componentConfigs, setComponentConfigs] = useState<
    SelectedComponentConfig[]
  >([]);

  // Location & Contact
  const [sellerName, setSellerName] = useState<string>(
    currentUser.fullName || ''
  );
  const [sellerPhone, setSellerPhone] = useState<string>(
    currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : ''
  );
  const [state, setState] = useState<string>(
    currentUser.state || 'Tamil Nadu'
  );
  const [district, setDistrict] = useState<string>(
    currentUser.district || 'Chennai'
  );
  const [locationArea, setLocationArea] = useState<string>(
    currentUser.defaultAddress || ''
  );
  const [pincode, setPincode] = useState<string>(
    currentUser.pincode || '600001'
  );

  const [publishedBoard, setPublishedBoard] = useState<DonorBoard | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When selected category changes, reinitialize the component checklist
  useEffect(() => {
    setSubModel(selectedCategory.subModels[0] || '');
    setBoardName(`Salvage ${selectedCategory.subModels[0] || selectedCategory.shortName}`);
    setRawBoardPriceInr(selectedCategory.rawBoardPriceTiers[1]?.price || 50);

    const initialConfigs: SelectedComponentConfig[] = selectedCategory.subComponents.map(
      (sc) => ({
        optionId: sc.id,
        partNumber: sc.partNumber,
        partName: sc.partName,
        componentCategory: sc.componentCategory,
        packageType: sc.packageType,
        difficulty: sc.difficulty,
        recommendedTempC: sc.recommendedTempC,
        extractionFeeInr: sc.extractionFeeInr,
        bypassHackTip: sc.bypassHackTip,
        statusMode: 'WORKING',
        chosenPrice: sc.priceTiers[sc.defaultTierIndex] || sc.priceTiers[1],
      })
    );
    setComponentConfigs(initialConfigs);
    setPublishedBoard(null);
  }, [selectedCategory]);

  // Sync user profile changes
  useEffect(() => {
    if (currentUser.fullName && !sellerName) setSellerName(currentUser.fullName);
    if (currentUser.phone && !sellerPhone) {
      setSellerPhone(currentUser.phone.replace(/\D/g, '').slice(-10));
    }
    if (currentUser.district && district === 'Chennai') setDistrict(currentUser.district);
    if (currentUser.defaultAddress && !locationArea) setLocationArea(currentUser.defaultAddress);
  }, [currentUser]);

  const availableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === state)?.districts || [];

  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistricts =
      INDIAN_STATES_DISTRICTS.find((s) => s.state === newState)?.districts || [];
    if (newDistricts.length > 0) {
      setDistrict(newDistricts[0]);
    }
  };

  // Client-side HTML5 Canvas Photo Compression (0 API Keys required)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(compressedDataUrl);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setErrorMsg('Failed to process image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubModelSelect = (model: string) => {
    setSubModel(model);
    setBoardName(`Salvage ${model}`);
  };

  const updateComponentStatus = (
    optionId: string,
    statusMode: 'WORKING' | 'DAMAGED' | 'NOT_PRESENT'
  ) => {
    setComponentConfigs((prev) =>
      prev.map((c) => (c.optionId === optionId ? { ...c, statusMode } : c))
    );
  };

  const updateComponentPrice = (optionId: string, chosenPrice: number) => {
    setComponentConfigs((prev) =>
      prev.map((c) => (c.optionId === optionId ? { ...c, chosenPrice } : c))
    );
  };

  const handlePublishListing = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = sellerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit seller contact phone number.');
      return;
    }
    if (!sellerName.trim()) {
      setErrorMsg('Please enter the seller or lab donor name.');
      return;
    }
    if (!locationArea.trim()) {
      setErrorMsg('Please enter your area, college campus, or shop street address.');
      return;
    }

    // Filter active sub-components
    const activeComponents = componentConfigs.filter(
      (c) => c.statusMode !== 'NOT_PRESENT'
    );
    if (activeComponents.length === 0) {
      setErrorMsg('Please keep at least one sub-component in Working or Damaged status.');
      return;
    }

    const primaryFault =
      activeComponents.find((c) => c.statusMode === 'DAMAGED')?.partNumber ||
      'Power surge / Overvoltage fault';

    const componentsPayload: (BoardTemplateComponent & { isPrimaryFault: boolean })[] = activeComponents.map(
      (c) => ({
        partNumber: c.partNumber,
        partName: c.partName,
        componentCategory: c.componentCategory,
        packageType: c.packageType,
        difficulty: c.difficulty,
        recommendedTempC: c.recommendedTempC,
        partPriceInr: c.statusMode === 'WORKING' ? c.chosenPrice : 0,
        extractionFeeInr: c.extractionFeeInr,
        bypassHackTip: c.bypassHackTip,
        isPrimaryFault: c.statusMode === 'DAMAGED',
      })
    );

    try {
      const published = publishDonorBoard({
        boardName: boardName.trim() || `${subModel || selectedCategory.shortName}`,
        category: selectedCategory.id as BoardCategory,
        subModel: subModel || undefined,
        sellerName: sellerName.trim(),
        sellerPhone: `+91 ${cleanPhone}`,
        sellerState: state,
        sellerDistrict: district,
        sellerPincode: pincode.trim(),
        locationArea: locationArea.trim(),
        distanceKm: 2.5,
        primaryFault,
        rawBoardPriceInr,
        imageUrl: imageUrl || undefined,
        components: componentsPayload,
      });

      setPublishedBoard(published);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to publish listing.');
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Tag className="w-3.5 h-3.5" />
          <span>Consumer Hardware Salvage Listing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
          List Dead Circuit Boards & Salvage Parts
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Choose from standardized categories, toggle working components, and set fixed price tiers. Local buyers in {district} can order within 45 minutes!
        </p>
      </div>

      {publishedBoard ? (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-5 shadow-xl shadow-emerald-500/5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">
              Listing Published Successfully!
            </h2>
            <p className="text-sm text-slate-500 font-mono">
              Board ID: {publishedBoard.id} • {publishedBoard.boardName}
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Pickup District:</span>
              <span className="font-semibold text-slate-800">{publishedBoard.sellerDistrict}, {publishedBoard.sellerState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Full Soldered Price:</span>
              <span className="font-semibold font-mono text-emerald-700">₹{publishedBoard.rawBoardPriceInr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Harvestable Child Parts:</span>
              <span className="font-semibold text-slate-800">{publishedBoard.intactComponentsCount} available parts</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => setActiveTab('MARKETPLACE')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>View in Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setPublishedBoard(null);
                setImageUrl('');
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              List Another Board
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublishListing} className="space-y-8">
          {errorMsg && (
            <div className="flex items-center gap-2 p-4 text-xs bg-red-50 text-red-700 rounded-2xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY, MODEL & REAL PHOTO UPLOAD */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold font-mono">
                1
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Category, Hardware Identity & Photo
                </h3>
                <p className="text-xs text-slate-500">
                  Select what kind of hardware you are listing and take/upload a clear photo
                </p>
              </div>
            </div>

            {/* 8 Clean Guided Categories Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2.5">
                Select Main Category (8 Guided Options)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATALOG_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="block text-xs font-bold text-[#1D1D1F] truncate">
                        {cat.shortName}
                      </span>
                      <span className="block text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Model Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Specific Hardware / Sub-Model
                </label>
                <select
                  value={subModel}
                  onChange={(e) => handleSubModelSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {selectedCategory.subModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Listing Title
                </label>
                <input
                  type="text"
                  required
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Dead Arduino Uno R3 Board"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Native 100% Working Photo Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hardware Circuit Board Photo (Optional but Recommended)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {imageUrl ? (
                <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 max-h-64 flex items-center justify-center group">
                  <img
                    src={imageUrl}
                    alt="Uploaded Board Preview"
                    className="w-full h-64 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white text-[#1D1D1F] text-xs font-semibold rounded-xl shadow-md hover:bg-slate-100"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-2 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    {isProcessingImage ? (
                      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#1D1D1F] block">
                      Click to upload photo or take picture on mobile
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Fast client-side resize • PNG, JPG, WEBP (No API keys required)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: GUIDED SUB-COMPONENT CHECKLIST & FIXED PRICE TIERS */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold font-mono">
                2
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Sub-Component Checklist & Standardized Price Tiers
                </h3>
                <p className="text-xs text-slate-500">
                  Mark what is working vs. damaged, and select standard platform price tiers
                </p>
              </div>
            </div>

            {/* Standardized Full Soldered Price Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">
                    Full Soldered Assembly Price (Raw As-Is)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Price if a buyer buys the entire dead board without desoldering
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  ₹{rawBoardPriceInr}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {selectedCategory.rawBoardPriceTiers.map((tier) => (
                  <button
                    type="button"
                    key={tier.price}
                    onClick={() => setRawBoardPriceInr(tier.price)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                      rawBoardPriceInr === tier.price
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    ₹{tier.price} ({tier.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Components Checklist */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Sub-Components on This Board ({componentConfigs.length} Standard Components)
              </label>

              <div className="space-y-3">
                {componentConfigs.map((comp) => {
                  const originalOption = selectedCategory.subComponents.find(
                    (sc) => sc.id === comp.optionId
                  );
                  const priceTiers = originalOption?.priceTiers || [20, 30, 40];

                  return (
                    <div
                      key={comp.optionId}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        comp.statusMode === 'WORKING'
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : comp.statusMode === 'DAMAGED'
                          ? 'border-red-200 bg-red-50/20'
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1D1D1F]">
                              {comp.partNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({comp.packageType})
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 block mt-0.5">
                            {comp.partName}
                          </span>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateComponentStatus(comp.optionId, 'WORKING')
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              comp.statusMode === 'WORKING'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            🟢 Working
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateComponentStatus(comp.optionId, 'DAMAGED')
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              comp.statusMode === 'DAMAGED'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            🔴 Damaged
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateComponentStatus(comp.optionId, 'NOT_PRESENT')
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                              comp.statusMode === 'NOT_PRESENT'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            ⚪ None
                          </button>
                        </div>
                      </div>

                      {/* Desoldered Price Options (if working) */}
                      {comp.statusMode === 'WORKING' && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-500">
                            Select Extracted Component Price:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {priceTiers.map((tierPrice) => (
                              <button
                                type="button"
                                key={tierPrice}
                                onClick={() =>
                                  updateComponentPrice(comp.optionId, tierPrice)
                                }
                                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                                  comp.chosenPrice === tierPrice
                                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                ₹{tierPrice}
                              </button>
                            ))}
                            <span className="text-[10px] text-slate-400 font-mono pl-1">
                              (+ ₹{comp.extractionFeeInr} QC Fee)
                            </span>
                          </div>
                        </div>
                      )}

                      {comp.statusMode === 'DAMAGED' && (
                        <div className="text-[11px] text-red-600 font-medium">
                          ⚠️ Primary Fault — Marked as ₹0 so buyers know this part is fried.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: SELLER DISTRICT & PICKUP ADDRESS */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-7 h-7 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold font-mono">
                3
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">
                  Seller Pickup District & Address
                </h3>
                <p className="text-xs text-slate-500">
                  Enables instant bike courier pickups (Rapido / Dunzo / Porter) for buyers in your district
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Seller / Shop / Lab Name
                </label>
                <input
                  type="text"
                  required
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="e.g. Senthil Hardware & Electronics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Seller Contact Phone (10-Digits)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-mono text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840012345"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {INDIAN_STATES_DISTRICTS.map((s) => (
                    <option key={s.state} value={s.state}>
                      {s.state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  District (Crucial for Rapido & Dunzo Matching)
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street / Shop / Campus Address
                </label>
                <input
                  type="text"
                  required
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="Shop #12, Ritchie Street, Mount Road"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="600002"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero listing fees. 10% platform commission only upon successful order.</span>
              </div>
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all flex items-center gap-2"
              >
                <span>Publish to Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
