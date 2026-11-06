import React, { useState } from 'react';
import {
  Headphones,
  MessageSquare,
  Send,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Clock,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { SupportTicket } from '../types/harvest';

export const SupportContactPortal: React.FC = () => {
  const { createSupportTicket, supportTickets, currentUser } = useHarvestStore();

  const [customerName, setCustomerName] = useState(currentUser.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(
    currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : ''
  );
  const [customerEmail, setCustomerEmail] = useState(currentUser.email || '');
  const [orderCode, setOrderCode] = useState('');
  const [category, setCategory] = useState('Order & Delivery Tracking');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ open state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the SiliconHarvest Multimeter Escrow Guarantee work?',
      a: 'When you order in Desoldered Mode, the component price and hot-air extraction fee are held safely in escrow. The rework technician only receives payout after desoldering the chip and logging a verified multimeter reading (diode drop & voltage rail continuity). If the part fails testing, your payment is immediately refunded.',
    },
    {
      q: 'How fast do Rapido, Dunzo & Porter hyperlocal couriers deliver?',
      a: 'For orders placed in the same district as the seller (e.g. Chennai to Chennai or Bengaluru to Bengaluru), our 2-wheeler courier partners pick up directly from the hub or seller and deliver to your doorstep or college hostel in 35 to 60 minutes.',
    },
    {
      q: 'What if I am ordering from another district or state?',
      a: 'Outstation orders are sealed in an ESD Anti-Static protective pouch and dispatched via India Post Speed Post (₹49 flat) or Delhivery Surface Express (₹69 flat) with live AWB tracking and 2-4 day delivery across Tamil Nadu and all of India.',
    },
    {
      q: 'Can I sell my college project or broken repair shop PCBs here?',
      a: 'Yes! SiliconHarvest welcomes engineering students, makers, and appliance repair shops. Listing is 100% free with guided fixed price tiers, and our 10% platform commission is only deducted after an order is successfully completed.',
    },
  ];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Please enter your support message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        customerName: customerName.trim(),
        customerPhone: `+91 ${cleanPhone}`,
        customerEmail: customerEmail.trim() || undefined,
        orderCode: orderCode.trim() || undefined,
        category,
        message: message.trim(),
      });
      setCreatedTicket(ticket);
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Headphones className="w-3.5 h-3.5" />
          <span>Customer Help & Resolution Desk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
          Contact Support & Help Center
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Need help tracking a parcel, claiming an escrow refund, or scheduling bulk scrap pickup? Our team is active 6 days a week.
        </p>
      </div>

      {/* Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* WhatsApp Card */}
        <a
          href="https://wa.me/919840000000?text=Hi%20SiliconHarvest%20Support%2C%20I%20need%20assistance%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 rounded-3xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex flex-col justify-between transition-all group"
        >
          <div className="space-y-2">
            <span className="text-xl">💬</span>
            <h3 className="font-bold text-sm tracking-tight">WhatsApp Priority Desk</h3>
            <p className="text-xs text-emerald-50 opacity-90 leading-relaxed">
              Instant assistance for courier live tracking & multimeter test reports.
            </p>
          </div>
          <span className="text-xs font-semibold underline mt-4 block group-hover:translate-x-0.5 transition-transform">
            Chat on WhatsApp ➔
          </span>
        </a>

        {/* Helpline Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <span className="text-xl">📞</span>
          <h3 className="font-bold text-sm text-[#1D1D1F]">Customer Care Helpline</h3>
          <p className="text-xs text-slate-500 font-mono font-semibold">+91 98400 12345</p>
          <p className="text-[11px] text-slate-400">Monday – Saturday: 9:00 AM – 8:00 PM IST</p>
        </div>

        {/* Official Email Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <span className="text-xl">✉️</span>
          <h3 className="font-bold text-sm text-[#1D1D1F]">Email Support Desk</h3>
          <p className="text-xs text-slate-500 font-mono font-semibold">support@siliconharvest.in</p>
          <p className="text-[11px] text-slate-400">Guaranteed response within 4 business hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ticket Submission Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                Open a Support Ticket
              </h3>
              <p className="text-xs text-slate-500">
                Tickets are tracked live in our PostgreSQL support queue
              </p>
            </div>
          </div>

          {createdTicket && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5 animate-in zoom-in-95">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ticket Registered: {createdTicket.ticketCode}</span>
              </div>
              <p className="text-emerald-700">
                Thank you, {createdTicket.customerName}. Our customer support lead has been notified on phone &amp; email.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Karthik Raj"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  10-Digit Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-mono text-slate-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9840012345"
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="karthik@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Order Code (If Applicable)
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="SH-ORD-2041"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="Order & Delivery Tracking">Order &amp; Delivery Tracking (Rapido / Dunzo / Porter / Speed Post)</option>
                <option value="Dead-on-Arrival (DOA) Escrow Refund">Dead-on-Arrival (DOA) Escrow Refund Request</option>
                <option value="Join as District Rework Technician">Join as District Rework Technician</option>
                <option value="College / Repair Shop Bulk E-Waste Pickup">College / Repair Shop Bulk E-Waste Pickup</option>
                <option value="General Inquiry">General Marketplace Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your inquiry, component request, or delivery address update..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Ticket...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        </div>

        {/* FAQs & Quality Guarantee */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Frequently Asked Questions</span>
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 text-left flex items-center justify-between text-xs font-semibold text-[#1D1D1F] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 text-xs text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Tickets List if any submitted by this user */}
          {supportTickets.length > 0 && (
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Recent Support Inquiries ({supportTickets.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {supportTickets.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{t.ticketCode}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-slate-500 line-clamp-1">{t.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
