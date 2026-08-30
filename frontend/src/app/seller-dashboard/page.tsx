"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Plus,
  RefreshCw,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  LayoutDashboard,
  Building,
  Users,
  Calendar,
  HelpCircle,
  Check,
  X,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { getMyProperties } from "@/services/properties";
import { Property } from "@/types/property";
import GEBChatModal from "@/components/chat/GEBChatModal";
import { supabase } from "@/lib/supabase/client";
import {
  Conversation,
  listConversations,
  sendChatMessage,
  updateConversationMode,
  getConversationMessages,
} from "@/services/conversations";

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inboxOpen, setInboxOpen] = useState(false);

  // CRM Tabs & Data
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "properties"
    | "leads"
    | "conversations"
    | "followups"
    | "meetings"
  >("overview");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "properties", "leads", "conversations", "followups", "meetings"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [activeChatConversation, setActiveChatConversation] =
    useState<Conversation | null>(null);

  const [selectedPropertyForDetail, setSelectedPropertyForDetail] = useState<Property | null>(null);
  const [lastMessages, setLastMessages] = useState<Record<string, { message: string; time: string }>>({});

  useEffect(() => {
    if (conversations.length > 0) {
      conversations.forEach(async (conv) => {
        try {
          const messages = await getConversationMessages(conv.id);
          if (messages.length > 0) {
            const last = messages[messages.length - 1];
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: {
                message: last.message,
                time: new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " · " + new Date(last.created_at).toLocaleDateString()
              },
            }));
          } else {
            setLastMessages((prev) => ({
              ...prev,
              [conv.id]: {
                message: "No messages yet.",
                time: new Date(conv.updated_at).toLocaleDateString()
              },
            }));
          }
        } catch (err) {
          console.error(`Failed to load messages for conversation ${conv.id}:`, err);
        }
      });
    }
  }, [conversations]);

  // loading states
  const [loadingCrm, setLoadingCrm] = useState(false);

  // detail states
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // inputs
  const [replyText, setReplyText] = useState("");
  const [replyingFollowupId, setReplyingFollowupId] = useState<string | null>(
    null
  );
  const [reschedulingMeetingId, setReschedulingMeetingId] = useState<
    string | null
  >(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");
      const data = await getMyProperties();
      setProperties(data);
    } catch (err: any) {
      console.error("Failed to load seller properties:", err);
      setError(err.message || "Unable to load your properties.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCrmData() {
    if (!user) return;
    try {
      setLoadingCrm(true);

      // 1. Fetch conversations
      const convs = await listConversations();
      setConversations(convs);

      // 2. Fetch leads
      const { data: leadsData, error: leadsErr } = await supabase
        .from("leads")
        .select(
          "*, property:properties(id, title, price, city, image, seller_id), buyer:profiles!leads_buyer_id_fkey(id, full_name, email)"
        )
        .eq("seller_id", user.id)
        .order("updated_at", { ascending: false });
      if (leadsErr) throw leadsErr;
      setLeads(leadsData || []);

      // 3. Fetch follow-ups
      const { data: followupsData, error: followupsErr } = await supabase
        .from("follow_ups")
        .select(
          "*, property:properties(id, title, price, city, image, seller_id), buyer:profiles!follow_ups_buyer_id_fkey(id, full_name, email)"
        )
        .eq("seller_id", user.id)
        .order("updated_at", { ascending: false });
      if (followupsErr) throw followupsErr;
      setFollowups(followupsData || []);

      // 4. Fetch meetings
      const { data: meetingsData, error: meetingsErr } = await supabase
        .from("meetings")
        .select(
          "*, property:properties(id, title, price, city, image, seller_id), buyer:profiles!meetings_buyer_id_fkey(id, full_name, email)"
        )
        .eq("seller_id", user.id)
        .order("updated_at", { ascending: false });
      if (meetingsErr) throw meetingsErr;
      setMeetings(meetingsData || []);
    } catch (err: any) {
      console.error("Failed to load CRM data:", err);
      setError(err.message || "Failed to load CRM dashboard details.");
    } finally {
      setLoadingCrm(false);
    }
  }

  async function handleTakeOver(conversationId: string) {
    try {
      const updated = await updateConversationMode(
        conversationId,
        "human_active"
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? updated : c))
      );
      if (selectedLead && selectedLead.conversation_id === conversationId) {
        setSelectedLead((prev: any) =>
          prev ? { ...prev, conversation: updated } : null
        );
      }
      loadCrmData();
      alert("AI Co-pilot turned off. You have taken over the conversation.");
    } catch (err: any) {
      alert(err.message || "Failed to take over conversation.");
    }
  }

  async function handleCloseLead(leadId: string) {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "closed", updated_at: new Date().toISOString() })
        .eq("id", leadId);
      if (error) throw error;

      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: "closed" } : l))
      );
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead((prev: any) => (prev ? { ...prev, status: "closed" } : null));
      }
      loadCrmData();
      alert("Lead marked as closed.");
    } catch (err: any) {
      alert(err.message || "Failed to close lead.");
    }
  }

  async function handleAnswerFollowup(followup: any, answerText: string) {
    if (!answerText.trim()) return;
    try {
      await sendChatMessage(followup.conversation_id, answerText);

      const { error } = await supabase
        .from("follow_ups")
        .update({
          status: "resolved",
          answered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", followup.id);
      if (error) throw error;

      setReplyingFollowupId(null);
      setReplyText("");
      loadCrmData();
      alert("Reply sent successfully and follow-up marked as resolved!");
    } catch (err: any) {
      alert(err.message || "Failed to submit follow-up response.");
    }
  }

  async function handleAcceptMeeting(meeting: any) {
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", meeting.id);
      if (error) throw error;

      await sendChatMessage(
        meeting.conversation_id,
        `Meeting request accepted by owner for ${meeting.requested_date} at ${meeting.requested_time}. Looking forward to seeing you!`
      );

      loadCrmData();
      alert("Meeting confirmed successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to confirm meeting.");
    }
  }

  async function handleRejectMeeting(meeting: any) {
    try {
      const { error } = await supabase
        .from("meetings")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", meeting.id);
      if (error) throw error;

      await sendChatMessage(
        meeting.conversation_id,
        `Meeting request declined by owner for ${meeting.requested_date} at ${meeting.requested_time}. Please suggest another time.`
      );

      loadCrmData();
      alert("Meeting request declined.");
    } catch (err: any) {
      alert(err.message || "Failed to decline meeting.");
    }
  }

  async function handleRescheduleMeeting(
    meeting: any,
    newDate: string,
    newTime: string
  ) {
    if (!newDate.trim() || !newTime.trim()) return;
    try {
      const { error } = await supabase
        .from("meetings")
        .update({
          status: "rescheduled",
          requested_date: newDate,
          requested_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", meeting.id);
      if (error) throw error;

      await sendChatMessage(
        meeting.conversation_id,
        `Meeting rescheduled by owner to ${newDate} at ${newTime}. Please let me know if this works.`
      );

      setReschedulingMeetingId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      loadCrmData();
      alert("Meeting request rescheduled.");
    } catch (err: any) {
      alert(err.message || "Failed to reschedule meeting.");
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadProperties();
      loadCrmData();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950" />
          <p className="text-sm font-medium text-zinc-500">
            Loading your account...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="max-w-md rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-xl">
          <Building2 className="mx-auto mb-5" size={32} />
          <h1 className="font-serif text-4xl font-medium">Sign in required</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Sign in to view and manage properties you have listed on GEB.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft size={15} />
            Back to GEB
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
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
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
              Seller Portal
            </p>
            <h1 className="font-serif text-5xl font-medium tracking-tight md:text-6xl">
              GEB Seller CRM
            </h1>
            <p className="mt-3 text-zinc-500">
              Manage your property listings, view client leads, answer questions,
              and coordinate visits.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (conversations.length > 0) {
                  setActiveChatConversation(conversations[0]);
                }
                setInboxOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold hover:bg-zinc-50 transition shadow-sm"
            >
              <MessageSquare size={17} />
              Inbox / Messages
            </button>

            <Link
              href="/list-property"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={17} />
              List New Property
            </Link>
          </div>
        </div>
      </section>

      {/* CRM TAB NAVIGATION */}
      <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
        <div className="flex border-b border-black/5 overflow-x-auto scrollbar-none gap-8">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "properties", label: "My Properties", icon: Building },
            { id: "leads", label: "Leads", icon: Users },
            { id: "conversations", label: "Conversations", icon: MessageSquare },
            { id: "followups", label: "Follow-ups", icon: HelpCircle },
            { id: "meetings", label: "Meetings", icon: Calendar },
          ].map((tab) => {
            const ActiveIcon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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

      {/* CRM BODY */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Active Listings",
                  value: properties.filter((p) => p.status === "active").length,
                  color: "border-zinc-200 bg-white",
                },
                {
                  label: "New Leads",
                  value: leads.filter((l) => l.status === "new").length,
                  color: "border-blue-200 bg-blue-50/50",
                },
                {
                  label: "Open Follow-ups",
                  value: followups.filter((f) => f.status === "open").length,
                  color: "border-amber-200 bg-amber-50/50",
                },
                {
                  label: "Active Conversations",
                  value: conversations.length,
                  color: "border-purple-200 bg-purple-50/50",
                },
                {
                  label: "Pending Visit Requests",
                  value: meetings.filter((m) => m.status === "pending").length,
                  color: "border-rose-200 bg-rose-50/50",
                },
                {
                  label: "Confirmed Visits",
                  value: meetings.filter((m) => m.status === "confirmed").length,
                  color: "border-emerald-200 bg-emerald-50/50",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`rounded-3xl border p-6 transition duration-300 hover:shadow-md ${stat.color}`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-zinc-900">
                    {loadingCrm || loading ? "—" : stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-[2.5rem] border border-black/10 bg-white p-6 md:p-8">
              <h3 className="font-serif text-2xl font-semibold mb-6">
                Recent CRM Actions
              </h3>
              {loadingCrm ? (
                <div className="flex h-32 items-center justify-center text-zinc-400">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  <span>Loading latest events...</span>
                </div>
              ) : leads.length === 0 &&
                meetings.length === 0 &&
                followups.length === 0 ? (
                <p className="text-sm text-zinc-400 italic">
                  No recent CRM events. Buyer requests will appear here
                  automatically.
                </p>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 2).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 border border-black/5"
                    >
                      <div className="truncate pr-4">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                          New Lead
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          {lead.buyer?.full_name || lead.buyer?.email}
                        </span>
                        <span className="text-xs text-zinc-500"> is interested in </span>
                        <span className="text-sm font-bold text-zinc-900">
                          {lead.property?.title}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setActiveTab("leads");
                        }}
                        className="text-xs font-bold text-zinc-900 underline shrink-0"
                      >
                        View Lead
                      </button>
                    </div>
                  ))}

                  {meetings
                    .filter((m) => m.status === "pending")
                    .slice(0, 2)
                    .map((meet) => (
                      <div
                        key={meet.id}
                        className="flex justify-between items-center p-4 rounded-2xl bg-zinc-50 border border-black/5"
                      >
                        <div className="truncate pr-4">
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full mr-2">
                            Visit Request
                          </span>
                          <span className="text-sm font-semibold text-zinc-900">
                            {meet.buyer?.full_name || meet.buyer?.email}
                          </span>
                          <span className="text-xs text-zinc-500"> proposed </span>
                          <span className="text-sm font-bold text-zinc-900">
                            {meet.requested_date} at {meet.requested_time}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab("meetings")}
                          className="text-xs font-bold text-zinc-900 underline shrink-0"
                        >
                          Manage Visits
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY PROPERTIES TAB */}
        {activeTab === "properties" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-3xl font-medium">My listings</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Only properties owned by your account appear here.
                </p>
              </div>

              <button
                onClick={loadProperties}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-zinc-100 disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {error ? (
              <div className="rounded-[2.5rem] border border-red-100 bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-red-500">
                  Unable to load your listings
                </p>
                <p className="mt-2 text-sm text-zinc-500">{error}</p>
                <button
                  onClick={loadProperties}
                  className="mt-5 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white"
                  >
                    <div className="h-64 animate-pulse bg-zinc-200" />
                    <div className="space-y-3 p-5">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-[2.5rem] border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
                <Building2 className="mx-auto mb-4 text-zinc-300" size={36} />
                <h3 className="text-xl font-semibold">
                  No properties listed yet
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Start by listing your first property on GEB.
                </p>
                <Link
                  href="/list-property"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  <Plus size={16} />
                  List Property
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-[2.5rem] border border-black/10 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-64 bg-zinc-100">
                        {property.image ? (
                          <img
                            src={property.image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-300">
                            <ImageIcon size={40} />
                          </div>
                        )}
                        <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold capitalize shadow-sm border backdrop-blur-sm ${
                          property.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : property.status === "pending_review"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {property.status ? property.status.replace("_", " ") : "active"}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="truncate text-lg font-semibold">
                          {property.title}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-400">
                          {property.propertyType}
                        </p>

                        <p className="mt-4 text-2xl font-semibold">
                          ₹{property.price.toLocaleString("en-IN")}
                        </p>

                        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                          <MapPin size={15} />
                          <span className="truncate">
                            {property.locality ? `${property.locality}, ` : ""}
                            {property.city}
                          </span>
                        </div>

                        <div className="mt-3 text-sm text-zinc-400">
                          {property.area
                            ? `${property.area.toLocaleString("en-IN")} ${property.areaUnit}`
                            : "Area not specified"}
                        </div>

                        {property.rejectionReason && (
                          <div className={`mt-4 p-3 rounded-2xl text-xs font-semibold leading-normal border ${
                            property.status === 'pending_review' 
                              ? 'bg-amber-50 text-amber-800 border-amber-100' 
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            <span className="font-bold">Moderation feedback:</span> {property.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-black/5 mt-4">
                      <div className="flex gap-2 justify-between text-[10px] font-bold text-zinc-500 pt-4">
                        <span className="bg-zinc-50 border border-black/5 px-2.5 py-1.5 rounded-full">
                          Leads:{" "}
                          {leads.filter((l) => l.property_id === property.id).length}
                        </span>
                        <span className="bg-zinc-50 border border-black/5 px-2.5 py-1.5 rounded-full">
                          Chats:{" "}
                          {
                            conversations.filter(
                              (c) => c.property_id === property.id
                            ).length
                          }
                        </span>
                        <span className="bg-zinc-50 border border-black/5 px-2.5 py-1.5 rounded-full">
                          Meetings:{" "}
                          {
                            meetings.filter((m) => m.property_id === property.id)
                              .length
                          }
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            setSelectedPropertyForDetail(property);
                          }}
                          className="flex-1 text-center bg-zinc-950 text-white hover:bg-zinc-800 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("conversations");
                          }}
                          className="flex-1 text-center border border-black/10 hover:bg-zinc-50 py-2 rounded-xl text-xs font-bold transition shadow-sm bg-white"
                        >
                          Messages
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === "leads" && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h3 className="font-serif text-2xl font-semibold mb-4">
                Active Purchase Leads
              </h3>
              {loadingCrm ? (
                <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                  <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                  <span>Loading leads...</span>
                </div>
              ) : leads.length === 0 ? (
                <div className="p-12 text-center bg-white border border-black/5 rounded-3xl text-zinc-400">
                  No purchase leads logged yet.
                </div>
              ) : (
                <div className="grid gap-4">
                  {leads.map((lead) => {
                    const active = selectedLead?.id === lead.id;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-5 rounded-3xl border cursor-pointer transition duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          active
                            ? "border-zinc-950 bg-white ring-1 ring-zinc-950 shadow-md"
                            : "border-black/5 bg-white hover:border-zinc-300 shadow-sm"
                        }`}
                      >
                        <div>
                          <h4 className="text-sm font-bold text-zinc-950">
                            {lead.buyer?.full_name || lead.buyer?.email}
                          </h4>
                          <p className="text-xs font-semibold text-zinc-500 mt-0.5">
                            🏡 {lead.property?.title} · ₹
                            {Number(lead.property?.price).toLocaleString("en-IN")}
                          </p>
                          {lead.intent && (
                            <p className="text-xs text-zinc-400 mt-2 italic font-medium">
                              &ldquo;{lead.intent}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                          <span
                            className={`text-[10px] font-bold px-3 py-1 rounded-full capitalize ${
                              lead.status === "new"
                                ? "bg-blue-50 text-blue-700"
                                : lead.status === "closed"
                                ? "bg-zinc-100 text-zinc-500"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {lead.status}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold">
                            {new Date(lead.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedLead && (
              <div className="w-full lg:w-96 shrink-0 bg-white border border-black/10 rounded-[2.5rem] p-6 shadow-xl space-y-6 self-start">
                <div className="flex justify-between items-center pb-4 border-b border-black/5">
                  <h4 className="font-serif text-lg font-bold">Lead Details</h4>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-zinc-400 hover:text-zinc-600 font-bold text-lg"
                  >
                    ×
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Buyer Information
                  </p>
                  <p className="text-sm font-bold text-zinc-900 mt-1">
                    {selectedLead.buyer?.full_name || "Buyer"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedLead.buyer?.email}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Property Details
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 mt-1">
                    {selectedLead.property?.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedLead.property?.city} · ₹
                    {Number(selectedLead.property?.price).toLocaleString("en-IN")}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    AI Co-pilot Status
                  </p>
                  {(() => {
                    const conv = conversations.find(
                      (c) => c.id === selectedLead.conversation_id
                    );
                    if (!conv)
                      return (
                        <p className="text-xs text-zinc-500 mt-1">
                          No active conversation.
                        </p>
                      );
                    return (
                      <div className="flex items-center justify-between mt-2 bg-zinc-50 p-2.5 rounded-2xl border border-black/5">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold capitalize ${
                            conv.mode === "ai_active"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {conv.mode === "ai_active" ? "AI Active" : "Seller Active"}
                        </span>
                        {conv.mode === "ai_active" && (
                          <button
                            onClick={() => handleTakeOver(conv.id)}
                            className="text-[10px] font-bold bg-zinc-950 text-white px-3 py-1.5 rounded-xl hover:bg-zinc-800 transition"
                          >
                            Take Over
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const conv = conversations.find(
                        (c) => c.id === selectedLead.conversation_id
                      );
                      if (conv) {
                        setActiveChatConversation(conv);
                        setInboxOpen(true);
                      } else {
                        alert("Conversation details not loaded.");
                      }
                    }}
                    className="w-full text-center bg-zinc-950 text-white hover:bg-zinc-800 py-3.5 rounded-2xl text-xs font-bold transition shadow-sm"
                  >
                    Open Chat
                  </button>

                  {selectedLead.status !== "closed" && (
                    <button
                      onClick={() => handleCloseLead(selectedLead.id)}
                      className="w-full text-center border border-red-200 text-red-600 hover:bg-red-50 py-3.5 rounded-2xl text-xs font-bold transition"
                    >
                      Close Lead
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONVERSATIONS TAB */}
        {activeTab === "conversations" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">
              Buyer Conversations
            </h3>
            {loadingCrm ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-black/5 rounded-3xl text-zinc-400">
                No active conversations yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {conversations.map((conv) => {
                  const partner = conv.buyer.full_name || conv.buyer.email || "Anonymous";
                  const lastMsg = lastMessages[conv.id];
                  return (
                    <div
                      key={conv.id}
                      className="p-5 rounded-[2rem] border border-black/5 bg-white shadow-sm hover:border-zinc-300 transition duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900">
                            {partner}
                          </h4>
                          {lastMsg && (
                            <span className="text-[9px] text-zinc-400 font-semibold">
                              ({lastMsg.time})
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-zinc-500 mt-0.5">
                          🏡 {conv.property.title} {conv.property.locality ? `· ${conv.property.locality}` : ""}
                        </p>
                        {lastMsg && (
                          <p className="text-xs text-zinc-600 bg-zinc-50 border border-black/5 p-3 rounded-2xl mt-3 font-semibold leading-relaxed max-w-2xl">
                            &ldquo;{lastMsg.message}&rdquo;
                          </p>
                        )}
                        <span
                          className={`inline-block text-[9px] px-2.5 py-1 rounded-full capitalize font-semibold mt-3 ${
                            conv.mode === "ai_active"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {conv.mode === "ai_active" ? "AI Active" : "Seller Active"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                        <button
                          onClick={() => {
                            setActiveChatConversation(conv);
                            setInboxOpen(true);
                          }}
                          className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-bold px-5 py-3 rounded-2xl transition shadow-sm"
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

        {/* FOLLOW-UPS TAB */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">
              Buyer Questions (AI Escalations)
            </h3>
            {loadingCrm ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading follow-ups...</span>
              </div>
            ) : followups.length === 0 ? (
              <div className="p-12 text-center bg-white border border-black/5 rounded-3xl text-zinc-400">
                No AI follow-ups flagged yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {followups.map((fu) => (
                  <div
                    key={fu.id}
                    className="p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full capitalize mr-2 ${
                            fu.status === "open"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {fu.status}
                        </span>
                        <span className="text-xs font-bold text-zinc-900">
                          From {fu.buyer?.full_name || fu.buyer?.email}
                        </span>
                        <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                          🏡 {fu.property?.title}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {new Date(fu.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-black/5 p-4 rounded-2xl text-xs font-semibold text-zinc-700">
                      &ldquo;{fu.question}&rdquo;
                    </div>

                    {fu.status === "open" ? (
                      <div className="space-y-2">
                        {replyingFollowupId === fu.id ? (
                          <div className="space-y-2 pt-2">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Type your answer to send to the buyer..."
                              className="w-full border border-black/10 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-zinc-300 bg-zinc-50/50"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setReplyingFollowupId(null)}
                                className="px-4 py-2 border border-black/10 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() =>
                                  handleAnswerFollowup(fu, replyText)
                                }
                                disabled={!replyText.trim()}
                                className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
                              >
                                Send Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingFollowupId(fu.id);
                              setReplyText("");
                            }}
                            className="text-xs font-bold bg-zinc-950 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition shadow-sm"
                          >
                            Answer Query
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-zinc-400 italic">
                        Resolved on{" "}
                        {new Date(fu.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEETINGS TAB */}
        {activeTab === "meetings" && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-semibold mb-4">
              Visit Scheduling Requests
            </h3>
            {loadingCrm ? (
              <div className="p-12 text-center text-zinc-400 bg-white border border-black/5 rounded-3xl">
                <Loader2 className="animate-spin mx-auto mb-2 text-zinc-300" size={24} />
                <span>Loading meetings...</span>
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-12 text-center bg-white border border-black/5 rounded-3xl text-zinc-400">
                No scheduling requests logged yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {meetings.map((meet) => (
                  <div
                    key={meet.id}
                    className="p-5 rounded-3xl border border-black/5 bg-white shadow-sm space-y-4"
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
                        <span className="text-xs font-bold text-zinc-900">
                          Requested by {meet.buyer?.full_name || meet.buyer?.email}
                        </span>
                        <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                          🏡 {meet.property?.title}
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {new Date(meet.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-black/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs font-semibold">
                      <div>
                        <p className="text-zinc-500">Proposed Schedule:</p>
                        <p className="text-zinc-900 font-bold mt-1 text-sm">
                          📅 {meet.requested_date} at {meet.requested_time}
                        </p>
                      </div>

                      {meet.status === "pending" && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => handleAcceptMeeting(meet)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            onClick={() => handleRejectMeeting(meet)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-red-100 transition"
                          >
                            <X size={14} /> Decline
                          </button>
                          <button
                            onClick={() => {
                              setReschedulingMeetingId(meet.id);
                              setRescheduleDate("");
                              setRescheduleTime("");
                            }}
                            className="border border-black/10 hover:bg-zinc-50 text-zinc-900 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm bg-white"
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                    </div>

                    {reschedulingMeetingId === meet.id && (
                      <div className="p-4 border border-black/10 rounded-2xl bg-zinc-50/50 space-y-3 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Propose New Visit Time
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="text"
                            placeholder="e.g. Saturday (or 2026-09-05)"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="flex-1 min-w-[150px] border border-black/10 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-zinc-300"
                          />
                          <input
                            type="text"
                            placeholder="e.g. 2 PM (or TBD)"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="flex-1 min-w-[150px] border border-black/10 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-zinc-300"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => setReschedulingMeetingId(null)}
                            className="px-4 py-2 border border-black/10 rounded-xl text-xs font-semibold hover:bg-zinc-50 transition bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              handleRescheduleMeeting(
                                meet,
                                rescheduleDate,
                                rescheduleTime
                              )
                            }
                            disabled={
                              !rescheduleDate.trim() || !rescheduleTime.trim()
                            }
                            className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition disabled:opacity-50"
                          >
                            Submit Change
                          </button>
                        </div>
                      </div>
                    )}
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

      <GEBChatModal
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        directConversation={activeChatConversation}
        initialMode="seller"
      />

      {/* PROPERTY DETAILS MODAL */}
      {selectedPropertyForDetail && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPropertyForDetail(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative">
              {selectedPropertyForDetail.image && (
                <img
                  src={selectedPropertyForDetail.image}
                  alt={selectedPropertyForDetail.title}
                  className="h-72 w-full object-cover md:h-96"
                />
              )}

              <button
                onClick={() => setSelectedPropertyForDetail(null)}
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
                    ₹{selectedPropertyForDetail.price.toLocaleString("en-IN")}
                  </p>

                  <h2 className="mt-2 font-serif text-4xl font-medium tracking-tight">
                    {selectedPropertyForDetail.title}
                  </h2>

                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin size={16} />
                    {selectedPropertyForDetail.locality ? `${selectedPropertyForDetail.locality}, ` : ""}
                    {selectedPropertyForDetail.city}
                  </div>
                </div>
              </div>

              {selectedPropertyForDetail.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold">About this property</h3>
                  <p className="mt-2 leading-7 text-zinc-500">{selectedPropertyForDetail.description}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedPropertyForDetail(null)}
                  className="rounded-full border border-zinc-200 px-6 py-3 font-semibold transition hover:bg-zinc-50 bg-white"
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
