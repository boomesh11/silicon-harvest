import React, { useState } from 'react';
import {
  X,
  Mail,
  LogOut,
  AlertCircle,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { UserRole } from '../types/harvest';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const {
    currentUser,
    updateUserProfile,
    signInWithEmail,
    signUpWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    signInWithGoogle,
    signOut,
  } = useHarvestStore();

  const [activeTab, setActiveTab] = useState<'GOOGLE_PHONE' | 'EMAIL' | 'PROFILE'>('GOOGLE_PHONE');
  const [emailMode, setEmailMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');

  // Phone OTP state
  const [phone, setPhone] = useState(currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Email / Password state
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [role, setRole] = useState<UserRole>(currentUser.role || 'BUYER_STUDENT');

  // Profile Details state
  const [state, setState] = useState(currentUser.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(currentUser.district || 'Chennai');
  const [defaultAddress, setDefaultAddress] = useState(currentUser.defaultAddress || '');
  const [pincode, setPincode] = useState(currentUser.pincode || '600001');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) setErrorMsg(error);
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { error } = await sendPhoneOtp(cleanDigits);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      setOtpSent(true);
      setSuccessMsg(`6-digit verification code sent to +91 ${cleanDigits}`);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      setErrorMsg('Please enter the verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const { error } = await verifyPhoneOtp(cleanDigits, otpCode);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      onClose();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (emailMode === 'SIGN_IN') {
      const { error } = await signInWithEmail(email, password);
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        onClose();
      }
    } else {
      if (!fullName.trim()) {
        setLoading(false);
        setErrorMsg('Please enter your full name.');
        return;
      }
      const { error } = await signUpWithEmail(
        email,
        password,
        fullName,
        role,
        '',
        phone,
        defaultAddress,
        state,
        district,
        pincode
      );
      setLoading(false);
      if (error) {
        setErrorMsg(error);
      } else {
        onClose();
      }
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    updateUserProfile({
      fullName: fullName.trim() || currentUser.fullName || 'Customer',
      phone: cleanedPhone ? `+91 ${cleanedPhone}` : currentUser.phone,
      email: email.trim() || currentUser.email,
      role,
      state,
      district,
      pincode: pincode.trim(),
      defaultAddress: defaultAddress.trim(),
    });
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
              {currentUser.fullName ? 'Your Account & Location' : 'Sign In to SiliconHarvest'}
            </h3>
            <p className="text-xs text-slate-500">
              Instant district logistics, escrow protection, and orders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-3 bg-white">
          <button
            onClick={() => {
              setActiveTab('GOOGLE_PHONE');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'GOOGLE_PHONE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Google & Mobile OTP
          </button>
          <button
            onClick={() => {
              setActiveTab('EMAIL');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'EMAIL'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Email & Password
          </button>
          <button
            onClick={() => {
              setActiveTab('PROFILE');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'PROFILE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            District & Address
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE & MOBILE OTP */}
          {activeTab === 'GOOGLE_PHONE' && (
            <div className="space-y-5">
              {/* Google OAuth One-Click */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[#1D1D1F] text-xs font-semibold shadow-sm transition-all"
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
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 absolute font-medium">
                  Or Sign In via Phone
                </span>
              </div>

              {/* Mobile OTP Form */}
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      10-Digit Indian Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-mono font-medium text-slate-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9840012345"
                        className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Enter 6-Digit OTP sent to +91 {phone}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-base py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
                    >
                      Change Phone
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 4}
                      className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Verify & Log In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL & PASSWORD */}
          {activeTab === 'EMAIL' && (
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs mb-3">
                <button
                  type="button"
                  onClick={() => setEmailMode('SIGN_IN')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    emailMode === 'SIGN_IN' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMode('SIGN_UP')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    emailMode === 'SIGN_UP' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {emailMode === 'SIGN_UP' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Arun Swaminathan"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {emailMode === 'SIGN_UP' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="BUYER_STUDENT">Customer / Student Buyer</option>
                    <option value="SELLER_LAB">Hardware Seller / Repair Shop Donor</option>
                    <option value="TECH_PARTNER">Verified Hot-Air Rework Technician</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {emailMode === 'SIGN_IN' ? 'Sign In with Email' : 'Create Free Account'}
              </button>
            </form>
          )}

          {/* TAB 3: DISTRICT & ADDRESS PROFILE */}
          {activeTab === 'PROFILE' && (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {INDIAN_STATES_DISTRICTS.map((s) => (
                      <option key={s.state} value={s.state}>
                        {s.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Area / College / Shop Street Address
                </label>
                <textarea
                  rows={2}
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="Hostel 4, Room 204, Anna University CEG Campus, Guindy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    6-Digit Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="600025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840012345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {currentUser.isSupabaseAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-auto py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  Save Location & Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Escrow Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>SiliconHarvest Buyer Escrow protects all extracted parts with verified multimeter QC.</span>
        </div>
      </div>
    </div>
  );
};
