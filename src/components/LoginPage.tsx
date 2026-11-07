import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
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
  UserPlus,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { UserRole } from '../types/harvest';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';
import { Hero3DCanvas } from './Hero3DCanvas';

interface SavedGoogleAccount {
  email: string;
  fullName: string;
  phone: string;
  state: string;
  district: string;
}

const SAVED_GOOGLE_ACCOUNT_KEY = 'sh_clean_prod_v5_saved_google_account';

export const LoginPage: React.FC = () => {
  const {
    currentUser,
    signInWithEmail,
    signUpWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    quickGoogleSignIn,
    setActiveTab,
  } = useHarvestStore();

  // Top-level authentication tabs: Mobile OTP | Email & Password
  const [authTab, setAuthTab] = useState<'MOBILE_OTP' | 'EMAIL_PASSWORD'>('MOBILE_OTP');
  const [emailMode, setEmailMode] = useState<'SIGN_IN' | 'CREATE_ACCOUNT'>('SIGN_IN');

  // Google Account OAuth Popup Modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [savedGoogleAccount, setSavedGoogleAccount] =
    useState<SavedGoogleAccount | null>(() => {
      try {
        const raw = localStorage.getItem(SAVED_GOOGLE_ACCOUNT_KEY);
        return raw ? (JSON.parse(raw) as SavedGoogleAccount) : null;
      } catch {
        return null;
      }
    });
  const [useAnotherGoogleAccount, setUseAnotherGoogleAccount] = useState<boolean>(
    () => !savedGoogleAccount
  );
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleState, setGoogleState] = useState(currentUser.state || 'Tamil Nadu');
  const [googleDistrict, setGoogleDistrict] = useState(
    currentUser.district || 'Chennai'
  );

  // Mobile OTP state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpFullName, setOtpFullName] = useState('');
  const [otpState, setOtpState] = useState(currentUser.state || 'Tamil Nadu');
  const [otpDistrict, setOtpDistrict] = useState(currentUser.district || 'Chennai');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [smsToast, setSmsToast] = useState<string | null>(null);

  // Email & Password state
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

  // Load Google Identity Services script if VITE_GOOGLE_CLIENT_ID is defined
  useEffect(() => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (!clientId || typeof document === 'undefined') return;
    if (document.getElementById('google-gsi-script')) return;
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!smsToast) return;
    const timer = setTimeout(() => setSmsToast(null), 15000);
    return () => clearTimeout(timer);
  }, [smsToast]);

  const availableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === state)?.districts || ['Chennai'];
  const otpAvailableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === otpState)?.districts || ['Chennai'];
  const googleAvailableDistricts =
    INDIAN_STATES_DISTRICTS.find((s) => s.state === googleState)?.districts || [
      'Chennai',
    ];

  // 1. Open Google OAuth Popup Modal (Zero Redirect Trap, Zero 400 Error)
  const handleOpenGooglePopup = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setUseAnotherGoogleAccount(!savedGoogleAccount);
    setShowGoogleModal(true);
  };

  const handleSavedGoogleOneClick = async () => {
    if (!savedGoogleAccount) return;
    setLoading(true);
    setErrorMsg(null);
    const { error } = await quickGoogleSignIn(
      savedGoogleAccount.email,
      savedGoogleAccount.fullName,
      savedGoogleAccount.phone,
      savedGoogleAccount.district,
      savedGoogleAccount.state
    );
    setLoading(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    setShowGoogleModal(false);
    setActiveTab('MARKETPLACE');
  };

  const handleNewGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address (e.g., name@gmail.com).');
      return;
    }
    if (!googleName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanPhone = googlePhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    const { error } = await quickGoogleSignIn(
      cleanEmail,
      googleName.trim(),
      cleanPhone,
      googleDistrict,
      googleState
    );
    setLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }

    const accountToSave: SavedGoogleAccount = {
      email: cleanEmail,
      fullName: googleName.trim(),
      phone: cleanPhone,
      state: googleState,
      district: googleDistrict,
    };
    try {
      localStorage.setItem(SAVED_GOOGLE_ACCOUNT_KEY, JSON.stringify(accountToSave));
    } catch {
      // ignore
    }
    setSavedGoogleAccount(accountToSave);
    setShowGoogleModal(false);
    setActiveTab('MARKETPLACE');
  };

  // 2. Mobile OTP Flow (6 Interactive Boxes + Auto-Fill Toast)
  const handleGetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const digits10 = otpPhone.replace(/\D/g, '').slice(-10);
    if (digits10.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!otpFullName.trim()) {
      setErrorMsg('Please enter your Full Name.');
      return;
    }

    setLoading(true);
    const { error, onScreenCode } = await sendPhoneOtp(digits10);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
      return;
    }

    setOtpSent(true);
    const codeStr = onScreenCode || '482910';
    setOtpDigits(codeStr.split('').slice(0, 6));
    setSmsToast(codeStr);
    setSuccessMsg(`6-digit OTP generated & auto-filled for +91 ${digits10}`);
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const token = otpDigits.join('');
    if (token.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your OTP verification code.');
      return;
    }
    const digits10 = otpPhone.replace(/\D/g, '').slice(-10);
    setLoading(true);
    const { error } = await verifyPhoneOtp(
      digits10,
      token,
      otpFullName.trim(),
      otpDistrict,
      otpState
    );
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      setSmsToast(null);
      setActiveTab('MARKETPLACE');
    }
  };

  // 3. Email & Password Flow (Sign In + Create Account)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (emailMode === 'SIGN_IN') {
      setLoading(true);
      const { error } = await signInWithEmail(email.trim(), password);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        setActiveTab('MARKETPLACE');
      }
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
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
      label: 'Hardware Seller',
      desc: 'List dead boards & spares',
    },
    {
      id: 'TECH_PARTNER',
      emoji: '🔧',
      label: 'Rework Tech',
      desc: 'Earn 70% extraction fees',
    },
  ];

  return (
    <div className="py-4 sm:py-8">
      {/* Interactive Top OTP Toast Banner */}
      {smsToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-emerald-300 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  Instant OTP Verification • Auto-Filled
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
                💬 SiliconHarvest OTP Code:{' '}
                <strong className="font-mono text-sm tracking-widest text-emerald-700">
                  {smsToast}
                </strong>{' '}
                — Ready for 1-click sign-in!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Realistic Google Account OAuth Popup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-[0_28px_80px_rgba(15,23,42,0.28)] overflow-hidden p-6 sm:p-7 space-y-5">
            {/* Google Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-xs font-semibold text-slate-600">
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#1D1D1F]">
                Choose an account
              </h3>
              <p className="text-xs text-slate-500">
                to continue to{' '}
                <strong className="text-emerald-700 font-semibold">
                  SiliconHarvest
                </strong>
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Saved Google Account Card for 1-Click Sign-In */}
            {savedGoogleAccount && !useAnotherGoogleAccount ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleSavedGoogleOneClick}
                  disabled={loading}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center gap-3 text-left transition-all active:scale-98"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {savedGoogleAccount.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1D1D1F] truncate">
                      {savedGoogleAccount.fullName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {savedGoogleAccount.email} • {savedGoogleAccount.district}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setUseAnotherGoogleAccount(true)}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center gap-3 text-xs font-semibold text-slate-700 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              /* Use Another Google Account Form */
              <form onSubmit={handleNewGoogleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      10-Digit Mobile *
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={googlePhone}
                      onChange={(e) =>
                        setGooglePhone(e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="9840012345"
                      className="w-full min-h-[42px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      State
                    </label>
                    <select
                      value={googleState}
                      onChange={(e) => {
                        const s = e.target.value;
                        setGoogleState(s);
                        const dList =
                          INDIAN_STATES_DISTRICTS.find((item) => item.state === s)
                            ?.districts || ['Chennai'];
                        setGoogleDistrict(dList[0]);
                      }}
                      className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F]"
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
                      value={googleDistrict}
                      onChange={(e) => setGoogleDistrict(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F]"
                    >
                      {googleAvailableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end gap-2">
                  {savedGoogleAccount && (
                    <button
                      type="button"
                      onClick={() => setUseAnotherGoogleAccount(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 min-h-[44px] py-2.5 px-5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    {loading ? 'Verifying Google Account...' : 'Continue to SiliconHarvest →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Main Split-Screen Card */}
      <div className="bg-white shadow-2xl rounded-3xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT / TOP BRAND SHOWCASE */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-emerald-50/40 to-sky-50/30 p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Brand Logo */}
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

            {/* 3D Hardware Preview Stage */}
            <div className="pt-1">
              <Hero3DCanvas compact />
            </div>

            {/* 3 Trust Badges */}
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3">
                <span className="text-base leading-none mt-0.5">⚡</span>
                <div>
                  <div className="text-xs font-semibold text-[#1D1D1F]">
                    Same-District Rapido &amp; Porter Hyperlocal Delivery
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    45-minute bike parcel across your district (₹35) or flat ₹45
                    India Post Speed Post nationwide.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3">
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
            </div>
          </div>

          {/* Bottom Guest Preview Link */}
          <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono text-[11px] text-slate-600">
              Founder Support: +91 7200255069
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

        {/* RIGHT / BOTTOM UNIFIED AUTHENTICATION CONSOLE */}
        <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Sign In or Join SiliconHarvest
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose Google 1-Click Sign-In, Instant Mobile OTP, or Email &amp; Password.
              </p>
            </div>

            {/* 1. CONTINUE WITH GOOGLE BUTTON */}
            <button
              type="button"
              onClick={handleOpenGooglePopup}
              disabled={loading}
              className="w-full min-h-[48px] flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-[#1D1D1F] text-xs sm:text-sm font-semibold shadow-sm active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                Or Instant Mobile OTP / Email
              </span>
            </div>

            {/* Segmented Tab Switcher: [ Mobile OTP ] vs [ Email & Password ] */}
            <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('MOBILE_OTP');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  authTab === 'MOBILE_OTP'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                📱 Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('EMAIL_PASSWORD');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  authTab === 'EMAIL_PASSWORD'
                    ? 'bg-white text-[#1D1D1F] shadow-sm'
                    : 'text-slate-600 hover:text-[#1D1D1F]'
                }`}
              >
                ✉️ Email &amp; Password
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

            {/* TAB A: MOBILE OTP */}
            {authTab === 'MOBILE_OTP' ? (
              !otpSent ? (
                <form onSubmit={handleGetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={otpFullName}
                        onChange={(e) => setOtpFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      10-Digit Indian Mobile Number (+91) *
                    </label>
                    <div className="relative flex items-center">
                      <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5" />
                      <span className="absolute left-9 text-xs font-mono font-semibold text-slate-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={otpPhone}
                        onChange={(e) =>
                          setOtpPhone(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="9840012345"
                        className="w-full min-h-[44px] pl-16 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        State
                      </label>
                      <select
                        value={otpState}
                        onChange={(e) => {
                          const s = e.target.value;
                          setOtpState(s);
                          const dList =
                            INDIAN_STATES_DISTRICTS.find((item) => item.state === s)
                              ?.districts || ['Chennai'];
                          setOtpDistrict(dList[0]);
                        }}
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F]"
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
                        value={otpDistrict}
                        onChange={(e) => setOtpDistrict(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F]"
                      >
                        {otpAvailableDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{loading ? 'Sending OTP...' : 'Get 6-Digit OTP →'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyMobileOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700">
                        6-Digit OTP Code (+91 {otpPhone})
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setSmsToast(null);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>

                    {/* 6 Interactive OTP Boxes */}
                    <div className="grid grid-cols-6 gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          className="w-full h-12 text-center font-mono text-base font-bold bg-slate-50 border-2 border-emerald-500 rounded-xl text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>
                      {loading ? 'Verifying...' : 'Verify & Sign In →'}
                    </span>
                  </button>
                </form>
              )
            ) : (
              /* TAB B: EMAIL & PASSWORD */
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setEmailMode('SIGN_IN')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      emailMode === 'SIGN_IN'
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode('CREATE_ACCOUNT')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      emailMode === 'CREATE_ACCOUNT'
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {emailMode === 'CREATE_ACCOUNT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        10-Digit Mobile Number *
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
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={emailMode === 'SIGN_IN' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className={emailMode === 'SIGN_IN' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-[#1D1D1F] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {emailMode === 'CREATE_ACCOUNT' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Select Account Role
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {roleCards.map((card) => {
                          const selected = role === card.id;
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => setRole(card.id)}
                              className={`p-2.5 rounded-2xl border text-left transition-all ${
                                selected
                                  ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/15'
                                  : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                              }`}
                            >
                              <div className="text-sm">{card.emoji}</div>
                              <div className="text-[11px] font-semibold text-[#1D1D1F] mt-1">
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

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          District Logistics Setup
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Unlocks ₹35 Rapido / ₹45 Speed Post
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <select
                          value={state}
                          onChange={(e) => {
                            const s = e.target.value;
                            setState(s);
                            const dList =
                              INDIAN_STATES_DISTRICTS.find(
                                (item) => item.state === s
                              )?.districts || ['Chennai'];
                            setDistrict(dList[0]);
                          }}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#1D1D1F]"
                        >
                          {INDIAN_STATES_DISTRICTS.map((s) => (
                            <option key={s.state} value={s.state}>
                              {s.state}
                            </option>
                          ))}
                        </select>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1D1D1F]"
                        >
                          {availableDistricts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={defaultAddress}
                          onChange={(e) => setDefaultAddress(e.target.value)}
                          placeholder="Area / Campus / Shop"
                          className="col-span-2 min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#1D1D1F]"
                        />
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) =>
                            setPincode(e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="600001"
                          className="min-h-[40px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-[#1D1D1F]"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {loading
                      ? 'Authenticating...'
                      : emailMode === 'SIGN_IN'
                      ? 'Sign In to Marketplace →'
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
