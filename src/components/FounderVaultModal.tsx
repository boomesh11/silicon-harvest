import React, { useState } from 'react';
import { Shield, Lock, X, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';

export const FounderVaultModal: React.FC = () => {
  const { currentUser, activeTab, switchOwnerAdmin, setActiveTab } = useHarvestStore();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFounderUnlocked =
    currentUser.role === 'OWNER_ADMIN' || Boolean(currentUser.isOwnerAdmin);

  const handleOpenClick = () => {
    if (isFounderUnlocked) {
      setActiveTab('OWNER_ADMIN');
      return;
    }
    setErrorMsg(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (username.trim() === 'Boomesh@21' && password === 'rkboomesh@2006') {
      switchOwnerAdmin();
      setIsOpen(false);
      setUsername('');
      setPassword('');
    } else {
      setErrorMsg('Invalid Founder Vault credentials. Access denied.');
    }
  };

  return (
    <>
      {/* Sleek 3D Metallic Floating Vault Shield Button in Bottom-Left Corner */}
      <button
        type="button"
        onClick={handleOpenClick}
        title="Founder Vault Access (Owner Control)"
        aria-label="Founder Vault Access"
        style={{
          perspective: '800px',
          transformStyle: 'preserve-3d',
        }}
        className={`fixed bottom-5 left-5 z-50 group flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border shadow-[0_14px_34px_rgba(7,9,14,0.45)] transition-all duration-300 active:scale-95 ${
          activeTab === 'OWNER_ADMIN'
            ? 'bg-gradient-to-br from-[#07090E] via-[#0F172A] to-emerald-950 border-[#00F5A0]/70 text-[#00F5A0]'
            : 'bg-gradient-to-br from-[#07090E] via-[#111827] to-[#1E293B] border-white/20 hover:border-[#00F5A0]/60 text-white'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner group-hover:bg-[#00F5A0]/20 group-hover:border-[#00F5A0]/50 transition-all">
          <Shield className="w-4 h-4 text-[#00F5A0]" />
        </div>
        <div className="text-left pr-1 hidden sm:block">
          <div className="font-mono text-[9px] uppercase tracking-widest text-[#00F5A0] font-bold leading-none">
            {isFounderUnlocked ? 'VAULT UNLOCKED' : 'FOUNDER VAULT'}
          </div>
          <div className="text-[11px] font-semibold text-white mt-0.5 leading-none">
            {isFounderUnlocked ? 'Owner Console' : 'Admin Lock'}
          </div>
        </div>
      </button>

      {/* Password-Protected Founder Vault Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-3xl bg-[#07090E] text-white border border-white/15 shadow-[0_28px_80px_rgba(0,0,0,0.75)] p-6 sm:p-7 overflow-hidden"
            style={{
              perspective: '1200px',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Subtle Radial Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#00F5A0]/15 blur-3xl" />

            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#00F5A0]/15 border border-[#00F5A0]/40 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#00F5A0]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00F5A0] font-bold block">
                    RESTRICTED ACCESS • FOUNDER VAULT
                  </span>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Owner Admin Authentication
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                  Founder Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Founder ID"
                  autoComplete="username"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                  Vault Passkey
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00F5A0] font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Founder: Boomesh R K</span>
                <span className="text-[#00F5A0] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> +91 7200255069
                </span>
              </div>

              <div className="pt-1 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 px-5 rounded-xl bg-[#00F5A0] hover:bg-[#00d88d] text-[#07090E] font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock Founder Console</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FounderVaultModal;

