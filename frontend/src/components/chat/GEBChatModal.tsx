import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Building2,
  Loader2,
  Sparkles,
  RefreshCw,
  X,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Conversation,
  Message,
  listConversations,
  getConversationMessages,
  sendChatMessage,
  updateConversationMode,
} from "@/services/conversations";

interface GEBChatModalProps {
  open: boolean;
  onClose: () => void;
  // If provided, directly open this conversation (Buyer mode)
  directConversation?: Conversation | null;
  // Mode: "buyer" or "seller"
  initialMode?: "buyer" | "seller";
}

export default function GEBChatModal({
  open,
  onClose,
  directConversation = null,
  initialMode = "buyer",
}: GEBChatModalProps) {
  const { user } = useAuth();
  
  const [mode, setMode] = useState<"buyer" | "seller">(initialMode);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle opening and mode setting
  useEffect(() => {
    if (open) {
      setError("");
      setMode(initialMode);
      
      if (directConversation) {
        setActiveConversation(directConversation);
        fetchMessages(directConversation.id);
      } else {
        fetchConversations();
      }
    } else {
      // Clear interval on close
      stopPolling();
      setActiveConversation(null);
      setMessages([]);
      setConversations([]);
    }
  }, [open, directConversation, initialMode]);

  // Fetch all conversations (used in Seller mode or when Listing Inbox is clicked)
  async function fetchConversations() {
    try {
      setLoadingConversations(true);
      setError("");
      const data = await listConversations();
      
      // If in seller mode, filter or sort conversations
      setConversations(data);
      
      // Auto-select first conversation if none is active and there are conversations
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0]);
        fetchMessages(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chats.");
    } finally {
      setLoadingConversations(false);
    }
  }

  // Fetch messages for a specific conversation
  async function fetchMessages(conversationId: string, silent = false) {
    if (!silent) setLoadingMessages(true);
    try {
      const data = await getConversationMessages(conversationId);
      setMessages(data);
    } catch (err: any) {
      if (!silent) {
        setError(err.message || "Failed to load messages.");
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  // Setup message polling
  useEffect(() => {
    if (open && activeConversation) {
      stopPolling();
      
      // Poll every 4 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(activeConversation.id, true);
      }, 4000);
    }
    
    return () => stopPolling();
  }, [open, activeConversation]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const text = newMessage;
    setNewMessage("");
    setSending(true);
    
    try {
      const sentMsg = await sendChatMessage(activeConversation.id, text);
      setMessages((prev) => [...prev, sentMsg]);
      scrollToBottom();
    } catch (err: any) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  // Determine participant info
  const isSellerOfActive = activeConversation && user && String(activeConversation.seller_id) === String(user.id);
  const otherPartyName = activeConversation
    ? isSellerOfActive
      ? activeConversation.buyer.full_name || activeConversation.buyer.email
      : activeConversation.seller.full_name || activeConversation.seller.email
    : "";

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 md:p-4 backdrop-blur-md">
      <div 
        className="flex h-full w-full md:h-[85vh] md:max-w-6xl flex-col overflow-hidden rounded-none md:rounded-[2.5rem] bg-[#f7f7f5] shadow-2xl border-none md:border md:border-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3.5 md:px-6 md:py-4">
          {activeConversation ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {(mode === "seller" || !directConversation) && (
                <button
                  onClick={() => setActiveConversation(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-zinc-100 md:hidden shrink-0 border border-black/5 bg-white"
                  aria-label="Back to conversations list"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              {activeConversation.property.image && (
                <img
                  src={activeConversation.property.image}
                  alt=""
                  className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-xl shrink-0 border border-black/5"
                />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-sm md:text-base font-bold tracking-tight text-zinc-900 truncate">
                  {activeConversation.property.title}
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-x-2 text-[9px] md:text-[10px] text-zinc-500 font-semibold leading-tight mt-0.5">
                  <span className="truncate">
                    {activeConversation.property.locality
                      ? `${activeConversation.property.locality}, `
                      : ""}
                    {activeConversation.property.city}
                  </span>
                  <span className="hidden md:inline text-zinc-300">•</span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded-md self-start mt-0.5 md:mt-0 font-bold">
                    Seller: {activeConversation.seller.full_name || "Verified Seller"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold tracking-tight">
                  {mode === "seller" ? "GEB Seller Inbox" : "Contact Listing Agent"}
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Your conversations on GEB
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            {activeConversation && isSellerOfActive && (
              <button
                onClick={async () => {
                  if (!activeConversation) return;
                  const newMode = activeConversation.mode === "ai_active" ? "human_active" : "ai_active";
                  try {
                    const updated = await updateConversationMode(activeConversation.id, newMode);
                    setActiveConversation(updated);
                    fetchConversations();
                  } catch (err: any) {
                    setError(err.message || "Failed to toggle co-pilot mode.");
                  }
                }}
                className={`flex items-center gap-1 border px-2.5 py-1.5 rounded-full shrink-0 transition duration-300 font-bold text-[9px] shadow-sm hover:scale-[1.03] ${
                  activeConversation.mode === "ai_active"
                    ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                }`}
                title="Click to toggle AI Co-Pilot / Human Chat takeover"
              >
                {activeConversation.mode === "ai_active" ? (
                  <>
                    <Sparkles size={11} className="text-purple-600 animate-pulse" />
                    <span className="hidden sm:inline">AI Active (Click to Take Over)</span>
                    <span className="sm:hidden">AI</span>
                  </>
                ) : (
                  <>
                    <User size={11} className="text-emerald-600" />
                    <span className="hidden sm:inline">Seller Active (Click to Return to AI)</span>
                    <span className="sm:hidden">Human</span>
                  </>
                )}
              </button>
            )}

            {activeConversation && !isSellerOfActive && (
              <div className="flex items-center gap-1 bg-zinc-50 border border-black/5 px-2.5 py-1.5 rounded-full shrink-0">
                {activeConversation.mode === "ai_active" ? (
                  <>
                    <Sparkles size={11} className="text-purple-600 animate-pulse" />
                    <span className="text-[9px] font-bold text-purple-700">AI Active</span>
                  </>
                ) : (
                  <>
                    <User size={11} className="text-emerald-600" />
                    <span className="text-[9px] font-bold text-emerald-700 font-bold">Seller Active</span>
                  </>
                )}
              </div>
            )}

            {activeConversation && (
              <button
                onClick={() => fetchMessages(activeConversation.id)}
                disabled={loadingMessages}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 hover:bg-zinc-100 transition border border-black/5"
                title="Refresh messages"
              >
                <RefreshCw size={14} className={loadingMessages ? "animate-spin" : ""} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-50 hover:bg-zinc-100 transition border border-black/5"
              aria-label="Close chat window"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* WORKSPACE */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDE PANEL (Inbox list - only visible when not in direct conversation mode OR in seller mode) */}
          {(mode === "seller" || !directConversation) && (
            <div className={`w-full md:w-80 shrink-0 border-r border-black/5 bg-white flex flex-col overflow-hidden ${
              activeConversation ? "hidden md:flex" : "flex"
            }`}>
              <div className="p-4 border-b border-black/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Recent Conversations
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingConversations ? (
                  <div className="flex h-40 items-center justify-center text-zinc-400">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    <span className="text-sm font-medium">Loading conversations...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <Building2 size={24} className="mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-semibold">No messages yet</p>
                    <p className="text-[10px] mt-1">Start a conversation from a property listing details modal.</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const active = activeConversation?.id === conv.id;
                    const partner = String(conv.seller_id) === String(user?.id)
                      ? conv.buyer.full_name || conv.buyer.email
                      : conv.seller.full_name || conv.seller.email;
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full text-left p-3.5 rounded-2xl transition flex flex-col gap-1.5 ${
                          active 
                            ? "bg-zinc-950 text-white shadow-lg shadow-black/10" 
                            : "hover:bg-zinc-50 text-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold truncate pr-2">
                            {partner}
                          </span>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                            active 
                              ? "bg-white/20 text-white" 
                              : "bg-zinc-100 text-zinc-500"
                          }`}>
                            {conv.mode.replace("_", " ")}
                          </span>
                        </div>
                        
                        <div className={`text-[11px] font-medium truncate ${
                          active ? "text-zinc-300" : "text-zinc-500"
                        }`}>
                          🏡 {conv.property.title}
                        </div>
                        
                        <span className={`text-[9px] self-end ${
                          active ? "text-zinc-400" : "text-zinc-400"
                        }`}>
                          {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* RIGHT SIDE PANEL (Chat Messages workspace) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeConversation ? (
              <>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-50 text-red-600 px-6 py-2 text-xs font-semibold border-b border-red-100 flex justify-between items-center shrink-0">
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">×</button>
                  </div>
                )}

                {/* Messages view */}
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 space-y-4">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center text-zinc-400">
                        <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                        <p className="text-xs font-medium">Retrieving messages...</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-8 text-center text-zinc-400">
                      <div>
                        <MessageSquare className="mx-auto mb-3 text-zinc-300" size={32} />
                        <p className="text-sm font-semibold">No messages yet</p>
                        <p className="text-xs max-w-xs mt-1">Send a message below to start the conversation with the agent.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = user && String(msg.sender_id) === String(user.id);
                      const isAI = msg.sender_type === "ai_agent";
                      const isSystem = msg.sender_type === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <span className="rounded-full bg-zinc-200/60 px-3.5 py-1 text-[10px] font-bold text-zinc-500 border border-zinc-300/40">
                              {msg.message}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} items-start gap-2.5`}
                        >
                          {!isMe && (
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold border shadow-sm ${
                              isAI 
                                ? "bg-purple-100 text-purple-700 border-purple-200" 
                                : "bg-white text-zinc-600 border-zinc-200"
                            }`}>
                              {isAI ? <Bot size={14} /> : <User size={14} />}
                            </div>
                          )}

                          <div className={`max-w-[70%] flex flex-col gap-1`}>
                            {/* Sender details */}
                            <span className={`text-[9px] font-bold text-zinc-400 px-1 ${isMe ? "self-end" : "self-start"}`}>
                              {isMe 
                                ? "You" 
                                : isAI 
                                  ? "GEB Seller AI" 
                                  : msg.sender_type === "seller"
                                    ? "Seller"
                                    : msg.sender?.full_name || "Buyer"
                              }
                            </span>
                            
                            {/* Text bubble */}
                            <div className={`rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition hover:shadow-md ${
                              isMe
                                ? "bg-zinc-950 text-white rounded-tr-none"
                                : isAI
                                  ? "bg-purple-50 text-purple-950 border border-purple-200 rounded-tl-none"
                                  : "bg-white text-zinc-900 border border-black/5 rounded-tl-none"
                            }`}>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            </div>
                            
                            <span className={`text-[8px] text-zinc-400 font-semibold px-1 ${isMe ? "self-end" : "self-start"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <form 
                  onSubmit={handleSendMessage}
                  className="bg-white border-t border-black/5 p-4 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-zinc-50 border border-black/5 rounded-2xl px-5 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-zinc-300 transition"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:hover:bg-zinc-950 shadow-md shadow-black/10"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-400">
                <div>
                  <Building2 className="mx-auto mb-4 text-zinc-200" size={48} />
                  <h3 className="text-lg font-serif font-medium text-zinc-700">No active chat</h3>
                  <p className="text-sm max-w-sm mt-1">Select a conversation from the sidebar or click &ldquo;Contact Seller&rdquo; on any property detail modal.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
