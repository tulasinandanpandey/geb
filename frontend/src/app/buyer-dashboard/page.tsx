"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  MessageSquare,
  Calendar,
  HelpCircle,
  Heart,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { getProperties } from "@/services/properties";
import { Property } from "@/types/property";
import GEBChatModal from "@/components/chat/GEBChatModal";
import { supabase } from "@/lib/supabase/client";
import {
  Conversation,
  listConversations,
  getConversationMessages,
} from "@/services/conversations";

export default function BuyerDashboard() {
  const { user, loading: authLoading, roles } = useAuth();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "profile" | "conversations" | "saved" | "followups" | "meetings"
  >("profile");

  // Data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  
  // Loading & error states
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatConversation, setActiveChatConversation] = useState<Conversation | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Initialize active tab from query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "conversations", "saved", "followups", "meetings"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Load all buyer-specific data
  async function loadBuyerData() {
    if (!user) return;
    try {
      setLoadingData(true);
      setError("");

      // 1. Fetch conversations
      const allConvs = await listConversations();
      // Filter to show conversations where the logged-in user is the buyer
      const buyerConvs = allConvs.filter((c) => String(c.buyer_id) === String(user.id));
      setConversations(buyerConvs);

      // 2. Fetch followups from Supabase
      const { data: followupsData, error: followupsErr } = await supabase
        .from("follow_ups")
        .select("*, property:properties(id, title, price, city, image, locality), seller:profiles!follow_ups_seller_id_fkey(id, full_name, email)")
        .eq("buyer_id", user.id)
        .order("updated_at", { ascending: false });
      if (followupsErr) throw followupsErr;
      setFollowups(followupsData || []);

      // 3. Fetch meetings from Supabase
      const { data: meetingsData, error: meetingsErr } = await supabase
        .from("meetings")
        .select("*, property:properties(id, title, price, city, image, locality), seller:profiles!meetings_seller_id_fkey(id, full_name, email)")
        .eq("buyer_id", user.id)
        .order("updated_at", { ascending: false });
      if (meetingsErr) throw meetingsErr;
      setMeetings(meetingsData || []);

      // 4. Fetch saved properties from localStorage
      const savedIdsStr = localStorage.getItem("geb_saved_properties");
      if (savedIdsStr) {
        const savedIds: string[] = JSON.parse(savedIdsStr);
        if (savedIds.length > 0) {
          const allProps = await getProperties();
          const filtered = allProps.filter((p) => savedIds.includes(p.id));
          setSavedProperties(filtered);
        } else {
          setSavedProperties([]);
        }
      } else {
        setSavedProperties([]);
      }

    } catch (err: any) {
      console.error("Error loading buyer dashboard details:", err);
      setError(err.message || "Failed to load dashboard details.");
    } finally {
      setLoadingData(false);
    }
  }

  // Fetch last message for each conversation
  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(async (conv) => {
        try {
          const messages = await getConversationMessages(conv.id);
          if (messages.length > 0) {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: messages[messages.length - 1].message,
            }));
          } else {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: "No messages yet.",
            }));
          }
        } catch (err) {
          console.error(`Failed to load messages for conversation ${conv.id}:`, err);
        }
      });
    }
  }, [conversations]);

  useEffect(() => {
    if (!authLoading && user) {
      loadBuyerData();
    }
  }, [authLoading, user]);

  const handleOpenConversation = (conv: Conversation) => {
    setActiveChatConversation(conv);
    setChatOpen(true);
  };

  const handleToggleSaveProperty = (propertyId: string) => {
    const savedIdsStr = localStorage.getItem("geb_saved_properties");
    let savedIds: string[] = savedIdsStr ? JSON.parse(savedIdsStr) : [];
    if (savedIds.includes(propertyId)) {
      savedIds = savedIds.filter((id) => id !== propertyId);
      setSavedProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } else {
      savedIds.push(propertyId);
    }
    localStorage.setItem("geb_saved_properties", JSON.stringify(savedIds));
    if (selectedProperty && selectedProperty.id === propertyId) {
      setSelectedProperty(null);
    }
    loadBuyerData();
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-zinc-950" />
          <p className="text-sm font-medium text-zinc-500">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="max-w-md rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl">
          <User className="mx-auto mb-5 text-zinc-400" size={32} />
          <h1 className="font-serif text-4xl font-medium">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sign in to view your profile, contacted sellers, and scheduled visits.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      {/* NAVBAR */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-sm font-bold text-white">
            G
          </div>
          <span className="text-xl font-bold tracking-tight">GEB</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50 transition shadow-sm"
        >
          <ArrowLeft size={15} />
          Back to GEB
        </Link>
      </nav>

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-6 pb-6 pt-10 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Buyer Portal
            </p>
            <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
              My GEB Account
            </h1>
            <p className="mt-3 text-zinc-500">
              Manage your personal real estate discovery account, contacted properties, follow-ups, and scheduled visits.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadBuyerData}
              disabled={loadingData}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold hover:bg-zinc-50 transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
        <div className="flex border-b border-black/5 overflow-x-auto scrollbar-none gap-8">
          {[
            { id: "profile", label: "My Profile", icon: User },
            { id: "conversations", label: "Contacted Sellers", icon: MessageSquare },
            { id: "saved", label: "Saved Properties", icon: Heart },
            { id: "followups", label: "My Follow-ups", icon: HelpCircle },
            { id: "meetings", label: "My Meetings", icon: Calendar },
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  startTransition(() => {
                    setActiveTab(tab.id as any);
                  });
                }}
                className={`flex items-center gap-2 pb-4 pt-2 text-sm font-semibold border-b-2 transition shrink-0 ${
                  active
                    ? "border-zinc-950 text-zinc-950 font-bold"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <ActiveIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* DASHBOARD BODY */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="max-w-2xl rounded-[2.5rem] border border-black/10 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-2xl font-semibold mb-6">Profile Settings</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email Address</p>
                <p className="text-sm font-semibold mt-1">{user.email}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Full Name</p>
                <p className="text-sm font-semibold mt-1">
                  {user.user_metadata?.full_name || "GEB User"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Account Capabilities</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-zinc-100 border border-black/5 px-3 py-1 text-[11px] font-bold capitalize text-zinc-600"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <Link
                  href="/capabilities"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Adjust My Capabilities / Roles
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">Contacted Sellers</h3>
            {loadingData ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-[2.5rem] text-zinc-500">
                <MessageSquare className="mx-auto mb-4 text-zinc-300" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t contacted any sellers yet.</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Browse listed properties on our platform and click &ldquo;Contact Seller&rdquo; to begin a conversation.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 max-w-4xl">
                {conversations.map((conv) => {
                  const sellerName = conv.seller.full_name || conv.seller.email || "Verified Seller";
                  return (
                    <div
                      key={conv.id}
                      className="p-5 rounded-[2rem] border border-black/5 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition duration-300"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        {conv.property.image && (
                          <img
                            src={conv.property.image}
                            alt=""
                            className="h-14 w-14 object-cover rounded-2xl shrink-0 border border-black/5"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-zinc-900 truncate">
                            {conv.property.title}
                          </h4>
                          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                            {conv.property.city} · Seller: {sellerName}
                          </p>
                          {lastMessages[conv.id] && (
                            <p className="text-xs text-zinc-400 mt-2 font-medium truncate italic max-w-xs md:max-w-md">
                              Last Message: &ldquo;{lastMessages[conv.id]}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => handleOpenConversation(conv)}
                          className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
                        >
                          Open Chat
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SAVED PROPERTIES TAB */}
        {activeTab === "saved" && (
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-6">Saved Properties</h3>
            {loadingData ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading properties...</span>
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-[2.5rem] text-zinc-500">
                <Heart className="mx-auto mb-4 text-zinc-300" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t saved any properties yet.</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Click the bookmark/heart button on property details modals to save properties here for easy access.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedProperties.map((property) => (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 bg-zinc-100">
                        {property.image ? (
                          <img
                            src={property.image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-300">
                            <Building2 size={30} />
                          </div>
                        )}
                        <button
                          onClick={() => handleToggleSaveProperty(property.id)}
                          className="absolute right-3 top-3 p-2 rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </div>

                      <div className="p-5">
                        <h3 className="truncate font-semibold text-zinc-900">{property.title}</h3>
                        <p className="mt-1 text-xs text-zinc-400 capitalize">
                          {property.propertyType}
                        </p>
                        <p className="mt-3 text-lg font-bold text-zinc-950">
                          ₹{property.price.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                          <MapPin size={13} />
                          <span className="truncate">
                            {property.locality ? `${property.locality}, ` : ""}
                            {property.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 mt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="flex-1 bg-zinc-950 text-white hover:bg-zinc-800 font-bold py-2.5 rounded-xl text-xs transition"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWUPS TAB */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">My Follow-up Queries</h3>
            {loadingData ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading follow-ups...</span>
              </div>
            ) : followups.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-[2.5rem] text-zinc-500">
                <HelpCircle className="mx-auto mb-4 text-zinc-300" size={32} />
                <h4 className="text-base font-semibold">No pending follow-ups.</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  When you ask legal or custom questions to the Seller AI Agent, it flags them as follow-ups for the human seller to answer.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {followups.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-5 rounded-[2rem] border border-black/5 bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            fu.status === "open"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {fu.status}
                        </span>
                        <span className="text-xs font-bold text-zinc-500">
                          🏡 {fu.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {new Date(fu.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-black/5 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">My Question:</p>
                      <p className="text-xs font-semibold text-zinc-700 mt-1">&ldquo;{fu.question}&rdquo;</p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-zinc-500 font-medium">
                        {fu.status === "open" ? (
                          <span className="text-amber-600 font-bold">Pending response from owner.</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Answered! Seller replied in chat history.</span>
                        )}
                      </p>
                      {conversations.find((c) => c.id === fu.conversation_id) && (
                        <button
                          onClick={() => {
                            const conv = conversations.find((c) => c.id === fu.conversation_id);
                            if (conv) handleOpenConversation(conv);
                          }}
                          className="text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl transition"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === "meetings" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">My Scheduled Visits</h3>
            {loadingData ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-[2.5rem] text-zinc-500">
                <Calendar className="mx-auto mb-4 text-zinc-300" size={32} />
                <h4 className="text-base font-semibold">No upcoming meetings.</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  When you request site visits, they will show up here along with their scheduling details and status.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {meetings.map((meet) => (
                  <div
                    key={meet.id}
                    className="p-5 rounded-[2rem] border border-black/5 bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            meet.status === "pending"
                              ? "bg-rose-50 text-rose-700"
                              : meet.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {meet.status}
                        </span>
                        <span className="text-xs font-bold text-zinc-500">
                          🏡 {meet.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {new Date(meet.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-black/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs font-semibold">
                      <div>
                        <p className="text-zinc-500">Scheduled Date & Time:</p>
                        <p className="text-zinc-900 font-bold mt-1 text-sm">
                          📅 {meet.requested_date} at {meet.requested_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-zinc-500 font-semibold">
                        {meet.status === "pending" && "Waiting for seller approval."}
                        {meet.status === "confirmed" && "Confirmed! Looking forward to your visit."}
                        {meet.status === "rescheduled" && "Rescheduled. Seller proposed a new slot."}
                        {meet.status === "rejected" && "Visit declined by seller."}
                      </p>
                      {conversations.find((c) => c.id === meet.conversation_id) && (
                        <button
                          onClick={() => {
                            const conv = conversations.find((c) => c.id === meet.conversation_id);
                            if (conv) handleOpenConversation(conv);
                          }}
                          className="text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl transition"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/5 px-6 py-8 text-center text-sm text-zinc-400">
        © 2026 GEB · Global Estate Bridge
      </footer>

      {/* CHAT MODAL */}
      <GEBChatModal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        directConversation={activeChatConversation}
        initialMode="buyer"
      />

      {/* PROPERTY DETAILS MODAL */}
      {selectedProperty && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProperty(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              {selectedProperty.image && (
                <img
                  src={selectedProperty.image}
                  alt={selectedProperty.title}
                  className="h-72 w-full object-cover md:h-96"
                />
              )}

              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl font-medium shadow-lg transition hover:bg-white"
                aria-label="Close property details"
              >
                ×
              </button>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-3xl font-bold tracking-tight">
                    ₹{selectedProperty.price.toLocaleString("en-IN")}
                  </p>

                  <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight">
                    {selectedProperty.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin size={16} />
                    {selectedProperty.locality ? `${selectedProperty.locality}, ` : ""}
                    {selectedProperty.city}
                  </div>
                </div>
              </div>

              {selectedProperty.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">About this property</h3>
                  <p className="mt-2 leading-7 text-zinc-500">{selectedProperty.description}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleToggleSaveProperty(selectedProperty.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 px-6 py-3 font-semibold transition hover:bg-zinc-50"
                >
                  <Heart size={16} fill="currentColor" className="text-red-500" />
                  Unsave Property
                </button>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-full border border-zinc-200 px-6 py-3 font-semibold transition hover:bg-zinc-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
