"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
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

import Navbar from "@/components/layout/Navbar";
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

function BuyerDashboardContent() {
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
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--ink)]" />
          <p className="text-sm font-medium text-[var(--ink-soft)]">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-6">
        <div className="max-w-md rounded-[2rem] border border-[var(--stone-line)] bg-white p-8 text-center shadow-xl">
          <User className="mx-auto mb-5 text-[var(--ink-soft)]" size={32} />
          <h1 className="font-display text-4xl font-medium">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Sign in to view your profile, contacted sellers, and scheduled visits.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--copper-700)]"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <Navbar />

      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 85% 0%, var(--copper-100), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-6 pt-12 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--copper-700)]">
                Buyer Portal
              </p>
              <h1 className="font-display text-5xl font-medium tracking-tight md:text-6xl">
                My GEB Account
              </h1>
              <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
                Manage your personal real estate discovery account, contacted properties, follow-ups, and scheduled visits.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadBuyerData}
                disabled={loadingData}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--stone-line)] bg-white px-5 py-3 text-sm font-semibold hover:border-[var(--copper-400)] transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={loadingData ? "animate-spin" : ""} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[var(--stone-line)] bg-white p-1.5 scrollbar-none">
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
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition shrink-0 ${
                  active
                    ? "bg-[var(--ink)] text-white font-bold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
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
          <div className="max-w-2xl rounded-[2.5rem] border border-[var(--stone-line)] bg-white p-6 md:p-8 shadow-sm">
            <h3 className="font-display text-2xl font-semibold mb-6">Profile Settings</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Email Address</p>
                <p className="text-sm font-semibold mt-1">{user.email}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Full Name</p>
                <p className="text-sm font-semibold mt-1">
                  {user.user_metadata?.full_name || "GEB User"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Account Capabilities</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-[var(--paper)] border border-[var(--stone-line)] px-3 py-1 text-[11px] font-bold capitalize text-[var(--ink-soft)]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--stone-line)]">
                <Link
                  href="/capabilities"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
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
            <h3 className="font-display text-2xl font-semibold mb-4">Contacted Sellers</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <MessageSquare className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t contacted any sellers yet.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  Browse listed properties on our platform and click &ldquo;Contact Seller&rdquo; to begin a conversation.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
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
                      className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition duration-300"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        {conv.property.image && (
                          <img
                            src={conv.property.image}
                            alt=""
                            className="h-14 w-14 object-cover rounded-2xl shrink-0 border border-[var(--stone-line)]"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[var(--ink)] truncate">
                            {conv.property.title}
                          </h4>
                          <p className="text-xs text-[var(--ink-soft)] font-semibold mt-0.5">
                            {conv.property.city} · Seller: {sellerName}
                          </p>
                          {lastMessages[conv.id] && (
                            <p className="text-xs text-[var(--ink-soft)] mt-2 font-medium truncate italic max-w-xs md:max-w-md">
                              Last Message: &ldquo;{lastMessages[conv.id]}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => handleOpenConversation(conv)}
                          className="bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
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
            <h3 className="font-display text-2xl font-semibold mb-6">Saved Properties</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading properties...</span>
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <Heart className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">You haven&apos;t saved any properties yet.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  Click the bookmark/heart button on property details modals to save properties here for easy access.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--copper-700)]"
                >
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedProperties.map((property) => (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 bg-[var(--paper)]">
                        {property.image ? (
                          <img
                            src={property.image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[var(--ink-soft)]">
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
                        <h3 className="truncate font-semibold text-[var(--ink)]">{property.title}</h3>
                        <p className="mt-1 text-xs text-[var(--ink-soft)] capitalize">
                          {property.propertyType}
                        </p>
                        <p className="mt-3 text-lg font-bold text-[var(--ink)]">
                          ₹{property.price.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
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
                        className="flex-1 bg-[var(--ink)] text-white hover:bg-[var(--copper-700)] font-bold py-2.5 rounded-xl text-xs transition"
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
            <h3 className="font-display text-2xl font-semibold mb-4">My Follow-up Queries</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading follow-ups...</span>
              </div>
            ) : followups.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <HelpCircle className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">No pending follow-ups.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  When you ask legal or custom questions to the Seller AI Agent, it flags them as follow-ups for the human seller to answer.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {followups.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm space-y-4"
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
                        <span className="text-xs font-bold text-[var(--ink-soft)]">
                          🏡 {fu.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-soft)] font-semibold">
                        {new Date(fu.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-[var(--paper)] border border-[var(--stone-line)] p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">My Question:</p>
                      <p className="text-xs font-semibold text-[var(--ink-soft)] mt-1">&ldquo;{fu.question}&rdquo;</p>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-[var(--ink-soft)] font-medium">
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
                          className="text-xs font-bold bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white px-4 py-2.5 rounded-xl transition"
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
            <h3 className="font-display text-2xl font-semibold mb-4">My Scheduled Visits</h3>
            {loadingData ? (
              <div className="p-12 text-center text-[var(--ink-soft)] bg-white border border-[var(--stone-line)] rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-[var(--ink-soft)]" size={24} />
                <span>Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-dashed border-[var(--stone-line)] rounded-[2.5rem] text-[var(--ink-soft)]">
                <Calendar className="mx-auto mb-4 text-[var(--ink-soft)]" size={32} />
                <h4 className="text-base font-semibold">No upcoming meetings.</h4>
                <p className="text-xs text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
                  When you request site visits, they will show up here along with their scheduling details and status.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-w-3xl">
                {meetings.map((meet) => (
                  <div
                    key={meet.id}
                    className="p-5 rounded-[2rem] border border-[var(--stone-line)] bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            meet.status === "pending"
                              ? "bg-rose-50 text-rose-700"
                              : meet.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[var(--paper)] text-[var(--ink-soft)]"
                          }`}
                        >
                          {meet.status}
                        </span>
                        <span className="text-xs font-bold text-[var(--ink-soft)]">
                          🏡 {meet.property?.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-soft)] font-semibold">
                        {new Date(meet.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-[var(--paper)] border border-[var(--stone-line)] p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs font-semibold">
                      <div>
                        <p className="text-[var(--ink-soft)]">Scheduled Date & Time:</p>
                        <p className="text-[var(--ink)] font-bold mt-1 text-sm">
                          📅 {meet.requested_date} at {meet.requested_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-[var(--ink-soft)] font-semibold">
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
                          className="text-xs font-bold bg-[var(--ink)] hover:bg-[var(--copper-700)] text-white px-4 py-2.5 rounded-xl transition"
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
      <footer className="border-t border-[var(--stone-line)] px-6 py-8 text-center text-sm text-[var(--ink-soft)]">
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

                  <h2 className="mt-2 font-display text-4xl font-medium tracking-tight">
                    {selectedProperty.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                    <MapPin size={16} />
                    {selectedProperty.locality ? `${selectedProperty.locality}, ` : ""}
                    {selectedProperty.city}
                  </div>
                </div>
              </div>

              {selectedProperty.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">About this property</h3>
                  <p className="mt-2 leading-7 text-[var(--ink-soft)]">{selectedProperty.description}</p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleToggleSaveProperty(selectedProperty.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--stone-line)] px-6 py-3 font-semibold transition hover:bg-[var(--paper)]"
                >
                  <Heart size={16} fill="currentColor" className="text-red-500" />
                  Unsave Property
                </button>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="rounded-full border border-[var(--stone-line)] px-6 py-3 font-semibold transition hover:bg-[var(--paper)]"
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

export default function BuyerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <BuyerDashboardContent />
    </Suspense>
  );
}
