import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useHarvestStore } from '../store/useHarvestStore';
import { ShieldCheck, Mail, Phone, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export function AuthView({ onSuccess }: { onSuccess?: () => void }) {
  const { updateUserProfile, setActiveTab } = useHarvestStore();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [fullName, setFullName] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const completeSuccess = (profileOverrides?: {
    id?: string;
    email?: string;
    fullName?: string;
    phone?: string;
    district?: string;
  }) => {
    updateUserProfile({
      id: profileOverrides?.id || `USR-${Date.now().toString().slice(-6)}`,
      email: profileOverrides?.email || email || `${phone}@mobile.siliconharvest.in`,
      fullName:
        profileOverrides?.fullName ||
        fullName.trim() ||
        (email ? email.split('@')[0] : `Member ${phone.slice(-4)}`),
      phone: profileOverrides?.phone || (phone ? `+91 ${phone.trim()}` : '+91 7200255069'),
      district: profileOverrides?.district || district || 'Chennai',
    });
    if (onSuccess) {
      onSuccess();
    } else {
      setActiveTab('MARKETPLACE');
    }
  };

  // 1. Email & Password Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, district }
          }
        });
        if (error) throw error;
        setInfoMsg('Account created successfully! You are now signed in.');
        completeSuccess({
          id: data.user?.id,
          email,
          fullName: fullName.trim() || email.split('@')[0],
          district,
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const meta = data.user?.user_metadata || {};
        completeSuccess({
          id: data.user?.id,
          email: data.user?.email || email,
          fullName: meta.full_name || fullName || email.split('@')[0],
          district: meta.district || district,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Real Supabase Phone OTP Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.trim()}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) throw error;
      setStep('verify');
      setInfoMsg(`Verification code sent via SMS to ${formattedPhone}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send verification SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.trim()}`;

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: 'sms',
      });
      if (error) throw error;
      completeSuccess({
        id: data.user?.id,
        phone: formattedPhone,
        fullName: fullName.trim() || `Verified +91 ${phone.slice(-4)}`,
        district,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 font-bold text-xl">
            ⚡
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {authMode === 'signin' ? 'Welcome Back to SiliconHarvest' : 'Create Your Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            District-connected circular electronics marketplace
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {infoMsg}
          </div>
        )}

        {/* Method Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setStep('input'); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone'); setStep('input'); }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Mobile Number (OTP)
          </button>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Boomesh R K"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Home District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Bengaluru Urban">Bengaluru Urban</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>
                {authMode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" />
              </>}
            </button>
          </form>
        ) : (
          <div>
            {step === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">10-Digit Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-xs text-slate-400 font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="7200255069"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Verification Code <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Enter 6-Digit SMS Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-mono py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full mt-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            {authMode === 'signin' ? "Don't have an account yet?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setErrorMsg(''); setInfoMsg(''); }}
              className="font-medium text-emerald-600 hover:text-emerald-700 ml-1"
            >
              {authMode === 'signin' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
