import React, { useState } from 'react';
import { useHarvestStore } from '../store/useHarvestStore';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { LOGISTICS_PARTNERS, LogisticsPartnerKey } from '../config/pricingEngine';
import { INDIAN_STATES_DISTRICTS } from '../data/catalogPricing';
import { DeliveryType } from '../types/harvest';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartItemQty,
    removeCartItem,
    clearCart,
    checkoutCart,
    currentUser,
  } = useHarvestStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [buyerName, setBuyerName] = useState(currentUser.fullName || '');
  const [buyerPhone, setBuyerPhone] = useState(
    currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : ''
  );
  const [buyerAddress, setBuyerAddress] = useState(currentUser.defaultAddress || '');
  const [buyerDistrict, setBuyerDistrict] = useState(currentUser.district || 'Chennai');
  const [buyerState, setBuyerState] = useState(currentUser.state || 'Tamil Nadu');
  const [buyerPincode, setBuyerPincode] = useState(currentUser.pincode || '600001');
  const [logisticsPartner, setLogisticsPartner] = useState<LogisticsPartnerKey>('RAPIDO');
  const [upiUtr, setUpiUtr] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalSubtotalInr = cartItems.reduce(
    (sum, item) => sum + item.unitPriceInr * item.quantity + (item.extractionFeeInr ?? 0) * item.quantity,
    0
  );

  const isPro = Boolean(currentUser.isProMember);
  const platformCommissionInr = isPro ? 0 : Math.min(15, Math.max(5, Math.round(totalSubtotalInr * 0.05)));
  const totalPayableInr = totalSubtotalInr + platformCommissionInr;

  const handleStateChange = (newState: string) => {
    setBuyerState(newState);
    const newDistricts = INDIAN_STATES_DISTRICTS.find((s) => s.state === newState)?.districts || [];
    if (newDistricts.length > 0) {
      setBuyerDistrict(newDistricts[0]);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!buyerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    const cleanDigits = buyerPhone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!buyerAddress.trim() || buyerAddress.trim().length < 5) {
      setErrorMsg('Please enter your complete delivery street address.');
      return;
    }

    try {
      const selectedPartner = LOGISTICS_PARTNERS[logisticsPartner] || LOGISTICS_PARTNERS.RAPIDO;
      const created = checkoutCart({
        buyerName: buyerName.trim(),
        buyerPhone: `+91 ${cleanDigits}`,
        buyerAddress: buyerAddress.trim(),
        buyerState,
        buyerDistrict,
        buyerPincode,
        deliveryType: selectedPartner.deliveryType as DeliveryType,
        logisticsPartner: selectedPartner.label,
        upiUtrOrPaymentId: upiUtr ? `UTR-${upiUtr.trim()}` : 'COD-DIRECT-DISPATCH',
      });

      setOrderSuccessMsg(
        `Successfully placed ${created.length} batch order(s)! Stock has been partially reserved and orders are logged in your Orders Tracker.`
      );
      setTimeout(() => {
        setOrderSuccessMsg(null);
        setIsCheckingOut(false);
      }, 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Checkout failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Shopping Cart ({totalItemsCount})
              </h2>
              <span className="text-[11px] text-slate-500">
                Bulk lot &amp; partial quantity reservations
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCartDrawerOpen(false);
              setIsCheckingOut(false);
            }}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {orderSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{orderSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Your shopping cart is empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Browse our ICs, Li-Ion battery cells, and donor PCBs to add items in custom quantities.
              </p>
            </div>
          ) : !isCheckingOut ? (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Seller: <strong>{item.sellerName}</strong> ({item.sellerDistrict})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-slate-100/80 rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, -1)}
                        className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold text-slate-900 px-1 min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => updateCartItemQty(item.id, 1)}
                        className="w-5 h-5 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-2xs active:scale-95 text-xs font-bold disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-mono">
                        / {item.maxStock} max
                      </span>
                    </div>

                    {/* Line Total */}
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-emerald-700">
                        ₹{(item.unitPriceInr * item.quantity).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ₹{item.unitPriceInr}/unit
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Checkout Form View */
            <form id="cart-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Delivery Address &amp; Contact
                </span>
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  ← Back to Cart
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Karthik Raj"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840012345"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={buyerPincode}
                    onChange={(e) => setBuyerPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="600025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">State</label>
                  <select
                    value={buyerState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                  >
                    {INDIAN_STATES_DISTRICTS.map((s) => (
                      <option key={s.state} value={s.state}>
                        {s.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={buyerDistrict}
                    onChange={(e) => setBuyerDistrict(e.target.value)}
                    placeholder="Chennai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Complete Address</label>
                <input
                  type="text"
                  required
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Street / Shop / Campus Address"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Logistics Preference</label>
                <select
                  value={logisticsPartner}
                  onChange={(e) => setLogisticsPartner(e.target.value as LogisticsPartnerKey)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none font-medium"
                >
                  <option value="RAPIDO">🛵 Rapido Bike Delivery (Same District)</option>
                  <option value="PORTER">🚚 Porter 2-Wheeler / Mini-Truck</option>
                  <option value="DUNZO">📦 Dunzo Hyperlocal Courier</option>
                  <option value="INDIA_POST">📮 India Post / Delhivery Express</option>
                  <option value="SELF_PICKUP">🤝 Self-Pickup / Direct Hand-off (₹0)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  UPI UTR or Direct Coordination Ref (Optional)
                </label>
                <input
                  type="text"
                  value={upiUtr}
                  onChange={(e) => setUpiUtr(e.target.value)}
                  placeholder="12-digit UTR or Cash on Delivery"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono focus:outline-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Summary & Action */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({totalItemsCount} units):</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{totalSubtotalInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Commission:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {isPro ? 'Pro ⭐ ₹0 Free' : `₹${platformCommissionInr}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Direct Dispatch Coordination:</span>
                <span className="font-mono font-bold text-emerald-700">₹0 Platform Markup</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-200">
                <span>Total Escrow Amount:</span>
                <span className="font-mono text-emerald-700 text-base">
                  ₹{totalPayableInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {!isCheckingOut ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Proceed to Partial Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="submit"
                form="cart-checkout-form"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <span>Confirm &amp; Place Batch Order (₹{totalPayableInr.toLocaleString('en-IN')})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
