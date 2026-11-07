import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  ArrowRight,
  Package,
  Trash2,
  Sparkles,
  Phone,
  UserCheck,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import {
  CATALOG_CATEGORIES,
  CatalogCategory,
  INDIAN_STATES_DISTRICTS,
} from '../data/catalogPricing';
import { HardwareMode, DonorBoard, BoardCategory } from '../types/harvest';
import { Tilt3DCard } from './Tilt3DCard';

export const SellerPortal: React.FC = () => {
  const { publishDonorBoard, setActiveTab, currentUser } = useHarvestStore();

  // Step state (1: Category, 2: Details & Mode, 3: Photos, 4: Price & Publish)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory>(
    CATALOG_CATEGORIES[0]
  );
  const [boardName, setBoardName] = useState<string>('');
  const [primaryFault, setPrimaryFault] = useState<string>(
    'Salvage component / board tested intact'
  );
  const [hardwareMode, setHardwareMode] =
    useState<HardwareMode>('READY_TO_USE');
  const [allowBargain, setAllowBargain] = useState<boolean>(true);
  const [sellingPrice, setSellingPrice] = useState<number>(
    CATALOG_CATEGORIES[0].recommendedPrice
  );

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Location & Seller State
  const [sellerName, setSellerName] = useState<string>(
    currentUser.fullName || ''
  );
  const [sellerPhone, setSellerPhone] = useState<string>(
    currentUser.phone
      ? currentUser.phone.replace(/\D/g, '').slice(-10)
      : ''
  );
  const [state, setState] = useState<string>(currentUser.state || 'Tamil Nadu');
  const [district, setDistrict] = useState<string>(
    currentUser.district || 'Chennai'
  );
  const [locationArea, setLocationArea] = useState<string>(
    currentUser.defaultAddress || 'Guindy Industrial Estate'
  );
  const [pincode, setPincode] = useState<string>(
    currentUser.pincode || '600025'
  );

  const [publishedBoard, setPublishedBoard] = useState<DonorBoard | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When category changes, update default price and name
  const handleSelectCategory = (cat: CatalogCategory) => {
    setSelectedCategory(cat);
    setSellingPrice(cat.recommendedPrice);
    if (!boardName || selectedCategory.quickFillChips.includes(boardName)) {
      setBoardName(cat.quickFillChips[0] || '');
    }
  };

  // Sync user profile changes
  useEffect(() => {
    if (currentUser.fullName) {
      setSellerName(currentUser.fullName);
    }
    if (currentUser.phone) {
      setSellerPhone(currentUser.phone.replace(/\D/g, '').slice(-10));
    }
    if (currentUser.district) {
      setDistrict(currentUser.district);
    }
  }, [currentUser]);

  // Client-side HTML5 Canvas Photo Compression (zero API key)
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

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
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
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!boardName.trim()) {
      setErrorMsg('Please specify what product or spare part you are selling.');
      setCurrentStep(2);
      return;
    }

    if (
      sellingPrice < selectedCategory.minPrice ||
      sellingPrice > selectedCategory.maxPrice * 2
    ) {
      setErrorMsg(
        `Please specify a fair price between ₹${selectedCategory.minPrice} and ₹${
          selectedCategory.maxPrice * 2
        }.`
      );
      setCurrentStep(4);
      return;
    }

    const cleanDigits = sellerPhone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      setErrorMsg(
        'Please enter a valid 10-digit WhatsApp / Mobile Number so buyers can reach you.'
      );
      setCurrentStep(4);
      return;
    }

    const buyerActiveDistrict = (currentUser.district || 'Chennai')
      .toLowerCase()
      .trim();
    const isSameDistrictAsUser =
      district.toLowerCase().trim() === buyerActiveDistrict;

    const categoryFallbackImages: Record<string, string> = {
      IC_MICROCONTROLLERS: '/assets/3d/cat-ic.png',
      WASHING_MACHINE_APPLIANCE: '/assets/3d/cat-appliance.png',
      BATTERIES_POWER_CELLS: '/assets/3d/cat-battery.png',
      SMPS_POWER_INVERTERS: '/assets/3d/cat-smps.png',
      LAPTOP_MOBILE_MOTHERBOARDS: '/assets/3d/cat-laptop.png',
      MOTORS_ROBOTICS_CNC: '/assets/3d/cat-motor.png',
      AUDIO_TV_CONSUMER: '/assets/3d/hero-pcb.png',
    };

    const newBoard = publishDonorBoard({
      boardName: boardName.trim(),
      category: selectedCategory.id as BoardCategory,
      subModel: boardName.trim(),
      sellerName: sellerName.trim() || currentUser.fullName || 'Verified Seller',
      sellerPhone: `+91 ${cleanDigits}`,
      sellerState: state,
      sellerDistrict: district,
      sellerPincode: pincode,
      sellerFullAddress: `${locationArea}, ${district}`,
      locationArea: locationArea || 'Tech Salvage Yard',
      distanceKm: isSameDistrictAsUser ? 3.2 : 340.0,
      primaryFault: primaryFault.trim() || 'Tested functional spare',
      rawBoardPriceInr: sellingPrice,
      desolderedPriceInr:
        hardwareMode === 'SOLDERED_RAW'
          ? undefined
          : hardwareMode === 'READY_TO_USE'
          ? sellingPrice
          : sellingPrice + 25,
      hardwareMode,
      allowBargain,
      isVerified: true,
      imageUrl:
        imageUrl ||
        categoryFallbackImages[selectedCategory.id] ||
        '/assets/3d/hero-pcb.png',
    });

    setPublishedBoard(newBoard);
    setActiveTab('MARKETPLACE');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      {/* Hero Header */}
      <section className="bg-[#0F172A] px-4 py-8 sm:px-6 lg:px-8 text-white border-b border-slate-800 rounded-3xl mb-6">
        <div className="mx-auto max-w-4xl text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            30-Second Ultra-Simple Listing
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-display">
            Sell Electronics Spares &amp; E-Waste Donor Boards
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl">
            List individual ICs, appliance PCBs, battery cells, or complete
            scrap assemblies. Connect directly with buyers and technicians in
            your district.
          </p>

          {/* Step Progress Indicators */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {[
              { num: 1, label: '1. Category' },
              { num: 2, label: '2. Product' },
              { num: 3, label: '3. Photo' },
              { num: 4, label: '4. Fair Price' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num as 1 | 2 | 3 | 4)}
                className={`min-h-[44px] rounded-xl px-2 py-2 text-xs font-bold text-center transition-all ${
                  currentStep === step.num
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : currentStep > step.num
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-4xl px-1 sm:px-4">
        {publishedBoard ? (
          /* Success Screen */
          <div className="rounded-3xl border border-emerald-300 bg-white p-6 sm:p-8 shadow-xl text-center space-y-4 animate-fadeIn">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-display">
              Spares Published Successfully!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              <strong>{publishedBoard.boardName}</strong> is now live on the
              SiliconHarvest Marketplace at{' '}
              <strong>₹{publishedBoard.rawBoardPriceInr}</strong> in{' '}
              <strong>{publishedBoard.sellerDistrict}</strong> (Seller:{' '}
              {publishedBoard.sellerName} • {publishedBoard.sellerPhone}).
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPublishedBoard(null);
                  setBoardName('');
                  setImageUrl('');
                  setCurrentStep(1);
                }}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
              >
                + List Another Spare Part
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MARKETPLACE')}
                className="min-h-[44px] rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
              >
                View in Marketplace →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-6">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: CATEGORY SELECTION */}
            {currentStep === 1 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Step 1: Choose Hardware Category
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select the category that matches your component or donor
                    PCB.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATALOG_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory.id === cat.id;
                    return (
                      <Tilt3DCard
                        key={cat.id}
                        intensity={4}
                        onClick={() => handleSelectCategory(cat)}
                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cat.icon || <Package className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate font-display">
                              {cat.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {cat.description}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 font-mono">
                            Fair Range: ₹{cat.minPrice} – ₹{cat.maxPrice}
                          </div>
                        </div>
                      </Tilt3DCard>
                    );
                  })}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                    <span>Next: Product Details</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: WHAT ARE YOU SELLING? */}
            {currentStep === 2 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Step 2: What Are You Selling?
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter component name or click a quick-fill chip below.
                  </p>
                </div>

                {/* Quick-fill chips */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Popular Spares in {selectedCategory.name}:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategory.quickFillChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setBoardName(chip)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                          boardName === chip
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Name Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Product / Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="e.g. Arduino Uno R3, Front-load PCB, 18650 Battery Pack"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Hardware Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Hardware Supply Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div
                      onClick={() => setHardwareMode('READY_TO_USE')}
                      className={`cursor-pointer rounded-xl border-2 p-3 text-xs transition-all ${
                        hardwareMode === 'READY_TO_USE'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Ready-to-Use</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Desoldered, tested &amp; clean (₹0 QC fee)
                      </div>
                    </div>

                    <div
                      onClick={() => setHardwareMode('SOLDERED_RAW')}
                      className={`cursor-pointer rounded-xl border-2 p-3 text-xs transition-all ${
                        hardwareMode === 'SOLDERED_RAW'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Soldered on Board</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        As-is whole donor PCB only
                      </div>
                    </div>

                    <div
                      onClick={() => setHardwareMode('BOTH')}
                      className={`cursor-pointer rounded-xl border-2 p-3 text-xs transition-all ${
                        hardwareMode === 'BOTH'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">Both Available</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Raw or extraction (+QC fee)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Condition / Fault note */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Condition / Primary Fault Note
                  </label>
                  <input
                    type="text"
                    value={primaryFault}
                    onChange={(e) => setPrimaryFault(e.target.value)}
                    placeholder="e.g. Blown fuse, logic circuits tested 100% intact"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                    <span>Next: Photo Upload</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTO UPLOAD */}
            {currentStep === 3 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Step 3: Upload Product Photo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Native mobile camera or file dropzone. Compressed locally on
                    your browser.
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video max-h-72 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 active:scale-95 transition-all"
                        title="Remove photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      Photo compressed and verified for high-resolution listing.
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 sm:p-12 text-center bg-slate-50/60 hover:bg-emerald-50/20 transition-all space-y-3"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm text-emerald-600">
                      <Camera className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">
                        Tap to Take Photo or Upload Image
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        JPEG, PNG, WebP supported • Zero cloud upload delay
                      </p>
                    </div>
                    {isProcessingImage && (
                      <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                        Compressing photo...
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md"
                  >
                    <span>Next: Set Fair Price</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: FAIR PRICE RANGE SLIDER & SELLER CONTACT / LOCATION */}
            {currentStep === 4 && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Step 4: Fair Price, Seller Contact &amp; Publish
                  </h2>
                  <p className="text-xs text-slate-500">
                    Know what it&apos;s worth. Adjust the slider within the
                    circular-economy benchmark.
                  </p>
                </div>

                {/* Interactive Fair Price Range Slider */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Know What It&apos;s Worth
                      </span>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Benchmark for <strong>{selectedCategory.name}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600 font-mono">
                        ₹{sellingPrice}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Fixed Component Price
                      </span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={selectedCategory.minPrice}
                      max={selectedCategory.maxPrice}
                      step={5}
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Min: ₹{selectedCategory.minPrice}</span>
                      <span className="text-emerald-700 font-bold">
                        Recommended: ₹{selectedCategory.recommendedPrice}
                      </span>
                      <span>Max: ₹{selectedCategory.maxPrice}</span>
                    </div>
                  </div>

                  {/* Manual input fallback */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-600 font-medium">
                      Or type exact price:
                    </span>
                    <div className="relative w-32">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={selectedCategory.minPrice}
                        max={selectedCategory.maxPrice * 2}
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1 text-xs font-bold font-mono border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Allow Buyers to Bargain Checkbox */}
                <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowBargain}
                    onChange={(e) => setAllowBargain(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900 block">
                      🤝 Allow Pro Members to Bargain / Make Counter-Offers
                    </span>
                    <span className="text-slate-600 text-[11px] block mt-0.5">
                      Verified repair techs can propose a discount. You can
                      accept or decline counter-offers anytime in 1 click.
                    </span>
                  </div>
                </label>

                {/* Seller Identity & WhatsApp Contact */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Seller Identity &amp; Direct WhatsApp Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Seller / Lab / Shop Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="Enter your name or workshop name"
                        className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>10-Digit WhatsApp / Mobile Number *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={sellerPhone}
                        onChange={(e) =>
                          setSellerPhone(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="9840123456"
                        className="w-full min-h-[42px] px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Seller Location & District */}
                <div className="space-y-3 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Seller Location &amp; Logistics Hub
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        State *
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const nextState = e.target.value;
                          setState(nextState);
                          const firstDist =
                            INDIAN_STATES_DISTRICTS.find(
                              (s) => s.state === nextState
                            )?.districts[0] || 'Chennai';
                          setDistrict(firstDist);
                        }}
                        className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        {INDIAN_STATES_DISTRICTS.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        District *
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        {(
                          INDIAN_STATES_DISTRICTS.find((s) => s.state === state)
                            ?.districts || ['Chennai']
                        ).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Area / Workshop Landmark *
                      </label>
                      <input
                        type="text"
                        value={locationArea}
                        onChange={(e) => setLocationArea(e.target.value)}
                        placeholder="e.g. Guindy SIDCO, Gandhipuram"
                        className="w-full min-h-[42px] px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/25"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Publish Spares to Marketplace</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
