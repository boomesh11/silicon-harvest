import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  Truck,
  CheckCircle2,
  DollarSign,
  Package,
  ShieldCheck,
  User,
  ArrowLeft,
  Crown,
} from 'lucide-react';
import { useHarvestStore } from '../store/useHarvestStore';
import { C2CMessage } from '../types/harvest';

const QUICK_INQUIRY_TAGS = [
  { label: '⚡ Is this IC tested & intact?', tag: 'COMPONENT_VERIFICATION' },
  { label: '🛵 Can you dispatch via Rapido today?', tag: 'RAPIDO_DISPATCH' },
  { label: '🚚 Is Porter needed for this heavy board?', tag: 'PORTER_LOGISTICS' },
  { label: '🔬 Share multimeter test reading', tag: 'MULTIMETER_TEST' },
  { label: '📦 Can you combine shipping for multiple parts?', tag: 'COMBINED_SHIPPING' },
];

export const C2CChatModal: React.FC = () => {
  const {
    isChatModalOpen,
    closeChatModal,
    activeChatThread,
    openChatModal,
    c2cMessages,
    sendC2CMessage,
    markChatAsRead,
    currentUser,
    boards,
    orders,
  } = useHarvestStore();

  const [messageText, setMessageText] = useState('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Group all messages into distinct conversation threads
  const conversationThreads = React.useMemo(() => {
    const threadMap: Record<
      string,
      {
        otherPartyId: string;
        otherPartyName: string;
        boardId?: string;
        boardName?: string;
        orderId?: string;
        orderCode?: string;
        lastMessage: C2CMessage;
        unreadCount: number;
      }
    > = {};

    c2cMessages.forEach((msg) => {
      const isMeSender = msg.senderId === currentUser.id;
      const otherId = isMeSender ? msg.recipientId : msg.senderId;
      const otherName = isMeSender
        ? msg.recipientName || 'Member'
        : msg.senderName;
      const threadKey = `${otherId}::${msg.boardId || 'general'}::${msg.orderId || 'none'}`;

      if (!threadMap[threadKey]) {
        threadMap[threadKey] = {
          otherPartyId: otherId,
          otherPartyName: otherName,
          boardId: msg.boardId,
          boardName: msg.boardName,
          orderId: msg.orderId,
          orderCode: msg.orderCode,
          lastMessage: msg,
          unreadCount: !isMeSender && !msg.isRead ? 1 : 0,
        };
      } else {
        if (new Date(msg.createdAt) > new Date(threadMap[threadKey].lastMessage.createdAt)) {
          threadMap[threadKey].lastMessage = msg;
        }
        if (!isMeSender && !msg.isRead) {
          threadMap[threadKey].unreadCount += 1;
        }
      }
    });

    return Object.values(threadMap).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }, [c2cMessages, currentUser.id]);

  // Current active conversation's filtered messages
  const activeMessages = React.useMemo(() => {
    if (!activeChatThread) return [];
    return c2cMessages.filter((msg) => {
      const involvesMe = msg.senderId === currentUser.id || msg.recipientId === currentUser.id;
      const involvesOther =
        msg.senderId === activeChatThread.recipientId ||
        msg.recipientId === activeChatThread.recipientId;
      
      if (!involvesMe || !involvesOther) return false;

      // If tied to a specific board or order, prioritize matching
      if (activeChatThread.boardId && msg.boardId) {
        return msg.boardId === activeChatThread.boardId;
      }
      if (activeChatThread.orderId && msg.orderId) {
        return msg.orderId === activeChatThread.orderId;
      }
      return true;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [c2cMessages, activeChatThread, currentUser.id]);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (isChatModalOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isChatModalOpen, activeMessages]);

  // Mark messages as read when viewing active thread
  useEffect(() => {
    if (isChatModalOpen && activeChatThread) {
      markChatAsRead(activeChatThread.recipientId, activeChatThread.boardId);
    }
  }, [isChatModalOpen, activeChatThread, markChatAsRead]);

  if (!isChatModalOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatThread || (!messageText.trim() && !offerPrice && !selectedTag)) return;

    setIsSending(true);
    try {
      await sendC2CMessage({
        boardId: activeChatThread.boardId,
        boardName: activeChatThread.boardName,
        orderId: activeChatThread.orderId,
        orderCode: activeChatThread.orderCode,
        recipientId: activeChatThread.recipientId,
        recipientName: activeChatThread.recipientName,
        message: messageText.trim(),
        offerPriceInr: offerPrice ? Number(offerPrice) : undefined,
        inquiryTag: selectedTag || undefined,
      });

      setMessageText('');
      setOfferPrice('');
      setShowOfferInput(false);
      setSelectedTag(null);
    } catch (err) {
      console.error('Failed to send C2C message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const selectQuickTag = (tag: { label: string; tag: string }) => {
    setSelectedTag(tag.label);
    if (!messageText) {
      setMessageText(`Hello! ${tag.label}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={closeChatModal}
      />

      {/* Slide-over Drawer */}
      <div className="relative z-10 w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-slate-200/90 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            {activeChatThread ? (
              <button
                type="button"
                onClick={() => openChatModal(undefined)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
                title="Back to all conversations"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate font-display">
                  {activeChatThread ? activeChatThread.recipientName : 'Direct Customer Messages'}
                </h3>
                {activeChatThread && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    Online
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {activeChatThread?.boardName
                  ? `Re: ${activeChatThread.boardName}`
                  : activeChatThread?.orderCode
                  ? `Order: ${activeChatThread.orderCode}`
                  : 'Real-time buyer & seller coordination'}
              </p>
            </div>
          </div>

          <button
            onClick={closeChatModal}
            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Thread List OR Active Chat Feed */}
        {!activeChatThread ? (
          /* THREAD LIST */
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="px-1 py-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Active Conversations ({conversationThreads.length})
              </span>
            </div>

            {conversationThreads.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-10 text-center space-y-3 mt-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  No Direct Messages Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Click &ldquo;💬 Chat with Seller&rdquo; on any donor PCB, IC, or active order to start a conversation.
                </p>
              </div>
            ) : (
              conversationThreads.map((thread, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    openChatModal({
                      recipientId: thread.otherPartyId,
                      recipientName: thread.otherPartyName,
                      boardId: thread.boardId,
                      boardName: thread.boardName,
                      orderId: thread.orderId,
                      orderCode: thread.orderCode,
                    })
                  }
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition-all flex items-start gap-3 shadow-2xs group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 group-hover:border-sky-300 transition-colors">
                    {thread.otherPartyName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {thread.otherPartyName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {thread.boardName && (
                      <span className="text-[10px] font-mono text-emerald-700 block truncate">
                        📦 {thread.boardName}
                      </span>
                    )}

                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {thread.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                      {thread.lastMessage.message ||
                        (thread.lastMessage.offerPriceInr
                          ? `Proposed Offer: ₹${thread.lastMessage.offerPriceInr}`
                          : 'Attachment')}
                    </p>
                  </div>

                  {thread.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {thread.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          /* ACTIVE CHAT FEED */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Inquiry Action Chips */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/40 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 whitespace-nowrap">
                {QUICK_INQUIRY_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectQuickTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 shrink-0 ${
                      selectedTag === tag.label
                        ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-slate-50/30 to-white">
              {activeMessages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Direct Escrow-Secured Chat
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Discuss component condition, pickup timing with Rapido/Porter, or propose a price.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[9px] text-slate-300 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-2xs space-y-1.5 ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                        }`}
                      >
                        {/* Special Tag Pill */}
                        {msg.inquiryTag && (
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isMe
                                ? 'bg-white/20 text-emerald-300'
                                : 'bg-sky-50 text-sky-800 border border-sky-200'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            <span>{msg.inquiryTag}</span>
                          </div>
                        )}

                        {/* Special Offer Pill */}
                        {msg.offerPriceInr && (
                          <div
                            className={`p-2 rounded-xl flex items-center justify-between gap-3 text-xs font-bold ${
                              isMe
                                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              Proposed Price:
                            </span>
                            <span className="font-mono text-sm font-black">
                              ₹{msg.offerPriceInr}
                            </span>
                          </div>
                        )}

                        {/* Message Text */}
                        {msg.message && (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white space-y-2">
              {showOfferInput && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    Propose Price (₹):
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-24 px-2 py-1 rounded-lg border border-amber-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowOfferInput(false);
                      setOfferPrice('');
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs ml-auto"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferInput((prev) => !prev)}
                  title="Attach Counter-Offer Price"
                  className={`min-h-[42px] px-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all active:scale-95 ${
                    showOfferInput
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Offer</span>
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Ask about part condition, Rapido pickup, or notes..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white"
                />

                <button
                  type="submit"
                  disabled={isSending || (!messageText.trim() && !offerPrice && !selectedTag)}
                  className={`min-h-[42px] px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                    messageText.trim() || offerPrice || selectedTag
                      ? 'bg-sky-600 hover:bg-sky-700 text-white active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

