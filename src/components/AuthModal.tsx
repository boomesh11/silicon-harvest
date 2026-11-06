import React, { useState } from 'react';
import {
  X,
  UserCheck,
  KeyRound,
  Mail,
  LogOut,
  AlertCircle,
  Cpu,
  PlusCircle,
  Flame,
  Phone,
  MapPin,
  Building2,
  Globe,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { UserRole } from '../types/harvest';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const {
    currentUser,
    updateUserProfile,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    connectionMode,
  } = useHarvestStore();

  const [authTab, setAuthTab] = useState<
    'PROFILE_SETUP' | 'SIGN_IN' | 'SIGN_UP'
  >('PROFILE_SETUP');

  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [role, setRole] = useState<UserRole>(currentUser.role || 'BUYER_STUDENT');
  const [organization, setOrganization] = useState(
    currentUser.organization || ''
  );
  const [defaultAddress, setDefaultAddress] = useState(
    currentUser.defaultAddress || ''
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveOnboardingProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanedPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    updateUserProfile({
      fullName: fullName.trim(),
      phone: `+91 ${cleanedPhone}`,
      email: email.trim(),
      role,
      organization: organization.trim(),
      defaultAddress: defaultAddress.trim(),
    });
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      onClose();
    }
  };

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanedPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    const { error } = await signUpWithEmail(
      email.trim(),
      password,
      fullName.trim(),
      role,
      organization.trim(),
      `+91 ${cleanedPhone}`,
      defaultAddress.trim()
    );
    setLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      onClose();
    }
  };

  const roleOptions: {
    role: UserRole;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
  }[] = [
    {
      role: 'BUYER_STUDENT',
      title: 'Buyer (Student / Maker)',
      subtitle: 'Order extracted ICs or raw donor PCBs',
      icon: <Cpu className="w-4 h-4 text-emerald-600" />,
    },
    {
      role: 'SELLER_LAB',
      title: 'Seller (Lab / Repair Shop)',
      subtitle: 'List dead PCBs & auto-generate component BoMs',
      icon: <PlusCircle className="w-4 h-4 text-sky-600" />,
    },
    {
      role: 'TECH_PARTNER',
      title: 'Extraction Partner (Technician)',
      subtitle: 'Verify multimeter readings & earn 70% extraction fee',
      icon: <Flame className="w-4 h-4 text-amber-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.18)] overflow-hidden my-auto">
        {/* Top Bar */}
        <div className="px-6 py-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-semibold tracking-tight text-[#1D1D1F]">
                User Profile Onboarding &amp; Supabase Auth
              </h2>
              <p className="text-xs text-slate-500">
                {currentUser.fullName ? (
                  <>
                    Signed in as:{' '}
                    <span className="font-mono text-emerald-700 font-semibold">
                      {currentUser.fullName} ({currentUser.role})
                    </span>
                  </>
                ) : (
                  'Complete your profile or sign in via Supabase Auth'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#1D1D1F] border border-slate-200 flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4 flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => {
              setAuthTab('PROFILE_SETUP');
              setErrorMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              authTab === 'PROFILE_SETUP'
                ? 'bg-[#1D1D1F] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:text-[#1D1D1F] border border-slate-200'
            }`}
          >
            Profile &amp; Role Setup
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('SIGN_IN');
              setErrorMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              authTab === 'SIGN_IN'
                ? 'bg-[#1D1D1F] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:text-[#1D1D1F] border border-slate-200'
            }`}
          >
            Supabase Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab('SIGN_UP');
              setErrorMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              authTab === 'SIGN_UP'
                ? 'bg-[#1D1D1F] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:text-[#1D1D1F] border border-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authTab === 'PROFILE_SETUP' && (
            <form onSubmit={handleSaveOnboardingProfile} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your real Name, 10-digit Mobile Number, Role, and
                Campus/Delivery Address. These details will be used for your
                board listings, checkout receipts, and WhatsApp dispatch links.
              </p>

              {/* Role Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const selected = role === opt.role;
                  return (
                    <button
                      type="button"
                      key={opt.role}
                      onClick={() => setRole(opt.role)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selected
                          ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          {opt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {opt.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9840012345"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    College / Lab / Repair Shop
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="University / Lab Name"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  Campus / Delivery / Hub Address *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={defaultAddress}
                    onChange={(e) => setDefaultAddress(e.target.value)}
                    placeholder="Hostel / Department Lab / Shop Street & Pin Code"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs transition-all"
                >
                  Save Profile &amp; Continue
                </button>
                {(currentUser.fullName || currentUser.isSupabaseAuthenticated) && (
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="px-4 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-mono text-xs flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {authTab === 'SIGN_IN' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Authenticates via{' '}
                <span className="font-mono text-emerald-700 font-semibold">
                  Supabase Auth
                </span>{' '}
                ({connectionMode}).
              </div>

              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-[#1D1D1F] border border-slate-200 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Continue with Google OAuth (Supabase)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-400">
                  OR EMAIL &amp; PASSWORD
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs transition-all"
                >
                  {loading ? 'Signing In...' : 'Sign In with Supabase Auth'}
                </button>
              </form>
            </div>
          )}

          {authTab === 'SIGN_UP' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Account Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="BUYER_STUDENT">Buyer (Student)</option>
                    <option value="SELLER_LAB">Seller (Lab/Shop)</option>
                    <option value="TECH_PARTNER">
                      Extraction Partner (Technician)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9840012345"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Campus / Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="College / Lab / Shop"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  Default Delivery / Hub Address *
                </label>
                <input
                  type="text"
                  required
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  placeholder="Full Street / Hostel / Campus Address"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Password (min 6 chars) *
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#1D1D1F] hover:bg-slate-800 text-white font-semibold text-xs transition-all"
              >
                {loading
                  ? 'Creating Supabase Account...'
                  : 'Create Account & Sync Profile'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
