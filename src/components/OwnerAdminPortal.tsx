import React, { useState } from 'react';
import {
  ShieldAlert,
  Package,
  Users,
  ShoppingBag,
  LifeBuoy,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Crown,
  ChevronRight,
  ExternalLink,
  Save,
  MessageSquare,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { OrderStatus } from '../types/harvest';

export const OwnerAdminPortal: React.FC = () => {
  const {
    boards,
    orders,
    bargainOffers,
    supportTickets,
    currentUser,
    updateBoardPrice,
    toggleBoardVerified,
    deleteBoardListing,
    updateOrderStatusAdmin,
    acceptBargainOffer,
    rejectBargainOffer,
    resolveSupportTicket,
    toggleUserProStatus,
  } = useHarvestStore();

  const [activeAdminTab, setActiveAdminTab] = useState<'INVENTORY' | 'USERS' | 'ORDERS_BARGAINS' | 'SUPPORT'>('INVENTORY');
  const [inventorySearch, setInventorySearch] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // KPIs
  const totalGmv = orders.reduce((sum, o) => sum + (o.totalPayableInr || o.totalPriceInr || 0), 0);
  const activeListingsCount = boards.filter((b) => b.status === 'AVAILABLE').length;
  const verifiedListingsCount = boards.filter((b) => b.isVerified).length;
  const openBargainsCount = bargainOffers.filter((b) => b.status === 'PENDING').length;
  const openTicketsCount = supportTickets.filter((t) => t.status === 'OPEN').length;

  const filteredBoards = boards.filter((b) =>
    b.boardName.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    b.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    (b.sellerDistrict && b.sellerDistrict.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
      {/* Admin Top Header Banner */}
      <section className="bg-[#0F172A] border-b border-slate-800 px-4 py-8 sm:px-6 lg:px-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/30">
                <Crown className="h-4 w-4" />
                Founder & Owner Control Tower
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
                Master Administration Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Logged in as <strong className="text-white">{currentUser.fullName || 'Founder Admin'}</strong> ({currentUser.email || 'founder@siliconharvest.org'})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Engine Active
              </span>
            </div>
          </div>

          {/* Quick Notification */}
          {notification && (
            <div className="mt-4 rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3 text-xs sm:text-sm font-semibold text-emerald-200">
              {notification}
            </div>
          )}

          {/* Executive KPIs Grid */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Platform GMV</span>
              <p className="mt-1 text-2xl font-black text-emerald-400">₹{totalGmv.toLocaleString()}</p>
              <span className="text-[11px] text-slate-500">{orders.length} orders total</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Live Inventory</span>
              <p className="mt-1 text-2xl font-black text-white">{activeListingsCount}</p>
              <span className="text-[11px] text-emerald-400 font-medium">{verifiedListingsCount} verified</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Open Bargains</span>
              <p className="mt-1 text-2xl font-black text-amber-400">{openBargainsCount}</p>
              <span className="text-[11px] text-slate-500">Awaiting counter-action</span>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <span className="text-xs text-slate-400 font-medium">Support Tickets</span>
              <p className="mt-1 text-2xl font-black text-blue-400">{openTicketsCount}</p>
              <span className="text-[11px] text-slate-500">Unresolved queries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Tab Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-2">
          <button
            type="button"
            onClick={() => setActiveAdminTab('INVENTORY')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeAdminTab === 'INVENTORY'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Package className="h-4 w-4" />
            Stock & Inventory ({boards.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('ORDERS_BARGAINS')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeAdminTab === 'ORDERS_BARGAINS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders & Bargains ({orders.length + bargainOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('USERS')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeAdminTab === 'USERS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Members & Access
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('SUPPORT')}
            className={`min-h-[44px] px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              activeAdminTab === 'SUPPORT'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <LifeBuoy className="h-4 w-4" />
            Support Inbox ({openTicketsCount} open)
          </button>
        </div>

        {/* TAB A: INVENTORY MANAGER */}
        {activeAdminTab === 'INVENTORY' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inventory by part name, category, or district..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium px-2">
                Showing {filteredBoards.length} of {boards.length} items
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="p-3">Product / Part</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Seller & District</th>
                    <th className="p-3">Price (₹)</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Verified</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBoards.map((board) => (
                    <tr key={board.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{board.boardName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">{board.id}</span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {board.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <div className="font-medium text-slate-800">{board.sellerName}</div>
                        <div className="text-[11px] text-slate-400">{board.locationArea}, {board.sellerDistrict || 'Chennai'}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {editingPriceId === board.id ? (
                          <div className="flex items-center gap-1">
                            <span>₹</span>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="w-16 px-1 py-0.5 border border-slate-300 rounded text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateBoardPrice(board.id, tempPrice);
                                setEditingPriceId(null);
                                showNotification(`Updated price for ${board.boardName} to ₹${tempPrice}`);
                              }}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span>₹{board.rawBoardPriceInr}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceId(board.id);
                                setTempPrice(board.rawBoardPriceInr);
                              }}
                              className="text-slate-400 hover:text-slate-700"
                              title="Edit price"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                          {board.hardwareMode || 'READY_TO_USE'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            toggleBoardVerified(board.id);
                            showNotification(`${board.isVerified ? 'Unmarked' : 'Marked'} verified: ${board.boardName}`);
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all ${
                            board.isVerified
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {board.isVerified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete listing "${board.boardName}"?`)) {
                              deleteBoardListing(board.id);
                              showNotification(`Deleted listing: ${board.boardName}`);
                            }
                          }}
                          className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                          title="Delete listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB B: ORDERS & BARGAINS CONTROL TOWER */}
        {activeAdminTab === 'ORDERS_BARGAINS' && (
          <div className="mt-6 space-y-6">
            {/* Open Bargains Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-amber-500" />
                Active Bargain Counter-Offers ({bargainOffers.length})
              </h2>

              {bargainOffers.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No bargain offers submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {bargainOffers.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs sm:text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{b.boardName}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              b.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Buyer: <strong>{b.buyerName}</strong> ({b.buyerDistrict}) • Seller: <strong>{b.sellerName}</strong>
                        </p>
                        {b.note && <p className="text-slate-600 italic text-xs mt-1">"{b.note}"</p>}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400 line-through">₹{b.originalPriceInr}</div>
                          <div className="text-base font-black text-emerald-600">₹{b.offeredPriceInr}</div>
                        </div>

                        {b.status === 'PENDING' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                acceptBargainOffer(b.id);
                                showNotification(`Accepted bargain offer ₹${b.offeredPriceInr} for ${b.boardName}`);
                              }}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                rejectBargainOffer(b.id);
                                showNotification(`Rejected bargain offer for ${b.boardName}`);
                              }}
                              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Orders Manager */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Truck className="h-5 w-5 text-emerald-600" />
                Live Customer Orders & Logistics ({orders.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                      <th className="p-2.5">Order</th>
                      <th className="p-2.5">Buyer & District</th>
                      <th className="p-2.5">Logistics</th>
                      <th className="p-2.5">Total (₹)</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900">
                          <div>{order.orderCode || order.id}</div>
                          <span className="text-[11px] text-slate-400">{order.mode}</span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-medium text-slate-800">{order.buyerName}</div>
                          <div className="text-[11px] text-slate-400">{order.buyerDistrict || 'Chennai'} • {order.buyerPhone}</div>
                        </td>
                        <td className="p-2.5">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {order.logisticsPartner || 'Rapido'}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          ₹{order.totalPayableInr || order.totalPriceInr}
                        </td>
                        <td className="p-2.5">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            {order.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as OrderStatus;
                              updateOrderStatusAdmin(order.id, newStatus);
                              showNotification(`Updated order ${order.orderCode || order.id} to ${newStatus}`);
                            }}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-medium bg-white"
                          >
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="PENDING_EXTRACTION">PENDING_EXTRACTION</option>
                            <option value="PICKED_UP_BY_PARTNER">PICKED_UP_BY_PARTNER</option>
                            <option value="READY_FOR_DISPATCH">READY_FOR_DISPATCH</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="COMPLETED">COMPLETED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB C: USERS & PRO MEMBERSHIP DIRECTORY */}
        {activeAdminTab === 'USERS' && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-600" />
                Customer Directory & Pro Membership Access
              </h2>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Active Session User: {currentUser.fullName || 'Guest Customer'}</h3>
                  <p className="text-xs text-slate-500">
                    Phone: {currentUser.phone || 'None'} • District: {currentUser.district || 'Chennai'} • Role: {currentUser.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleUserProStatus();
                    showNotification(`Toggled Pro Membership for ${currentUser.fullName || 'User'}`);
                  }}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    currentUser.isProMember
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {currentUser.isProMember ? '⭐ Revoke Pro Membership' : '⭐ Grant Pro Membership Access'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Rajan Electronics Lab</span>
                    <span className="ml-2 text-xs text-slate-500">Guindy, Chennai • Verified Lab Seller</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Pro Member ⭐
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Karthik Raja (Student Buyer)</span>
                    <span className="ml-2 text-xs text-slate-500">Anna University, Chennai</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Pro Member ⭐
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-900">Metro Appliance Salvage</span>
                    <span className="ml-2 text-xs text-slate-500">Ambattur SIDCO, Chennai</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    Standard Account
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB D: SUPPORT INBOX */}
        {activeAdminTab === 'SUPPORT' && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-3">
                <LifeBuoy className="h-5 w-5 text-blue-600" />
                Customer Support Inbox & Resolution Center ({supportTickets.length})
              </h2>

              {supportTickets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Zero pending support tickets. All customer issues resolved!
                </div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ticket.category}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1">"{ticket.message}"</p>
                        <p className="text-slate-400 text-[11px] mt-1">
                          From: {ticket.customerName} ({ticket.customerPhone}) {ticket.orderCode && `• Order: ${ticket.orderCode}`}
                        </p>
                      </div>

                      {ticket.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => {
                            resolveSupportTicket(ticket.id);
                            showNotification(`Resolved ticket #${ticket.id}`);
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 shrink-0"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
