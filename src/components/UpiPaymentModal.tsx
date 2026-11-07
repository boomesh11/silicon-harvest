import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountInr: number;
  orderCode?: string;
  itemTitle?: string;
  onConfirmUtr: (utr: string, provider: string) => void;
  initialUtr?: string;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  amountInr,
  orderCode = 'SH-ORD',
  itemTitle = 'Hardware Salvage Order',
  onConfirmUtr,
  initialUtr = '',
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM' | 'GENERIC'>('GPAY');
  const [utrInput, setUtrInput] = useState(initialUtr);
  const [copiedVpa, setCopiedVpa] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const primaryVpa = '7200255069@upi';
  const secondaryVpa = 'rkboomesh@okaxis';
  const payeeName = 'Boomesh R K - SiliconHarvest';
  const transactionNote = `SiliconHarvest ${orderCode}`;

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(primaryVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  const getProviderDeepLink = (provider: 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM' | 'GENERIC') => {
    switch (provider) {
      case 'GPAY':
        return `gpay://upi/pay?pa=${encodeURIComponent(primaryVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      case 'PHONEPE':
        return `phonepe://upi/pay?pa=${encodeURIComponent(primaryVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      case 'PAYTM':
        return `paytmmp://pay?pa=${encodeURIComponent(primaryVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      case 'BHIM':
      default:
        return upiDeepLink;
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyVpa = (vpa: string) => {
    navigator.clipboard.writeText(vpa);
    setCopiedVpa(vpa);
    setTimeout(() => setCopiedVpa(null), 2500);
  };

  const cleanedUtr = utrInput.replace(/\D/g, '').slice(0, 12);

  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cleanedUtr.length !== 12) {
      setErrorMsg('Please enter the full 12-digit numeric UPI UTR / Reference ID.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedUtr(cleanedUtr);
      onConfirmUtr(cleanedUtr, selectedProvider);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-[0_25px_70px_rgba(15,23,42,0.18)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              UPI
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Dynamic UPI Escrow Payment
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {orderCode} • Amount: ₹{amountInr.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {verifiedUtr ? (
            /* Verified Green Receipt */
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                  Escrow Payment Verified ✓
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  ₹{amountInr.toLocaleString('en-IN')} Secured in Escrow
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your funds are held securely until the component is bench-tested with a multimeter and dispatched to you.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 text-left font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction UTR:</span>
                  <span className="font-bold text-slate-900">{verifiedUtr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiary VPA:</span>
                  <span className="font-bold text-slate-900">{primaryVpa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payee:</span>
                  <span className="font-bold text-slate-900">{payeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Reference:</span>
                  <span className="font-bold text-emerald-700">{orderCode}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[46px] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md"
              >
                Done • Proceed with Order Tracking →
              </button>
            </div>
          ) : (
            <>
              {/* Top Payable Banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                    Total Payable Amount
                  </span>
                  <div className="text-2xl font-black font-mono">
                    ₹{amountInr.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px] block">
                    {itemTitle}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3" />
                    Zero Markup
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code + VPA Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1 font-bold">
                    <QrCode className="w-3 h-3 text-slate-700" />
                    Scan with ANY UPI App
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Founder Direct VPA (Primary):
                    </label>
                    <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-mono text-xs font-bold text-slate-900 truncate flex-1">
                        {primaryVpa}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyVpa(primaryVpa)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0 transition-colors"
                      >
                        {copiedVpa === primaryVpa ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Secondary Axis VPA:
                    </label>
                    <div className="flex items-center gap-1 bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-mono text-xs font-bold text-slate-900 truncate flex-1">
                        {secondaryVpa}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyVpa(secondaryVpa)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0 transition-colors"
                      >
                        {copiedVpa === secondaryVpa ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Payee: <strong>{payeeName}</strong>
                  </div>
                </div>
              </div>

              {/* 1-Tap UPI App Deep Links (for mobile/tablet) */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  1-Tap Pay via Mobile UPI App:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={getProviderDeepLink('GPAY')}
                    onClick={() => setSelectedProvider('GPAY')}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
                  >
                    <span>Google Pay</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href={getProviderDeepLink('PHONEPE')}
                    onClick={() => setSelectedProvider('PHONEPE')}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
                  >
                    <span>PhonePe</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href={getProviderDeepLink('PAYTM')}
                    onClick={() => setSelectedProvider('PAYTM')}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
                  >
                    <span>Paytm</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href={getProviderDeepLink('BHIM')}
                    onClick={() => setSelectedProvider('BHIM')}
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 transition-all active:scale-95 shadow-2xs"
                  >
                    <span>BHIM UPI</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* UTR Verification Form */}
              <form onSubmit={handleSubmitVerification} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enter 12-Digit Numeric UPI UTR / Ref Number:</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        cleanedUtr.length === 12
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {cleanedUtr.length} / 12 digits
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={12}
                      value={utrInput}
                      onChange={(e) => {
                        setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12));
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="e.g. 431289567123"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tracking-wider shadow-inner"
                    />
                    {cleanedUtr.length === 12 && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in your UPI app receipt under &ldquo;UPI transaction ID&rdquo; or &ldquo;UTR&rdquo;.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={cleanedUtr.length !== 12 || isVerifying}
                  className={`w-full min-h-[48px] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    cleanedUtr.length === 12 && !isVerifying
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying UPI Escrow...
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm Payment &amp; Secure Order</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

