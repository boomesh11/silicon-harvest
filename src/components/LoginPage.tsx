import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Zap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Lock,
  User,
  MessageSquare,
  X,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { UserRole } from '../types/harvest';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';
import { GOOGLE_OAUTH_ENABLED } from '../services/harvestApi';

export const LoginPage: React.FC = () => {
  const {
    currentUser,
    signInWithEmail,
    signUpWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    quickGoogleSignIn,
    updateUserProfile,
    setActiveTab,
  } = useHarvestStore();

  const [mode, setMode] = useState<'SIGN_IN' | 'CREATE_ACCOUNT'>('SIGN_IN');

  // Sign-In state (supports Email OR 10-Digit Mobile Number)
  const [identifier, setIdentifier] = useState('');
  const [signInSecret, setSignInSecret] = useState('');
  const [signInFullName, setSignInFullName] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [otpSentForPhone, setOtpSentForPhone] = useState(false);
  const [smsToast, setSmsToast] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState<string | null>(
    null
  );

  // Google Quick Sign-In Sheet state (zero redirect trap)
  const [showGoogleSheet, setShowGoogleSheet] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  // Create Account (Onboarding) state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('BUYER_STUDENT');
  const [state, setState] = useState(currentUser.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(currentUser.district || 'Chennai');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [pincode, setPincode] = useState('600001');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!smsToast) return;
    const timer = setTimeout(() => setSmsToast(null), 15000);
    return () => clearTimeout(timer);
  }, [smsToast]);

  const availableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === state)?.districts || [
      'Chennai',
    ];

  const handleStateChange = (newState: string) => {
    setState(newState);
    const districtsForState =
      INDIAN_STATES_DISTRICTS.find((s) => s.state === newState)?.districts ||
      [];
    if (districtsForState.length > 0) {
      setDistrict(districtsForState[0]);
    }
  };

  // Detect whether identifier is a 10-digit mobile number or an email
  const cleanPhoneCandidate = identifier.replace(/\D/g, '');
  const isPhoneIdentifier =
    !identifier.includes('@') && cleanPhoneCandidate.length >= 10;

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (GOOGLE_OAUTH_ENABLED) {
      setLoading(true);
      const { error } = await signInWithGoogle();
      setLoading(false);
      if (!error) return;
      if (error !== 'GOOGLE_OAUTH_DISABLED') {
        setErrorMsg(error);
        return;
      }
    }
    setShowGoogleSheet(true);
  };

  const handleGoogleSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await quickGoogleSignIn(googleEmail, googleName);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    updateUserProfile({ state, district, pincode });
    setActiveTab('MARKETPLACE');
  };

  const handleSendOtpForSignIn = async () => {
    const digits10 = cleanPhoneCandidate.slice(-10);
    if (digits10.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { error, onScreenCode } = await sendPhoneOtp(digits10);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setOtpSentForPhone(true);
    if (onScreenCode) {
      setSignInSecret(onScreenCode);
      setSmsToast(onScreenCode);
      setSuccessMsg(`6-digit OTP generated for +91 ${digits10}`);
    } else {
      setSuccessMsg(`6-digit OTP sent to +91 ${digits10}`);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setForgotPasswordNotice(null);

    if (isPhoneIdentifier) {
      const digits10 = cleanPhoneCandidate.slice(-10);
      if (!otpSentForPhone) {
        await handleSendOtpForSignIn();
        return;
      }
      if (signInSecret.replace(/\D/g, '').length !== 6) {
        setErrorMsg('Please enter the 6-digit OTP verification code.');
        return;
      }
      setLoading(true);
      const { error } = await verifyPhoneOtp(
        digits10,
        signInSecret,
        signInFullName.trim() || `Customer ${digits10.slice(-4)}`
      );
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setSmsToast(null);
        setActiveTab('MARKETPLACE');
      }
      return;
    }

    // Email & Password sign-in
    if (!identifier.includes('@')) {
      setErrorMsg(
        'Please enter a valid Email Address or 10-digit Indian Mobile Number.'
      );
      return;
    }
    if (signInSecret.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signInWithEmail(identifier, signInSecret);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      setActiveTab('MARKETPLACE');
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    const { error } = await signUpWithEmail(
      email.trim(),
      password,
      fullName.trim(),
      role,
      '',
      cleanedPhone ? `+91 ${cleanedPhone}` : '',
      defaultAddress.trim() || `${district}, ${state}`,
      state,
      district,
      pincode.trim() || '600001'
    );
    setLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setActiveTab('MARKETPLACE');
    }
  };

  const handleForgotPassword = () => {
    setErrorMsg(null);
    if (identifier && identifier.includes('@')) {
      setForgotPasswordNotice(
        `Password recovery tip: You can also sign in immediately using your 10-digit Mobile Number (OTP) or click "Continue with Google" using ${identifier}.`
      );
    } else {
      setForgotPasswordNotice(
        'Enter your 10-digit Indian mobile number above to sign in with an instant 6-digit OTP code, or use "Continue with Google".'
      );
    }
  };

  const roleCards: {
    id: UserRole;
    emoji: string;
    label: string;
    desc: string;
  }[] = [
    {
      id: 'BUYER_STUDENT',
      emoji: '🛒',
      label: 'Buyer / Student',
      desc: 'Buy tested ICs & donor PCBs',
    },
    {
      id: 'SELLER_LAB',
      emoji: '📦',
      label: 'Hardware Seller / Donor',
      desc: 'List dead boards & scrap',
    },
    {
      id: 'TECH_PARTNER',
      emoji: '🔧',
      label: 'Verified Rework Tech',
      desc: 'Earn 70% hot-air extraction fees',
    },
  ];

  return (
    <div className="py-4 sm:py-8">
      {/* On-Screen SMS Notification Toast */}
      {smsToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-emerald-200 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  Instant OTP Verification • Now
                </span>
                <button
                  type="button"
                  onClick={() => setSmsToast(null)}
                  className="p-0.5 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#1D1D1F] mt-0.5 leading-relaxed">
                💬 SiliconHarvest Verification Code:{' '}
                <strong className="font-mono text-sm tracking-widest text-emerald-700">
                  {smsToast}
                </strong>{' '}
                (Auto-filled for instant verification)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Split-Screen Apple Daylight Card */}
      <div className="bg-white shadow-2xl rounded-3xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT / TOP BRAND SHOWCASE (VALUE PROP) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/30 p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Circuit Leaf Brand Logo */}
            <div className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  SiliconHarvest
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-medium">
                  Semiconductor Recovery Network
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3 pt-2">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.12]">
                Precision Electronic Salvage.{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Zero Waste.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                India&apos;s district-connected marketplace for bench-tested
                integrated circuits, fault-isolated donor PCBs, and hot-air
                rework technicians.
              </p>
            </div>

            {/* 3 Trust Badges */}
            <div className="space-y-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">⚡</span>
                <div>
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Same-District Rapido &amp; Dunzo Hyperlocal Delivery
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    45-minute bike parcel across your district (₹39) or flat ₹49
                    India Post Speed Post nationwide.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">🛡️</span>
                <div>
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Escrow Protection with Multimeter QC Verification
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Every desoldered IC is temperature-controlled and verified
                    for continuity &amp; voltage before payout.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">🌿</span>
                <div>
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Certified Circular E-Waste &amp; Green Impact Tracking
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Track diverted e-waste grams, embodied CO₂ savings, and
                    student hardware cost reductions in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Guest Preview Link */}
          <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Apple Daylight Production Release</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('MARKETPLACE')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Explore Store</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT / BOTTOM INTERACTIVE AUTH FORM */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Segmented Tab Switcher: [ Sign In ] vs [ Create Account ] */}
            <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setShowGoogleSheet(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'SIGN_IN'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('CREATE_ACCOUNT');
                  setShowGoogleSheet(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  mode === 'CREATE_ACCOUNT'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="flex items-center gap-2.5 p-3.5 text-xs bg-rose-50 text-rose-700 rounded-2xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 p-3.5 text-xs bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {forgotPasswordNotice && (
              <div className="p-3.5 text-xs bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 leading-relaxed">
                {forgotPasswordNotice}
              </div>
            )}

            {/* Google Quick Sign-In Sheet (Inside the Page, Zero Redirect Trap) */}
            {showGoogleSheet ? (
              <form
                onSubmit={handleGoogleSheetSubmit}
                className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/90"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleSheet(false);
                    setErrorMsg(null);
                  }}
                  className="min-h-[36px] flex items-center gap-1 text-xs text-slate-500 hover:text-[#1D1D1F] font-medium active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back to {mode === 'SIGN_IN' ? 'Sign In' : 'Create Account'}</span>
                </button>

                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">
                      Continue with Google Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instant verification without leaving SiliconHarvest
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Siddharth V."
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3 rounded-xl bg-[#1D1D1F] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
                >
                  <span>
                    {loading ? 'Signing in...' : 'Continue to Marketplace →'}
                  </span>
                </button>
              </form>
            ) : mode === 'SIGN_IN' ? (
              /* SIGN IN VIEW */
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading}
                  className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-[#1D1D1F] text-xs font-semibold shadow-xs active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 absolute font-medium">
                    Or Email / Mobile OTP
                  </span>
                </div>

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Email Address or 10-Digit Mobile Number
                    </label>
                    <div className="relative">
                      {isPhoneIdentifier ? (
                        <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      ) : (
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      )}
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setOtpSentForPhone(false);
                        }}
                        placeholder="student@annauniv.edu or 9840012345"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {isPhoneIdentifier && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Your Name (for Order &amp; Escrow Receipt)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={signInFullName}
                          onChange={(e) => setSignInFullName(e.target.value)}
                          placeholder="Karthik Raja"
                          className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-700">
                        {isPhoneIdentifier
                          ? '6-Digit Verification OTP'
                          : 'Secure Password / 6-Digit OTP'}
                      </label>
                      {isPhoneIdentifier && (
                        <button
                          type="button"
                          onClick={handleSendOtpForSignIn}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline min-h-[30px]"
                        >
                          {otpSentForPhone ? 'Resend OTP Code' : 'Send 6-Digit OTP'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={isPhoneIdentifier ? 'text' : 'password'}
                        required={!isPhoneIdentifier || otpSentForPhone}
                        value={signInSecret}
                        onChange={(e) => setSignInSecret(e.target.value)}
                        placeholder={
                          isPhoneIdentifier
                            ? 'Enter 6-digit OTP code'
                            : '••••••••'
                        }
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Keep me signed in & Forgot Password */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline min-h-[36px]"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>
                      {loading
                        ? 'Authenticating...'
                        : isPhoneIdentifier && !otpSentForPhone
                        ? 'Send Verification Code →'
                        : 'Continue to Marketplace →'}
                    </span>
                  </button>
                </form>
              </div>
            ) : (
              /* CREATE ACCOUNT (ONBOARDING) VIEW */
              <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Arun Swaminathan"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      10-Digit Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="9840012345"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="arun@domain.com"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Create Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Account Role Selector Cards */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {roleCards.map((card) => {
                      const selected = role === card.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setRole(card.id)}
                          className={`min-h-[64px] p-3 rounded-2xl border text-left active:scale-95 transition-all ${
                            selected
                              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/15'
                              : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="text-base">{card.emoji}</div>
                          <div className="text-xs font-semibold text-[#1D1D1F] mt-1">
                            {card.label}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {card.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location Setup: State & District Dropdowns */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      District Logistics Setup
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Unlocks ₹39 Rapido / ₹49 Speed Post
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        State
                      </label>
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {INDIAN_STATES_DISTRICTS.map((s) => (
                          <option key={s.state} value={s.state}>
                            {s.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        District
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {availableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={defaultAddress}
                        onChange={(e) => setDefaultAddress(e.target.value)}
                        placeholder="Campus / Lab / Shop Area (e.g. Guindy, Ritchie St)"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) =>
                          setPincode(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="600001"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Creating Your Account...'
                      : 'Create Account & Start Salvaging →'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

